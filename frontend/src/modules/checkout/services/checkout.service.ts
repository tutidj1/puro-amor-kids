import { api } from '@/lib/api-client';
import type { CheckoutData, OrderItem } from '@/types/schemas';

interface CheckoutResponse {
    message: string;
    orderId: number;
    status: string;
    whatsappUrl?: string; // Optional if not returned in first step
}

export async function processCheckout(
    data: CheckoutData,
    cartItems: { variantId: number; quantity: number }[]
): Promise<CheckoutResponse> {
    try {
        // 1. Crear o recuperar Cliente
        // Nota: El backend podría fallar si el cliente ya existe por DNI/Phone, 
        // en un sistema real esto buscaría por DNI primero.
        const customer = await api.post<{ id: number }>('/customers', data.customer);

        // 2. Crear la Orden con el customerId obtenido
        const orderPayload = {
            customerId: customer.id,
            paymentMethod: data.paymentMethod,
            items: cartItems,
            shipping: data.shipping,
        };

        const response = await api.post<CheckoutResponse>('/orders', orderPayload);

        return response;
    } catch (error: any) {
        console.error('Checkout Error:', error);
        throw new Error(error.message || 'Error al procesar la compra. Intente nuevamente.');
    }
}
