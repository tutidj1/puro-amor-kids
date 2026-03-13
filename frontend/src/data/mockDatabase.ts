import { Product, Order, MainCategory } from '../types';

// Helper to calculate final price
const calculatePrice = (base: number, markup: number) => base * (1 + markup / 100);

// Default Categories
export const MOCK_CATEGORIES: MainCategory[] = ['Bebés', 'Niñas', 'Niños', 'No caminantes'];

// Initial Mock Products
export const mockProducts: Product[] = [
    {
        id: '1',
        sku: 'RMB-001',
        name: 'Remera Algodón Básica',
        basePrice: 5000,
        markupPercentage: 50,
        price: calculatePrice(5000, 50), // 7500
        mainCategory: 'Bebés',
        type: 'Remeras cortas',
        description: 'Remera 100% algodón suave especial para la piel del bebé.',
        images: ['https://images.unsplash.com/photo-1519241047957-be31d7379a5d?auto=format&fit=crop&q=80&w=800'],
        isActive: true,
        variants: [
            { id: 'v1-1', color: 'Blanco', size: '0-3M', stock: 10, sku: 'RMB-001-BL-0' },
            { id: 'v1-2', color: 'Blanco', size: '3-6M', stock: 5, sku: 'RMB-001-BL-3' },
            { id: 'v1-3', color: 'Gris', size: '0-3M', stock: 0, sku: 'RMB-001-GR-0' }
        ],
        isNew: true,
    },
    {
        id: '2',
        sku: 'VNN-002',
        name: 'Vestido Flores Primavera',
        basePrice: 12000,
        markupPercentage: 60,
        price: calculatePrice(12000, 60), // 19200
        mainCategory: 'Niñas',
        type: 'Vestidos',
        description: 'Vestido ligero con estampado floral perfecto para días cálidos.',
        images: ['https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&q=80&w=800'],
        isActive: true,
        variants: [
            { id: 'v2-1', color: 'Rosa', size: '2T', stock: 3, sku: 'VNN-002-RS-2' },
            { id: 'v2-2', color: 'Rosa', size: '4T', stock: 8, sku: 'VNN-002-RS-4' },
            { id: 'v2-3', color: 'Celeste', size: '2T', stock: 5, sku: 'VNN-002-CL-2' }
        ],
    },
    {
        id: '3',
        sku: 'CJB-003',
        name: 'Conjunto Deportivo Active',
        basePrice: 18000,
        markupPercentage: 45,
        price: calculatePrice(18000, 45), // 26100
        mainCategory: 'Niños',
        type: 'Conjuntos',
        description: 'Conjunto de jogging y buzo resistente para jugar todo el día.',
        images: ['https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=800'],
        isActive: true,
        onSale: true,
        originalPrice: 30000,
        variants: [
            { id: 'v3-1', color: 'Azul Marino', size: '4T', stock: 12, sku: 'CJB-003-AZ-4' },
            { id: 'v3-2', color: 'Gris Melange', size: '6T', stock: 15, sku: 'CJB-003-GR-6' }
        ],
    }
];

// Mock Orders
export const mockOrders: Order[] = [
    {
        id: 'ORD-0001',
        channel: 'WEB',
        items: [
            {
                productId: '1',
                variantId: 'v1-1',
                name: 'Remera Algodón Básica',
                price: 7500,
                quantity: 2,
                color: 'Blanco',
                size: '0-3M',
                image: 'https://images.unsplash.com/photo-1519241047957-be31d7379a5d?auto=format&fit=crop&q=80&w=800'
            }
        ],
        subtotal: 15000,
        total: 18000, // include shipping mock
        status: 'PAID',
        customerName: 'María García',
        customerPhone: '342-555-1234',
        shippingType: 'DELIVERY_SANTA_FE',
        paymentMethod: 'MERCADOPAGO',
        createdAt: new Date().toISOString()
    },
    {
        id: 'ORD-0002',
        channel: 'POS',
        items: [
            {
                productId: '2',
                variantId: 'v2-1',
                name: 'Vestido Flores Primavera',
                price: 19200,
                quantity: 1,
                color: 'Rosa',
                size: '2T',
                image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&q=80&w=800'
            }
        ],
        subtotal: 19200,
        total: 19200,
        status: 'DELIVERED', // POS is instantly delivered
        paymentMethod: 'CASH',
        createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    }
];

// Singleton Data Provider (acts like an in-memory DB for Phase 1)
class MockDatabase {
    products = [...mockProducts];
    orders = [...mockOrders];

    // --- Products ---
    getProducts() { return this.products; }

    getProduct(id: string) { return this.products.find(p => p.id === id); }

    addProduct(p: Product) {
        this.products.push(p);
        return p;
    }

    updateProduct(id: string, updates: Partial<Product>) {
        const idx = this.products.findIndex(p => p.id === id);
        if (idx !== -1) {
            this.products[idx] = { ...this.products[idx], ...updates };
            return this.products[idx];
        }
        return null;
    }

    // --- POS Logic ---
    suspendProduct(id: string) { return this.updateProduct(id, { isActive: false }); }
    activateProduct(id: string) { return this.updateProduct(id, { isActive: true }); }

    // --- Stock ---
    deductStock(productId: string, variantId: string, quantity: number) {
        const product = this.getProduct(productId);
        if (!product) return false;

        const variant = product.variants.find(v => v.id === variantId);
        if (!variant || variant.stock < quantity) return false;

        variant.stock -= quantity;
        return true;
    }

    // --- Orders ---
    getOrders() { return this.orders; }

    createOrder(order: Order) {
        // Sync logic: deduct stock for every item
        let success = true;
        for (const item of order.items) {
            success = this.deductStock(item.productId, item.variantId, item.quantity) && success;
        }

        if (success) {
            this.orders.push(order);
            return order;
        }
        return null; // Failed due to stock
    }
}

export const db = new MockDatabase();
