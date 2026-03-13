import { z } from 'zod';

export const AdjustStockSchema = z.object({
    stockId: z.number().int().positive(),
    delta: z.number().int().refine((v) => v !== 0, {
        message: 'Delta must be non-zero',
    }),
    reason: z.enum([
        'SALE',
        'RESTOCK',
        'MANUAL_ADJUST',
        'RETURN',
        'DAMAGED',
        'TRANSFER',
    ]),
    note: z.string().max(500).optional(),
    performedBy: z.string().max(100),
    orderId: z.number().int().positive().optional(),
});

export type AdjustStockDto = z.infer<typeof AdjustStockSchema>;
