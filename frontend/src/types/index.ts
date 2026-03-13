import { z } from 'zod';

export type MainCategory = 'Niños' | 'Niñas' | 'Bebés' | 'No caminantes';

export type ItemType =
    | 'Accesorio'
    | 'Bermudas'
    | 'Bodys'
    | 'Camperas'
    | 'Conjuntos'
    | 'Pantalon'
    | 'Remeras cortas'
    | 'Remeras largas'
    | 'Ropa interior'
    | 'Vestidos'
    | 'Zapatilla';

export interface Variant {
    id: string; // Unique variant ID
    sku?: string;
    color: string;
    size: string;
    stock: number;
}

export interface Product {
    id: string;
    sku: string; // Manual SKU from blueprint
    name: string;
    basePrice: number; // Cost price
    markupPercentage: number; // For automatic final price calculation
    price: number; // Final storefront price
    originalPrice?: number;
    mainCategory: MainCategory;
    type: ItemType;
    description: string;
    images: string[];
    variants: Variant[];
    isNew?: boolean;
    onSale?: boolean;
    isActive: boolean; // For Suspend/Pay POS logic
}

// Shopping Cart Types
export interface CartItem {
    variantId: string; // combination of id-color-size
    productId: string;
    name: string;
    price: number;
    size: string;
    color: string;
    image: string;
    quantity: number;
}

// Order Types
export type PaymentMethod = 'MERCADOPAGO' | 'TRANSFER' | 'CARD' | 'CASH';
export type ShippingType = 'PICKUP' | 'DELIVERY_SANTA_FE' | 'DELIVERY_CALCHINES' | 'DELIVERY_OTHER';
export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type OrderChannel = 'WEB' | 'POS';

export interface Order {
    id: string;
    channel: OrderChannel;
    items: CartItem[];
    subtotal: number;
    total: number;
    status: OrderStatus;
    customerDni?: string;
    customerName?: string;
    customerPhone?: string;
    shippingType?: ShippingType;
    paymentMethod: PaymentMethod;
    createdAt: string;
}

export const CheckoutDataSchema = z.object({
    firstName: z.string().min(2, 'Nombre requerido'),
    dni: z.string().min(7, 'DNI inválido'),
    phone: z.string().min(8, 'Teléfono requerido'),
    shippingType: z.enum(['PICKUP', 'DELIVERY_SANTA_FE', 'DELIVERY_CALCHINES', 'DELIVERY_OTHER']),
    address: z.string().optional(),
    paymentMethod: z.enum(['MERCADOPAGO', 'TRANSFER', 'CARD', 'CASH']),
});

export type CheckoutData = z.infer<typeof CheckoutDataSchema>;
