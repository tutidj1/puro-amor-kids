export interface WhatsAppOrderData {
    readonly orderId: number;
    readonly customerName: string;
    readonly totalAmount: string;
    readonly itemCount: number;
}
export declare function buildWhatsAppOrderUrl(phoneNumber: string, data: WhatsAppOrderData): string;
export declare function buildWhatsAppNewOrderUrl(adminPhone: string, data: WhatsAppOrderData): string;
