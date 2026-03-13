"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductFilterSchema = exports.CreateProductSchema = void 0;
const zod_1 = require("zod");
exports.CreateProductSchema = zod_1.z.object({
    productTypeId: zod_1.z.number().int().positive(),
    name: zod_1.z.string().min(1).max(200),
    slug: zod_1.z
        .string()
        .min(1)
        .max(250)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-safe lowercase'),
    description: zod_1.z.string().max(5000).optional(),
    basePrice: zod_1.z.number().nonnegative(),
    brand: zod_1.z.string().max(100).optional(),
    isFeatured: zod_1.z.boolean().default(false),
    tags: zod_1.z.array(zod_1.z.string().max(50)).default([]),
    variants: zod_1.z
        .array(zod_1.z.object({
        sku: zod_1.z.string().min(1).max(100),
        size: zod_1.z.string().min(1).max(20),
        color: zod_1.z.string().min(1).max(50),
        colorHex: zod_1.z
            .string()
            .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color')
            .optional(),
        priceOffset: zod_1.z.number().default(0),
    }))
        .min(1, 'At least one variant is required'),
});
exports.ProductFilterSchema = zod_1.z.object({
    productTypeId: zod_1.z.coerce.number().int().positive().optional(),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'DRAFT', 'DISCONTINUED']).optional(),
    isFeatured: zod_1.z
        .string()
        .transform((v) => v === 'true')
        .optional(),
    search: zod_1.z.string().max(200).optional(),
    minPrice: zod_1.z.coerce.number().nonnegative().optional(),
    maxPrice: zod_1.z.coerce.number().nonnegative().optional(),
});
//# sourceMappingURL=create-product.dto.js.map