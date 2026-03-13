/**
 * WhatsApp URL Builder
 *
 * Generates click-to-chat URLs with pre-filled order confirmation messages.
 * Uses the WhatsApp Business API deep link format.
 *
 * @see https://faq.whatsapp.com/5913398998672934
 */

const WHATSAPP_BASE_URL = 'https://wa.me';

export interface WhatsAppOrderData {
    readonly orderId: number;
    readonly customerName: string;
    readonly totalAmount: string;
    readonly itemCount: number;
}

/**
 * Builds a WhatsApp URL for sending an order confirmation message.
 *
 * @param phoneNumber - Customer phone in international format (e.g. "5491155556666")
 * @param data - Order data to embed in the message
 * @returns Full WhatsApp deep link URL
 */
export function buildWhatsAppOrderUrl(
    phoneNumber: string,
    data: WhatsAppOrderData,
): string {
    // Strip non-numeric characters from phone
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    const message = [
        `✅ *Puro Amor Kids — Pedido #${data.orderId} Confirmado*`,
        ``,
        `Hola ${data.customerName}! 👋`,
        ``,
        `Tu pedido ha sido *confirmado y pagado*.`,
        ``,
        `📦 *Resumen:*`,
        `• Artículos: ${data.itemCount}`,
        `• Total: $${data.totalAmount} ARS`,
        ``,
        `Te avisaremos cuando esté listo para envío/retiro.`,
        ``,
        `¡Gracias por tu compra! 💖`,
    ].join('\n');

    const encodedMessage = encodeURIComponent(message);

    return `${WHATSAPP_BASE_URL}/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Builds a WhatsApp URL for the admin to notify about a new order pending payment.
 */
export function buildWhatsAppNewOrderUrl(
    adminPhone: string,
    data: WhatsAppOrderData,
): string {
    const cleanPhone = adminPhone.replace(/\D/g, '');

    const message = [
        `🛒 *Nuevo Pedido #${data.orderId}*`,
        ``,
        `Cliente: ${data.customerName}`,
        `Artículos: ${data.itemCount}`,
        `Total: $${data.totalAmount} ARS`,
        ``,
        `Estado: ⏳ Esperando comprobante de pago`,
    ].join('\n');

    const encodedMessage = encodeURIComponent(message);

    return `${WHATSAPP_BASE_URL}/${cleanPhone}?text=${encodedMessage}`;
}
