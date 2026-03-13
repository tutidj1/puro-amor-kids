import {
    Injectable,
    Logger,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { Order, OrderItem, StockLocation } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from '../stock/stock.service';
import {
    buildWhatsAppOrderUrl,
    type WhatsAppOrderData,
} from '../common/utils/whatsapp.util';
import type { CreateOrderDto, ResolvedOrderItem } from './dto/create-order.dto';

// ── Types ──
export interface OrderConfirmationResult {
    readonly order: Order;
    readonly whatsappUrl: string;
}

export type OrderWithItems = Order & {
    readonly items: OrderItem[];
    readonly customer: { firstName: string; lastName: string; phone: string };
};

@Injectable()
export class OrderService {
    private readonly logger = new Logger(OrderService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly stockService: StockService,
    ) { }

    // ════════════════════════════════════════════════════════════
    // POST /orders — Create Order with PENDING_PAYMENT status
    //
    // Flow:
    // 1. Resolve live prices → snapshot into OrderItems
    // 2. Check stock availability (read-only, no reservation yet)
    // 3. Create Order (status: PENDING_PAYMENT)
    // 4. Create OrderItems with frozen price snapshots
    // 5. Reserve stock (optimistic lock per variant)
    // 6. Create ShippingDetails
    //
    // The order is now waiting for admin payment confirmation.
    // ════════════════════════════════════════════════════════════

    async createOrder(dto: CreateOrderDto): Promise<Order> {
        return this.prisma.$transaction(async (tx) => {
            // ── Step 1: Resolve live prices from product catalog ──
            const resolvedItems = await this.resolveOrderItems(dto, tx);

            // ── Step 2: Calculate totals ──
            const subtotal = resolvedItems.reduce(
                (sum, item) => sum.add(item.totalPrice),
                new Decimal(0),
            );
            const shippingCost = new Decimal(0); // TODO: Shipping calculator
            const discountAmount = new Decimal(0); // TODO: Discount engine
            const totalAmount = subtotal.add(shippingCost).sub(discountAmount);

            // ── Step 3: Create Order (PENDING_PAYMENT) ──
            const order = await tx.order.create({
                data: {
                    customerId: dto.customerId,
                    status: 'PENDING_PAYMENT',
                    subtotal,
                    shippingCost,
                    discountAmount,
                    totalAmount,
                    paymentMethod: dto.paymentMethod,
                    customerNote: dto.customerNote,
                },
            });

            this.logger.log(
                `Order #${order.id} created — status=PENDING_PAYMENT, total=${totalAmount.toFixed(2)} ARS`,
            );

            // ── Step 4: Create OrderItems (price + product snapshots) ──
            await tx.orderItem.createMany({
                data: resolvedItems.map((item) => ({
                    orderId: order.id,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice,
                    productName: item.productName,
                    variantSku: item.variantSku,
                    variantSize: item.variantSize,
                    variantColor: item.variantColor,
                })),
            });

            // ── Step 5: Reserve stock (optimistic lock per variant) ──
            const reservations = dto.items.map((item) => ({
                variantId: item.variantId,
                quantity: item.quantity,
                location: 'ONLINE' as StockLocation,
            }));

            await this.stockService.reserveStockForOrder(reservations, tx);

            // ── Step 6: Create ShippingDetails ──
            await tx.shippingDetails.create({
                data: {
                    orderId: order.id,
                    shippingType: dto.shipping.type,
                    streetAddress: dto.shipping.streetAddress,
                    apartment: dto.shipping.apartment,
                    city: dto.shipping.city,
                    province: dto.shipping.province,
                    zipCode: dto.shipping.zipCode,
                    deliveryNote: dto.shipping.deliveryNote,
                    pickupLocationName: dto.shipping.pickupLocationName,
                },
            });

            this.logger.log(
                `Order #${order.id} fully created: ${resolvedItems.length} items, stock reserved`,
            );

            return order;
        });
    }

    // ════════════════════════════════════════════════════════════
    // PATCH /admin/orders/:id/confirm — Admin Confirms Payment
    //
    // Called after admin validates WhatsApp payment proof.
    //
    // Transaction:
    // 1. Validate order is PENDING_PAYMENT
    // 2. Deduct stock (quantity -= item.quantity) with optimistic lock
    // 3. Release reservation (reserved -= item.quantity)
    // 4. Write InventoryLog audit entries
    // 5. Update order → PAID + set paidAt
    // 6. Generate WhatsApp confirmation URL
    //
    // If ANY step fails → entire transaction rolls back.
    // ════════════════════════════════════════════════════════════

    async confirmPayment(orderId: number): Promise<OrderConfirmationResult> {
        const order = await this.prisma.$transaction(async (tx) => {
            // ── Step 1: Fetch order + items + customer ──
            const existingOrder = await tx.order.findUnique({
                where: { id: orderId },
                include: {
                    items: true,
                    customer: true,
                },
            });

            if (!existingOrder) {
                throw new NotFoundException(`Order #${orderId} not found`);
            }

            if (existingOrder.status !== 'PENDING_PAYMENT') {
                throw new ConflictException(
                    `Order #${orderId} cannot be confirmed — current status is "${existingOrder.status}". ` +
                    `Only orders with status "PENDING_PAYMENT" can be confirmed.`,
                );
            }

            // ── Step 2 & 3: Deduct stock + release reservation per item ──
            for (const item of existingOrder.items) {
                const stock = await tx.stock.findUnique({
                    where: {
                        variantId_location: {
                            variantId: item.variantId,
                            location: 'ONLINE',
                        },
                    },
                });

                if (!stock) {
                    throw new NotFoundException(
                        `No stock record for variant ${item.variantId} at ONLINE location`,
                    );
                }

                // Validate physical stock covers the order
                if (stock.quantity < item.quantity) {
                    throw new ConflictException(
                        `Insufficient physical stock for variant ${item.variantId} ` +
                        `(SKU: ${item.variantSku}): have ${stock.quantity}, need ${item.quantity}`,
                    );
                }

                // ── Optimistic lock: deduct quantity + release reservation atomically ──
                const updated = await tx.stock.updateMany({
                    where: {
                        id: stock.id,
                        version: stock.version, // Concurrency guard
                    },
                    data: {
                        quantity: { decrement: item.quantity },
                        reserved: { decrement: item.quantity },
                        version: { increment: 1 },
                    },
                });

                if (updated.count === 0) {
                    throw new ConflictException(
                        `Concurrency conflict on stock for variant ${item.variantId} ` +
                        `(SKU: ${item.variantSku}). Another process modified the stock. Please retry.`,
                    );
                }

                // ── Step 4: Immutable audit log ──
                await tx.inventoryLog.create({
                    data: {
                        stockId: stock.id,
                        reason: 'SALE',
                        quantityDelta: -item.quantity,
                        quantityAfter: stock.quantity - item.quantity,
                        note: `Payment confirmed — Order #${orderId}`,
                        orderId: existingOrder.id,
                        performedBy: 'admin', // TODO: Extract from auth context
                    },
                });
            }

            // ── Step 5: Update order status → PAID ──
            const paidOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    status: 'PAID',
                    paidAt: new Date(),
                },
                include: {
                    items: true,
                    customer: true,
                },
            });

            this.logger.log(
                `Order #${orderId} confirmed — status=PAID, items=${paidOrder.items.length}`,
            );

            return paidOrder as OrderWithItems;
        });

        // ── Step 6: Generate WhatsApp confirmation URL (outside TX) ──
        const whatsappData: WhatsAppOrderData = {
            orderId: order.id,
            customerName: `${order.customer.firstName} ${order.customer.lastName}`,
            totalAmount: order.totalAmount.toFixed(2),
            itemCount: order.items.length,
        };

        const whatsappUrl = buildWhatsAppOrderUrl(
            order.customer.phone,
            whatsappData,
        );

        this.logger.log(`WhatsApp URL generated for order #${orderId}`);

        return { order, whatsappUrl };
    }

    // ════════════════════════════════════════════════════════════
    // Cancel Order — Release reserved stock
    // ════════════════════════════════════════════════════════════

    async cancelOrder(orderId: number): Promise<Order> {
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true },
            });

            if (!order) {
                throw new NotFoundException(`Order #${orderId} not found`);
            }

            if (order.status !== 'PENDING_PAYMENT') {
                throw new ConflictException(
                    `Only PENDING_PAYMENT orders can be cancelled. Current status: ${order.status}`,
                );
            }

            // Release reserved stock
            for (const item of order.items) {
                const stock = await tx.stock.findUnique({
                    where: {
                        variantId_location: {
                            variantId: item.variantId,
                            location: 'ONLINE',
                        },
                    },
                });

                if (stock) {
                    await this.stockService.releaseReservation(
                        stock.id,
                        item.quantity,
                        orderId,
                        tx,
                    );
                }
            }

            return tx.order.update({
                where: { id: orderId },
                data: { status: 'CANCELLED' },
            });
        });
    }

    // ════════════════════════════════════════════════════════════
    // Get Order by ID (with full includes)
    // ════════════════════════════════════════════════════════════

    async getOrderById(orderId: number): Promise<OrderWithItems> {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: true,
                customer: true,
                shippingDetails: true,
                transactions: true,
            },
        });

        if (!order) {
            throw new NotFoundException(`Order #${orderId} not found`);
        }

        return order as OrderWithItems;
    }

    // ════════════════════════════════════════════════════════════
    // PRIVATE: Resolve live prices → immutable snapshots
    // ════════════════════════════════════════════════════════════

    private async resolveOrderItems(
        dto: CreateOrderDto,
        tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    ): Promise<ResolvedOrderItem[]> {
        const resolved: ResolvedOrderItem[] = [];

        for (const item of dto.items) {
            const variant = await tx.productVariant.findUnique({
                where: { id: item.variantId },
                include: { product: true },
            });

            if (!variant) {
                throw new NotFoundException(
                    `Product variant ${item.variantId} not found`,
                );
            }

            if (!variant.isActive) {
                throw new ConflictException(
                    `Variant ${variant.sku} is no longer active`,
                );
            }

            if (variant.product.status !== 'ACTIVE') {
                throw new ConflictException(
                    `Product "${variant.product.name}" is not available (status: ${variant.product.status})`,
                );
            }

            // Freeze the price: basePrice + priceOffset
            const unitPrice = variant.product.basePrice.add(variant.priceOffset);
            const totalPrice = unitPrice.mul(item.quantity);

            resolved.push({
                variantId: variant.id,
                quantity: item.quantity,
                unitPrice,
                totalPrice,
                productName: variant.product.name,
                variantSku: variant.sku,
                variantSize: variant.size,
                variantColor: variant.color,
            });
        }

        return resolved;
    }
}
