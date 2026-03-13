import { StockLocation } from '@prisma/client';
import { StockRepository, TransactionClient } from './repositories/stock.repository';
import type { AdjustStockDto } from './dto/adjust-stock.dto';
export interface StockReservationItem {
    readonly variantId: number;
    readonly quantity: number;
    readonly location?: StockLocation;
}
export interface StockReservationResult {
    readonly stockId: number;
    readonly variantId: number;
    readonly reserved: number;
    readonly availableAfter: number;
}
export declare class StockService {
    private readonly stockRepository;
    private readonly logger;
    constructor(stockRepository: StockRepository);
    reserveStockForOrder(items: readonly StockReservationItem[], tx?: TransactionClient): Promise<StockReservationResult[]>;
    releaseReservation(stockId: number, quantity: number, orderId: number, tx?: TransactionClient): Promise<void>;
    adjustStock(dto: AdjustStockDto): Promise<void>;
    private reserveSingleItem;
    private executeWithRetry;
    private sleep;
}
