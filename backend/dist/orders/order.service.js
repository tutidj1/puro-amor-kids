"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OrderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const common_1 = require("@nestjs/common");
const library_1 = require("@prisma/client/runtime/library");
const prisma_service_1 = require("../prisma/prisma.service");
const stock_service_1 = require("../stock/stock.service");
const whatsapp_util_1 = require("../common/utils/whatsapp.util");
let OrderService = OrderService_1 = class OrderService {
    prisma;
    stockService;
    logger = new common_1.Logger(OrderService_1.name);
    constructor(prisma, stockService) {
        this.prisma = prisma;
        this.stockService = stockService;
    }
    async createOrder(dto) {
        return this.prisma.$transaction(async (tx) => {
            const resolvedItems = await this.resolveOrderItems(dto, tx);
            const subtotal = resolvedItems.reduce((sum, item) => sum.add(item.totalPrice), new library_1.Decimal(0));
            const shippingCost = new library_1.Decimal(0);
            const discountAmount = new library_1.Decimal(0);
            const totalAmount = subtotal.add(shippingCost).sub(discountAmount);
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
            this.logger.log(`Order #${order.id} created — status=PENDING_PAYMENT, total=${totalAmount.toFixed(2)} ARS`);
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
            const reservations = dto.items.map((item) => ({
                variantId: item.variantId,
                quantity: item.quantity,
                location: 'ONLINE',
            }));
            await this.stockService.reserveStockForOrder(reservations, tx);
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
            this.logger.log(`Order #${order.id} fully created: ${resolvedItems.length} items, stock reserved`);
            return order;
        });
    }
    async confirmPayment(orderId) {
        const order = await this.prisma.$transaction(async (tx) => {
            const existingOrder = await tx.order.findUnique({
                where: { id: orderId },
                include: {
                    items: true,
                    customer: true,
                },
            });
            if (!existingOrder) {
                throw new common_1.NotFoundException(`Order #${orderId} not found`);
            }
            if (existingOrder.status !== 'PENDING_PAYMENT') {
                throw new common_1.ConflictException(`Order #${orderId} cannot be confirmed — current status is "${existingOrder.status}". ` +
                    `Only orders with status "PENDING_PAYMENT" can be confirmed.`);
            }
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
                    throw new common_1.NotFoundException(`No stock record for variant ${item.variantId} at ONLINE location`);
                }
                if (stock.quantity < item.quantity) {
                    throw new common_1.ConflictException(`Insufficient physical stock for variant ${item.variantId} ` +
                        `(SKU: ${item.variantSku}): have ${stock.quantity}, need ${item.quantity}`);
                }
                const updated = await tx.stock.updateMany({
                    where: {
                        id: stock.id,
                        version: stock.version,
                    },
                    data: {
                        quantity: { decrement: item.quantity },
                        reserved: { decrement: item.quantity },
                        version: { increment: 1 },
                    },
                });
                if (updated.count === 0) {
                    throw new common_1.ConflictException(`Concurrency conflict on stock for variant ${item.variantId} ` +
                        `(SKU: ${item.variantSku}). Another process modified the stock. Please retry.`);
                }
                await tx.inventoryLog.create({
                    data: {
                        stockId: stock.id,
                        reason: 'SALE',
                        quantityDelta: -item.quantity,
                        quantityAfter: stock.quantity - item.quantity,
                        note: `Payment confirmed — Order #${orderId}`,
                        orderId: existingOrder.id,
                        performedBy: 'admin',
                    },
                });
            }
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
            this.logger.log(`Order #${orderId} confirmed — status=PAID, items=${paidOrder.items.length}`);
            return paidOrder;
        });
        const whatsappData = {
            orderId: order.id,
            customerName: `${order.customer.firstName} ${order.customer.lastName}`,
            totalAmount: order.totalAmount.toFixed(2),
            itemCount: order.items.length,
        };
        const whatsappUrl = (0, whatsapp_util_1.buildWhatsAppOrderUrl)(order.customer.phone, whatsappData);
        this.logger.log(`WhatsApp URL generated for order #${orderId}`);
        return { order, whatsappUrl };
    }
    async cancelOrder(orderId) {
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true },
            });
            if (!order) {
                throw new common_1.NotFoundException(`Order #${orderId} not found`);
            }
            if (order.status !== 'PENDING_PAYMENT') {
                throw new common_1.ConflictException(`Only PENDING_PAYMENT orders can be cancelled. Current status: ${order.status}`);
            }
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
                    await this.stockService.releaseReservation(stock.id, item.quantity, orderId, tx);
                }
            }
            return tx.order.update({
                where: { id: orderId },
                data: { status: 'CANCELLED' },
            });
        });
    }
    async getOrderById(orderId) {
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
            throw new common_1.NotFoundException(`Order #${orderId} not found`);
        }
        return order;
    }
    async resolveOrderItems(dto, tx) {
        const resolved = [];
        for (const item of dto.items) {
            const variant = await tx.productVariant.findUnique({
                where: { id: item.variantId },
                include: { product: true },
            });
            if (!variant) {
                throw new common_1.NotFoundException(`Product variant ${item.variantId} not found`);
            }
            if (!variant.isActive) {
                throw new common_1.ConflictException(`Variant ${variant.sku} is no longer active`);
            }
            if (variant.product.status !== 'ACTIVE') {
                throw new common_1.ConflictException(`Product "${variant.product.name}" is not available (status: ${variant.product.status})`);
            }
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
};
exports.OrderService = OrderService;
exports.OrderService = OrderService = OrderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        stock_service_1.StockService])
], OrderService);
//# sourceMappingURL=order.service.js.map