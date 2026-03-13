import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';

// ── Order Item Input ──
export const OrderItemInputSchema = z.object({
    variantId: z.number().int().positive(),
    quantity: z.number().int().positive().max(100),
});

export type OrderItemInput = z.infer<typeof OrderItemInputSchema>;

// ── Create Order ──
export const CreateOrderSchema = z.object({
    customerId: z.number().int().positive(),
    paymentMethod: z.enum([
        'MERCADOPAGO',
        'CASH',
        'CARD_DEBIT',
        'CARD_CREDIT',
        'BANK_TRANSFER',
    ]),
    customerNote: z.string().max(1000).optional(),
    items: z
        .array(OrderItemInputSchema)
        .min(1, 'Order must have at least one item')
        .max(50, 'Order cannot exceed 50 line items'),
    shipping: z.object({
        type: z.enum(['PICKUP', 'HOME_DELIVERY']),
        // HOME_DELIVERY fields
        streetAddress: z.string().max(300).optional(),
        apartment: z.string().max(100).optional(),
        city: z.string().max(100).optional(),
        province: z.string().max(100).optional(),
        zipCode: z.string().max(20).optional(),
        deliveryNote: z.string().max(500).optional(),
        // PICKUP fields
        pickupLocationName: z.string().max(200).optional(),
    }),
}).refine(
    (data) => {
        if (data.shipping.type === 'HOME_DELIVERY') {
            return !!(
                data.shipping.streetAddress &&
                data.shipping.city &&
                data.shipping.province
            );
        }
        if (data.shipping.type === 'PICKUP') {
            return !!data.shipping.pickupLocationName;
        }
        return true;
    },
    {
        message:
            'HOME_DELIVERY requires streetAddress, city, and province. PICKUP requires pickupLocationName.',
        path: ['shipping'],
    },
);

export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;

// ── Resolved Order Item (internal, after price snapshot) ──
export interface ResolvedOrderItem {
    readonly variantId: number;
    readonly quantity: number;
    readonly unitPrice: Decimal;
    readonly totalPrice: Decimal;
    readonly productName: string;
    readonly variantSku: string;
    readonly variantSize: string;
    readonly variantColor: string;
}
