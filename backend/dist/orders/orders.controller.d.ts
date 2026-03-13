import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
export declare class OrdersController {
    private readonly orderService;
    constructor(orderService: OrderService);
    create(createOrderDto: CreateOrderDto): Promise<{
        message: string;
        orderId: number;
        status: import(".prisma/client").$Enums.OrderStatus;
    }>;
    confirmPayment(id: number): Promise<{
        message: string;
        order: {
            status: import(".prisma/client").$Enums.OrderStatus;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            customerId: number;
            paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
            customerNote: string | null;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            shippingCost: import("@prisma/client/runtime/library").Decimal;
            discountAmount: import("@prisma/client/runtime/library").Decimal;
            notes: string | null;
            paidAt: Date | null;
            shippedAt: Date | null;
            deliveredAt: Date | null;
        };
        whatsappUrl: string;
    }>;
}
