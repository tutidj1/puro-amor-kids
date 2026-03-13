import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
export declare const OrderItemInputSchema: z.ZodObject<{
    variantId: z.ZodNumber;
    quantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    variantId: number;
    quantity: number;
}, {
    variantId: number;
    quantity: number;
}>;
export type OrderItemInput = z.infer<typeof OrderItemInputSchema>;
export declare const CreateOrderSchema: z.ZodEffects<z.ZodObject<{
    customerId: z.ZodNumber;
    paymentMethod: z.ZodEnum<["MERCADOPAGO", "CASH", "CARD_DEBIT", "CARD_CREDIT", "BANK_TRANSFER"]>;
    customerNote: z.ZodOptional<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        variantId: z.ZodNumber;
        quantity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        variantId: number;
        quantity: number;
    }, {
        variantId: number;
        quantity: number;
    }>, "many">;
    shipping: z.ZodObject<{
        type: z.ZodEnum<["PICKUP", "HOME_DELIVERY"]>;
        streetAddress: z.ZodOptional<z.ZodString>;
        apartment: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        province: z.ZodOptional<z.ZodString>;
        zipCode: z.ZodOptional<z.ZodString>;
        deliveryNote: z.ZodOptional<z.ZodString>;
        pickupLocationName: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "PICKUP" | "HOME_DELIVERY";
        streetAddress?: string | undefined;
        apartment?: string | undefined;
        city?: string | undefined;
        province?: string | undefined;
        zipCode?: string | undefined;
        deliveryNote?: string | undefined;
        pickupLocationName?: string | undefined;
    }, {
        type: "PICKUP" | "HOME_DELIVERY";
        streetAddress?: string | undefined;
        apartment?: string | undefined;
        city?: string | undefined;
        province?: string | undefined;
        zipCode?: string | undefined;
        deliveryNote?: string | undefined;
        pickupLocationName?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    customerId: number;
    paymentMethod: "MERCADOPAGO" | "CASH" | "CARD_DEBIT" | "CARD_CREDIT" | "BANK_TRANSFER";
    items: {
        variantId: number;
        quantity: number;
    }[];
    shipping: {
        type: "PICKUP" | "HOME_DELIVERY";
        streetAddress?: string | undefined;
        apartment?: string | undefined;
        city?: string | undefined;
        province?: string | undefined;
        zipCode?: string | undefined;
        deliveryNote?: string | undefined;
        pickupLocationName?: string | undefined;
    };
    customerNote?: string | undefined;
}, {
    customerId: number;
    paymentMethod: "MERCADOPAGO" | "CASH" | "CARD_DEBIT" | "CARD_CREDIT" | "BANK_TRANSFER";
    items: {
        variantId: number;
        quantity: number;
    }[];
    shipping: {
        type: "PICKUP" | "HOME_DELIVERY";
        streetAddress?: string | undefined;
        apartment?: string | undefined;
        city?: string | undefined;
        province?: string | undefined;
        zipCode?: string | undefined;
        deliveryNote?: string | undefined;
        pickupLocationName?: string | undefined;
    };
    customerNote?: string | undefined;
}>, {
    customerId: number;
    paymentMethod: "MERCADOPAGO" | "CASH" | "CARD_DEBIT" | "CARD_CREDIT" | "BANK_TRANSFER";
    items: {
        variantId: number;
        quantity: number;
    }[];
    shipping: {
        type: "PICKUP" | "HOME_DELIVERY";
        streetAddress?: string | undefined;
        apartment?: string | undefined;
        city?: string | undefined;
        province?: string | undefined;
        zipCode?: string | undefined;
        deliveryNote?: string | undefined;
        pickupLocationName?: string | undefined;
    };
    customerNote?: string | undefined;
}, {
    customerId: number;
    paymentMethod: "MERCADOPAGO" | "CASH" | "CARD_DEBIT" | "CARD_CREDIT" | "BANK_TRANSFER";
    items: {
        variantId: number;
        quantity: number;
    }[];
    shipping: {
        type: "PICKUP" | "HOME_DELIVERY";
        streetAddress?: string | undefined;
        apartment?: string | undefined;
        city?: string | undefined;
        province?: string | undefined;
        zipCode?: string | undefined;
        deliveryNote?: string | undefined;
        pickupLocationName?: string | undefined;
    };
    customerNote?: string | undefined;
}>;
export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;
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
