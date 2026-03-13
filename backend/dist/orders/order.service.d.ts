import { Order, OrderItem } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from '../stock/stock.service';
import type { CreateOrderDto } from './dto/create-order.dto';
export interface OrderConfirmationResult {
    readonly order: Order;
    readonly whatsappUrl: string;
}
export type OrderWithItems = Order & {
    readonly items: OrderItem[];
    readonly customer: {
        firstName: string;
        lastName: string;
        phone: string;
    };
};
export declare class OrderService {
    private readonly prisma;
    private readonly stockService;
    private readonly logger;
    constructor(prisma: PrismaService, stockService: StockService);
    createOrder(dto: CreateOrderDto): Promise<Order>;
    confirmPayment(orderId: number): Promise<OrderConfirmationResult>;
    cancelOrder(orderId: number): Promise<Order>;
    getOrderById(orderId: number): Promise<OrderWithItems>;
    private resolveOrderItems;
}
