import { z } from 'zod';

// --- Customer Schema ---
export const CustomerSchema = z.object({
    firstName: z.string().min(2, 'El nombre es obligatorio'),
    lastName: z.string().min(2, 'El apellido es obligatorio'),
    dni: z.string().min(7, 'DNI inválido').max(15),
    phone: z.string().min(8, 'Teléfono inválido'),
    email: z.string().email('Email inválido').optional(),
});

export type Customer = z.infer<typeof CustomerSchema>;

// --- Shipping Schema ---
export const ShippingSchema = z.object({
    type: z.enum(['PICKUP', 'HOME_DELIVERY']),
    streetAddress: z.string().max(300).optional(),
    city: z.string().max(100).optional(),
    province: z.string().max(100).optional(),
    zipCode: z.string().max(20).optional(),
    deliveryNote: z.string().max(500).optional(),
    pickupLocationName: z.string().max(200).optional(),
}).refine((data) => {
    if (data.type === 'HOME_DELIVERY') {
        return !!(data.streetAddress && data.city && data.province);
    }
    if (data.type === 'PICKUP') {
        return !!data.pickupLocationName;
    }
    return true;
}, {
    message: 'Por favor complete los datos de envío requeridos',
    path: ['streetAddress'],
});

export type Shipping = z.infer<typeof ShippingSchema>;

// --- Product & Variant ---
export interface ProductVariant {
    id: number;
    sku: string;
    size: string;
    color: string;
    colorHex?: string;
    priceOffset: string;
    stock?: number;
}

export interface Product {
    id: number;
    name: string;
    slug: string;
    basePrice: string;
    description?: string;
    images: { url: string; isPrimary: boolean }[];
    variants: ProductVariant[];
}

// --- Order Items ---
export const OrderItemSchema = z.object({
    variantId: z.number(),
    quantity: z.number().min(1).max(99),
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

// --- Final Checkout Schema ---
export const CheckoutSchema = z.object({
    customer: CustomerSchema,
    shipping: ShippingSchema,
    paymentMethod: z.enum(['MERCADOPAGO', 'CASH', 'BANK_TRANSFER', 'CARD_DEBIT', 'CARD_CREDIT']),
});

export type CheckoutData = z.infer<typeof CheckoutSchema>;
