import { Injectable, Logger } from '@nestjs/common';
import {
    Stock,
    StockLocation,
    StockChangeReason,
    InventoryLog,
    Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Transaction-aware client type.
 * When called within `prisma.$transaction()`, the caller passes the `tx` client
 * so that all queries participate in the same transaction.
 */
export type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class StockRepository {
    private readonly logger = new Logger(StockRepository.name);

    constructor(private readonly prisma: PrismaService) { }

    // ── Reads ──

    async findById(
        id: number,
        tx?: TransactionClient,
    ): Promise<Stock | null> {
        const client = tx ?? this.prisma;
        return client.stock.findUnique({ where: { id } });
    }

    async findByVariantAndLocation(
        variantId: number,
        location: StockLocation,
        tx?: TransactionClient,
    ): Promise<Stock | null> {
        const client = tx ?? this.prisma;
        return client.stock.findUnique({
            where: {
                variantId_location: { variantId, location },
            },
        });
    }

    // ── Optimistic Lock Write ──

    /**
     * Atomically updates stock with optimistic locking.
     *
     * Uses `WHERE id = $id AND version = $expectedVersion`.
     * If no rows are matched (version stale), returns `null`.
     *
     * The `version` is incremented atomically as part of the same UPDATE statement,
     * preventing ABA problems.
     */
    async updateWithOptimisticLock(
        id: number,
        expectedVersion: number,
        data: {
            quantity?: number;
            reserved?: number;
        },
        tx?: TransactionClient,
    ): Promise<Stock | null> {
        const client = tx ?? this.prisma;

        // Prisma doesn't support compound WHERE on update, so we use updateMany
        // which returns a count. If count === 0, the version was stale.
        const updateData: Prisma.StockUpdateManyMutationInput = {
            version: { increment: 1 },
        };

        if (data.quantity !== undefined) {
            updateData.quantity = data.quantity;
        }
        if (data.reserved !== undefined) {
            updateData.reserved = data.reserved;
        }

        const result = await client.stock.updateMany({
            where: {
                id,
                version: expectedVersion,
            },
            data: updateData,
        });

        if (result.count === 0) {
            this.logger.warn(
                `Optimistic lock failure: stock ID=${id}, expected version=${expectedVersion}`,
            );
            return null;
        }

        // Fetch and return the updated row
        return client.stock.findUnique({ where: { id } });
    }

    // ── Audit Log ──

    async createLog(
        data: {
            stockId: number;
            reason: StockChangeReason;
            quantityDelta: number;
            quantityAfter: number;
            note?: string;
            orderId?: number;
            performedBy?: string;
        },
        tx?: TransactionClient,
    ): Promise<InventoryLog> {
        const client = tx ?? this.prisma;
        return client.inventoryLog.create({ data });
    }
}
