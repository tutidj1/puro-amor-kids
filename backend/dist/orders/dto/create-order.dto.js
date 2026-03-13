"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateOrderSchema = exports.OrderItemInputSchema = void 0;
const zod_1 = require("zod");
exports.OrderItemInputSchema = zod_1.z.object({
    variantId: zod_1.z.number().int().positive(),
    quantity: zod_1.z.number().int().positive().max(100),
});
exports.CreateOrderSchema = zod_1.z.object({
    customerId: zod_1.z.number().int().positive(),
    paymentMethod: zod_1.z.enum([
        'MERCADOPAGO',
        'CASH',
        'CARD_DEBIT',
        'CARD_CREDIT',
        'BANK_TRANSFER',
    ]),
    customerNote: zod_1.z.string().max(1000).optional(),
    items: zod_1.z
        .array(exports.OrderItemInputSchema)
        .min(1, 'Order must have at least one item')
        .max(50, 'Order cannot exceed 50 line items'),
    shipping: zod_1.z.object({
        type: zod_1.z.enum(['PICKUP', 'HOME_DELIVERY']),
        streetAddress: zod_1.z.string().max(300).optional(),
        apartment: zod_1.z.string().max(100).optional(),
        city: zod_1.z.string().max(100).optional(),
        province: zod_1.z.string().max(100).optional(),
        zipCode: zod_1.z.string().max(20).optional(),
        deliveryNote: zod_1.z.string().max(500).optional(),
        pickupLocationName: zod_1.z.string().max(200).optional(),
    }),
}).refine((data) => {
    if (data.shipping.type === 'HOME_DELIVERY') {
        return !!(data.shipping.streetAddress &&
            data.shipping.city &&
            data.shipping.province);
    }
    if (data.shipping.type === 'PICKUP') {
        return !!data.shipping.pickupLocationName;
    }
    return true;
}, {
    message: 'HOME_DELIVERY requires streetAddress, city, and province. PICKUP requires pickupLocationName.',
    path: ['shipping'],
});
//# sourceMappingURL=create-order.dto.js.map