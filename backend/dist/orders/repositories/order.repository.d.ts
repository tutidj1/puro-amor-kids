import { Prisma, Order, OrderItem } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { TransactionClient } from '../../stock/repositories/stock.repository';
export type OrderWithItems = Order & {
    items: OrderItem[];
};
export declare class OrderRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: number, tx?: TransactionClient): Promise<OrderWithItems | null>;
    create(data: Prisma.OrderCreateInput, tx?: TransactionClient): Promise<Order>;
    createItems(items: Prisma.OrderItemCreateManyInput[], tx?: TransactionClient): Promise<Prisma.BatchPayload>;
    updateStatus(id: number, data: Prisma.OrderUpdateInput, tx?: TransactionClient): Promise<Order>;
}
