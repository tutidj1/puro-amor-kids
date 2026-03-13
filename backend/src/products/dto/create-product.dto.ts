import { z } from 'zod';

export const CreateProductSchema = z.object({
    productTypeId: z.number().int().positive(),
    name: z.string().min(1).max(200),
    slug: z
        .string()
        .min(1)
        .max(250)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-safe lowercase'),
    description: z.string().max(5000).optional(),
    basePrice: z.number().nonnegative(),
    brand: z.string().max(100).optional(),
    isFeatured: z.boolean().default(false),
    tags: z.array(z.string().max(50)).default([]),
    variants: z
        .array(
            z.object({
                sku: z.string().min(1).max(100),
                size: z.string().min(1).max(20),
                color: z.string().min(1).max(50),
                colorHex: z
                    .string()
                    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color')
                    .optional(),
                priceOffset: z.number().default(0),
            }),
        )
        .min(1, 'At least one variant is required'),
});

export type CreateProductDto = z.infer<typeof CreateProductSchema>;

// ── Filter ──
export const ProductFilterSchema = z.object({
    productTypeId: z.coerce.number().int().positive().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT', 'DISCONTINUED']).optional(),
    isFeatured: z
        .string()
        .transform((v) => v === 'true')
        .optional(),
    search: z.string().max(200).optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().nonnegative().optional(),
});

export type ProductFilterDto = z.infer<typeof ProductFilterSchema>;
