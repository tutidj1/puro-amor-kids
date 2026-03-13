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
var StockService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockService = void 0;
const common_1 = require("@nestjs/common");
const stock_repository_1 = require("./repositories/stock.repository");
const stock_conflict_exception_1 = require("./exceptions/stock-conflict.exception");
const insufficient_stock_exception_1 = require("./exceptions/insufficient-stock.exception");
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 50;
let StockService = StockService_1 = class StockService {
    stockRepository;
    logger = new common_1.Logger(StockService_1.name);
    constructor(stockRepository) {
        this.stockRepository = stockRepository;
    }
    async reserveStockForOrder(items, tx) {
        const results = [];
        for (const item of items) {
            const result = await this.reserveSingleItem(item, tx);
            results.push(result);
        }
        return results;
    }
    async releaseReservation(stockId, quantity, orderId, tx) {
        await this.executeWithRetry(stockId, async (currentStock) => {
            const newReserved = currentStock.reserved - quantity;
            if (newReserved < 0) {
                this.logger.error(`Release would make reserved negative: stock=${stockId}, current reserved=${currentStock.reserved}, releasing=${quantity}`);
                throw new Error(`Cannot release ${quantity} units from stock ${stockId} — only ${currentStock.reserved} are reserved`);
            }
            const updated = await this.stockRepository.updateWithOptimisticLock(stockId, currentStock.version, { reserved: newReserved }, tx);
            if (!updated) {
                return null;
            }
            await this.stockRepository.createLog({
                stockId,
                reason: 'RETURN',
                quantityDelta: 0,
                quantityAfter: updated.quantity,
                note: `Released ${quantity} reserved units for order #${orderId}`,
                orderId,
                performedBy: 'system',
            }, tx);
            return updated;
        }, tx);
    }
    async adjustStock(dto) {
        const stock = await this.stockRepository.findById(dto.stockId);
        if (!stock) {
            throw new common_1.NotFoundException(`Stock record with ID ${dto.stockId} not found`);
        }
        const newQuantity = stock.quantity + dto.delta;
        if (newQuantity < 0) {
            throw new insufficient_stock_exception_1.InsufficientStockException(stock.variantId, Math.abs(dto.delta), stock.quantity);
        }
        if (newQuantity < stock.reserved) {
            throw new insufficient_stock_exception_1.InsufficientStockException(stock.variantId, Math.abs(dto.delta), stock.quantity - stock.reserved);
        }
        await this.executeWithRetry(dto.stockId, async (currentStock) => {
            const updatedQuantity = currentStock.quantity + dto.delta;
            const updated = await this.stockRepository.updateWithOptimisticLock(dto.stockId, currentStock.version, { quantity: updatedQuantity });
            if (!updated) {
                return null;
            }
            await this.stockRepository.createLog({
                stockId: dto.stockId,
                reason: dto.reason,
                quantityDelta: dto.delta,
                quantityAfter: updated.quantity,
                note: dto.note,
                orderId: dto.orderId,
                performedBy: dto.performedBy,
            });
            return updated;
        });
    }
    async reserveSingleItem(item, tx) {
        const location = item.location ?? 'ONLINE';
        const result = await this.executeWithRetry(-1, async (_currentStock, isFirstAttempt) => {
            const stock = await this.stockRepository.findByVariantAndLocation(item.variantId, location, tx);
            if (!stock) {
                throw new common_1.NotFoundException(`No stock record for variant ${item.variantId} at location ${location}`);
            }
            const available = stock.quantity - stock.reserved;
            if (available < item.quantity) {
                throw new insufficient_stock_exception_1.InsufficientStockException(item.variantId, item.quantity, available);
            }
            if (isFirstAttempt) {
                this.logger.debug(`Reserving ${item.quantity} units: variant=${item.variantId}, available=${available}, version=${stock.version}`);
            }
            const newReserved = stock.reserved + item.quantity;
            const updated = await this.stockRepository.updateWithOptimisticLock(stock.id, stock.version, { reserved: newReserved }, tx);
            if (!updated) {
                return null;
            }
            return {
                stockId: updated.id,
                variantId: item.variantId,
                reserved: item.quantity,
                availableAfter: updated.quantity - updated.reserved,
            };
        }, tx);
        return result;
    }
    async executeWithRetry(stockId, operation, tx) {
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            let stock;
            if (stockId > 0) {
                stock = await this.stockRepository.findById(stockId, tx);
                if (!stock) {
                    throw new common_1.NotFoundException(`Stock record ${stockId} not found`);
                }
            }
            else {
                stock = { id: 0, quantity: 0, reserved: 0, version: 0, variantId: 0 };
            }
            const result = await operation(stock, attempt === 0);
            if (result !== null) {
                if (attempt > 0) {
                    this.logger.log(`Optimistic lock succeeded after ${attempt + 1} attempts (stock ID=${stockId})`);
                }
                return result;
            }
            if (attempt < MAX_RETRIES - 1) {
                const delay = BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 30;
                this.logger.warn(`Optimistic lock conflict (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${Math.round(delay)}ms...`);
                await this.sleep(delay);
            }
        }
        throw new stock_conflict_exception_1.StockConflictException(stockId, -1);
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
};
exports.StockService = StockService;
exports.StockService = StockService = StockService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [stock_repository_1.StockRepository])
], StockService);
//# sourceMappingURL=stock.service.js.map