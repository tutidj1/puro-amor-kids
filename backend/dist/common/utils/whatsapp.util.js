"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWhatsAppOrderUrl = buildWhatsAppOrderUrl;
exports.buildWhatsAppNewOrderUrl = buildWhatsAppNewOrderUrl;
const WHATSAPP_BASE_URL = 'https://wa.me';
function buildWhatsAppOrderUrl(phoneNumber, data) {
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
function buildWhatsAppNewOrderUrl(adminPhone, data) {
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
//# sourceMappingURL=whatsapp.util.js.map