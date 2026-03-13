import { z } from 'zod';
export declare const CreateProductSchema: z.ZodObject<{
    productTypeId: z.ZodNumber;
    name: z.ZodString;
    slug: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    basePrice: z.ZodNumber;
    brand: z.ZodOptional<z.ZodString>;
    isFeatured: z.ZodDefault<z.ZodBoolean>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    variants: z.ZodArray<z.ZodObject<{
        sku: z.ZodString;
        size: z.ZodString;
        color: z.ZodString;
        colorHex: z.ZodOptional<z.ZodString>;
        priceOffset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        sku: string;
        size: string;
        color: string;
        priceOffset: number;
        colorHex?: string | undefined;
    }, {
        sku: string;
        size: string;
        color: string;
        colorHex?: string | undefined;
        priceOffset?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    productTypeId: number;
    name: string;
    slug: string;
    basePrice: number;
    isFeatured: boolean;
    tags: string[];
    variants: {
        sku: string;
        size: string;
        color: string;
        priceOffset: number;
        colorHex?: string | undefined;
    }[];
    description?: string | undefined;
    brand?: string | undefined;
}, {
    productTypeId: number;
    name: string;
    slug: string;
    basePrice: number;
    variants: {
        sku: string;
        size: string;
        color: string;
        colorHex?: string | undefined;
        priceOffset?: number | undefined;
    }[];
    description?: string | undefined;
    brand?: string | undefined;
    isFeatured?: boolean | undefined;
    tags?: string[] | undefined;
}>;
export type CreateProductDto = z.infer<typeof CreateProductSchema>;
export declare const ProductFilterSchema: z.ZodObject<{
    productTypeId: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "INACTIVE", "DRAFT", "DISCONTINUED"]>>;
    isFeatured: z.ZodOptional<z.ZodEffects<z.ZodString, boolean, string>>;
    search: z.ZodOptional<z.ZodString>;
    minPrice: z.ZodOptional<z.ZodNumber>;
    maxPrice: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    search?: string | undefined;
    productTypeId?: number | undefined;
    isFeatured?: boolean | undefined;
    status?: "ACTIVE" | "INACTIVE" | "DRAFT" | "DISCONTINUED" | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
}, {
    search?: string | undefined;
    productTypeId?: number | undefined;
    isFeatured?: string | undefined;
    status?: "ACTIVE" | "INACTIVE" | "DRAFT" | "DISCONTINUED" | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
}>;
export type ProductFilterDto = z.infer<typeof ProductFilterSchema>;
