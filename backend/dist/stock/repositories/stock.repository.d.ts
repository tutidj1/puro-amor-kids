import { Stock, StockLocation, StockChangeReason, InventoryLog, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
export type TransactionClient = Prisma.TransactionClient;
export declare class StockRepository {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findById(id: number, tx?: TransactionClient): Promise<Stock | null>;
    findByVariantAndLocation(variantId: number, location: StockLocation, tx?: TransactionClient): Promise<Stock | null>;
    updateWithOptimisticLock(id: number, expectedVersion: number, data: {
        quantity?: number;
        reserved?: number;
    }, tx?: TransactionClient): Promise<Stock | null>;
    createLog(data: {
        stockId: number;
        reason: StockChangeReason;
        quantityDelta: number;
        quantityAfter: number;
        note?: string;
        orderId?: number;
        performedBy?: string;
    }, tx?: TransactionClient): Promise<InventoryLog>;
}
