import { z } from 'zod';
export declare const AdjustStockSchema: z.ZodObject<{
    stockId: z.ZodNumber;
    delta: z.ZodEffects<z.ZodNumber, number, number>;
    reason: z.ZodEnum<["SALE", "RESTOCK", "MANUAL_ADJUST", "RETURN", "DAMAGED", "TRANSFER"]>;
    note: z.ZodOptional<z.ZodString>;
    performedBy: z.ZodString;
    orderId: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    stockId: number;
    reason: "SALE" | "RESTOCK" | "MANUAL_ADJUST" | "RETURN" | "DAMAGED" | "TRANSFER";
    performedBy: string;
    delta: number;
    orderId?: number | undefined;
    note?: string | undefined;
}, {
    stockId: number;
    reason: "SALE" | "RESTOCK" | "MANUAL_ADJUST" | "RETURN" | "DAMAGED" | "TRANSFER";
    performedBy: string;
    delta: number;
    orderId?: number | undefined;
    note?: string | undefined;
}>;
export type AdjustStockDto = z.infer<typeof AdjustStockSchema>;
