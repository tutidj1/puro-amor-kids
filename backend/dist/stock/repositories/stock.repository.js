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
var StockRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let StockRepository = StockRepository_1 = class StockRepository {
    prisma;
    logger = new common_1.Logger(StockRepository_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id, tx) {
        const client = tx ?? this.prisma;
        return client.stock.findUnique({ where: { id } });
    }
    async findByVariantAndLocation(variantId, location, tx) {
        const client = tx ?? this.prisma;
        return client.stock.findUnique({
            where: {
                variantId_location: { variantId, location },
            },
        });
    }
    async updateWithOptimisticLock(id, expectedVersion, data, tx) {
        const client = tx ?? this.prisma;
        const updateData = {
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
            this.logger.warn(`Optimistic lock failure: stock ID=${id}, expected version=${expectedVersion}`);
            return null;
        }
        return client.stock.findUnique({ where: { id } });
    }
    async createLog(data, tx) {
        const client = tx ?? this.prisma;
        return client.inventoryLog.create({ data });
    }
};
exports.StockRepository = StockRepository;
exports.StockRepository = StockRepository = StockRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StockRepository);
//# sourceMappingURL=stock.repository.js.map