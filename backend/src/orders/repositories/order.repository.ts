import { Injectable } from '@nestjs/common';
import { Prisma, Order, OrderItem } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { TransactionClient } from '../../stock/repositories/stock.repository';

// ── Types ──
export type OrderWithItems = Order & { items: OrderItem[] };

@Injectable()
export class OrderRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findById(
        id: number,
        tx?: TransactionClient,
    ): Promise<OrderWithItems | null> {
        const client = tx ?? this.prisma;
        return client.order.findUnique({
            where: { id },
            include: {
                items: true,
                shippingDetails: true,
                transactions: true,
            },
        }) as Promise<OrderWithItems | null>;
    }

    async create(
        data: Prisma.OrderCreateInput,
        tx?: TransactionClient,
    ): Promise<Order> {
        const client = tx ?? this.prisma;
        return client.order.create({ data });
    }

    async createItems(
        items: Prisma.OrderItemCreateManyInput[],
        tx?: TransactionClient,
    ): Promise<Prisma.BatchPayload> {
        const client = tx ?? this.prisma;
        return client.orderItem.createMany({ data: items });
    }

    async updateStatus(
        id: number,
        data: Prisma.OrderUpdateInput,
        tx?: TransactionClient,
    ): Promise<Order> {
        const client = tx ?? this.prisma;
        return client.order.update({
            where: { id },
            data,
        });
    }
}
