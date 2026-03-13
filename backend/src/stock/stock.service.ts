import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { StockLocation, StockChangeReason } from '@prisma/client';
import { StockRepository, TransactionClient } from './repositories/stock.repository';
import { StockConflictException } from './exceptions/stock-conflict.exception';
import { InsufficientStockException } from './exceptions/insufficient-stock.exception';
import type { AdjustStockDto } from './dto/adjust-stock.dto';

// ── Constants ──
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 50;

// ── Types ──
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

/**
 * StockService — Core Stock Management with Optimistic Locking
 *
 * Race Condition Strategy:
 * ┌──────────────────────────────────────────────────────────┐
 * │ 1. Read stock row → get current `version`               │
 * │ 2. Validate availability (quantity - reserved >= needed) │
 * │ 3. UPDATE ... SET reserved = reserved + qty,             │
 * │         version = version + 1                            │
 * │    WHERE id = $id AND version = $knownVersion            │
 * │ 4. If 0 rows affected → version was stale → RETRY       │
 * │ 5. After MAX_RETRIES → throw StockConflictException      │
 * └──────────────────────────────────────────────────────────┘
 *
 * This avoids SELECT FOR UPDATE locks while maintaining data integrity
 * under concurrent checkouts.
 */
@Injectable()
export class StockService {
    private readonly logger = new Logger(StockService.name);

    constructor(private readonly stockRepository: StockRepository) { }

    // ════════════════════════════════════════════════════════════
    // PUBLIC: Reserve stock for a list of order items
    // Called within an interactive $transaction from OrderService
    // ════════════════════════════════════════════════════════════

    async reserveStockForOrder(
        items: readonly StockReservationItem[],
        tx?: TransactionClient,
    ): Promise<StockReservationResult[]> {
        const results: StockReservationResult[] = [];

        for (const item of items) {
            const result = await this.reserveSingleItem(item, tx);
            results.push(result);
        }

        return results;
    }

    // ════════════════════════════════════════════════════════════
    // PUBLIC: Release reservation (on order cancellation)
    // ════════════════════════════════════════════════════════════

    async releaseReservation(
        stockId: number,
        quantity: number,
        orderId: number,
        tx?: TransactionClient,
    ): Promise<void> {
        await this.executeWithRetry(
            stockId,
            async (currentStock) => {
                const newReserved = currentStock.reserved - quantity;

                if (newReserved < 0) {
                    this.logger.error(
                        `Release would make reserved negative: stock=${stockId}, current reserved=${currentStock.reserved}, releasing=${quantity}`,
                    );
                    throw new Error(
                        `Cannot release ${quantity} units from stock ${stockId} — only ${currentStock.reserved} are reserved`,
                    );
                }

                const updated = await this.stockRepository.updateWithOptimisticLock(
                    stockId,
                    currentStock.version,
                    { reserved: newReserved },
                    tx,
                );

                if (!updated) {
                    return null; // Signal retry
                }

                // Audit log
                await this.stockRepository.createLog(
                    {
                        stockId,
                        reason: 'RETURN',
                        quantityDelta: 0,
                        quantityAfter: updated.quantity,
                        note: `Released ${quantity} reserved units for order #${orderId}`,
                        orderId,
                        performedBy: 'system',
                    },
                    tx,
                );

                return updated;
            },
            tx,
        );
    }

    // ════════════════════════════════════════════════════════════
    // PUBLIC: Manual stock adjustment (admin)
    // ════════════════════════════════════════════════════════════

    async adjustStock(dto: AdjustStockDto): Promise<void> {
        const stock = await this.stockRepository.findById(dto.stockId);

        if (!stock) {
            throw new NotFoundException(`Stock record with ID ${dto.stockId} not found`);
        }

        const newQuantity = stock.quantity + dto.delta;

        if (newQuantity < 0) {
            throw new InsufficientStockException(
                stock.variantId,
                Math.abs(dto.delta),
                stock.quantity,
            );
        }

        if (newQuantity < stock.reserved) {
            throw new InsufficientStockException(
                stock.variantId,
                Math.abs(dto.delta),
                stock.quantity - stock.reserved,
            );
        }

        await this.executeWithRetry(dto.stockId, async (currentStock) => {
            const updatedQuantity = currentStock.quantity + dto.delta;

            const updated = await this.stockRepository.updateWithOptimisticLock(
                dto.stockId,
                currentStock.version,
                { quantity: updatedQuantity },
            );

            if (!updated) {
                return null; // Signal retry
            }

            await this.stockRepository.createLog({
                stockId: dto.stockId,
                reason: dto.reason as StockChangeReason,
                quantityDelta: dto.delta,
                quantityAfter: updated.quantity,
                note: dto.note,
                orderId: dto.orderId,
                performedBy: dto.performedBy,
            });

            return updated;
        });
    }

    // ════════════════════════════════════════════════════════════
    // PRIVATE: Reserve a single item with retry
    // ════════════════════════════════════════════════════════════

    private async reserveSingleItem(
        item: StockReservationItem,
        tx?: TransactionClient,
    ): Promise<StockReservationResult> {
        const location = item.location ?? 'ONLINE';

        const result = await this.executeWithRetry(
            -1, // Will be set after first read
            async (_currentStock, isFirstAttempt) => {
                // Read fresh stock state
                const stock = await this.stockRepository.findByVariantAndLocation(
                    item.variantId,
                    location,
                    tx,
                );

                if (!stock) {
                    throw new NotFoundException(
                        `No stock record for variant ${item.variantId} at location ${location}`,
                    );
                }

                // Availability check: quantity - reserved >= requested
                const available = stock.quantity - stock.reserved;
                if (available < item.quantity) {
                    throw new InsufficientStockException(
                        item.variantId,
                        item.quantity,
                        available,
                    );
                }

                if (isFirstAttempt) {
                    this.logger.debug(
                        `Reserving ${item.quantity} units: variant=${item.variantId}, available=${available}, version=${stock.version}`,
                    );
                }

                // Optimistic lock update
                const newReserved = stock.reserved + item.quantity;
                const updated = await this.stockRepository.updateWithOptimisticLock(
                    stock.id,
                    stock.version,
                    { reserved: newReserved },
                    tx,
                );

                if (!updated) {
                    return null; // Signal retry — version was stale
                }

                return {
                    stockId: updated.id,
                    variantId: item.variantId,
                    reserved: item.quantity,
                    availableAfter: updated.quantity - updated.reserved,
                };
            },
            tx,
        );

        return result;
    }

    // ════════════════════════════════════════════════════════════
    // PRIVATE: Retry engine with exponential backoff + jitter
    // ════════════════════════════════════════════════════════════

    /**
     * Executes an operation with optimistic lock retry logic.
     *
     * @param stockId - For logging (can be -1 if unknown until first read)
     * @param operation - Returns the result, or `null` to signal a retry
     * @param tx - Optional transaction client
     */
    private async executeWithRetry<T>(
        stockId: number,
        operation: (
            currentStock: { id: number; quantity: number; reserved: number; version: number; variantId: number },
            isFirstAttempt: boolean,
        ) => Promise<T | null>,
        tx?: TransactionClient,
    ): Promise<T> {
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            // Fetch latest state
            let stock;
            if (stockId > 0) {
                stock = await this.stockRepository.findById(stockId, tx);
                if (!stock) {
                    throw new NotFoundException(`Stock record ${stockId} not found`);
                }
            } else {
                // For reserveSingleItem, the operation itself does the read
                stock = { id: 0, quantity: 0, reserved: 0, version: 0, variantId: 0 };
            }

            const result = await operation(stock, attempt === 0);

            if (result !== null) {
                if (attempt > 0) {
                    this.logger.log(
                        `Optimistic lock succeeded after ${attempt + 1} attempts (stock ID=${stockId})`,
                    );
                }
                return result;
            }

            // Retry with exponential backoff + jitter
            if (attempt < MAX_RETRIES - 1) {
                const delay = BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 30;
                this.logger.warn(
                    `Optimistic lock conflict (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${Math.round(delay)}ms...`,
                );
                await this.sleep(delay);
            }
        }

        throw new StockConflictException(stockId, -1);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
