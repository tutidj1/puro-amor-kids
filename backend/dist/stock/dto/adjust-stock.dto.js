"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdjustStockSchema = void 0;
const zod_1 = require("zod");
exports.AdjustStockSchema = zod_1.z.object({
    stockId: zod_1.z.number().int().positive(),
    delta: zod_1.z.number().int().refine((v) => v !== 0, {
        message: 'Delta must be non-zero',
    }),
    reason: zod_1.z.enum([
        'SALE',
        'RESTOCK',
        'MANUAL_ADJUST',
        'RETURN',
        'DAMAGED',
        'TRANSFER',
    ]),
    note: zod_1.z.string().max(500).optional(),
    performedBy: zod_1.z.string().max(100),
    orderId: zod_1.z.number().int().positive().optional(),
});
//# sourceMappingURL=adjust-stock.dto.js.map