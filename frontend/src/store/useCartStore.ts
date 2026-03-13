import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/types';

interface CartStore {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (variantId: string) => void;
    updateQuantity: (variantId: string, quantity: number) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (newItem) => {
                const { items } = get();
                const existingItem = items.find((i) => i.variantId === newItem.variantId);

                if (existingItem) {
                    set({
                        items: items.map((i) =>
                            i.variantId === newItem.variantId
                                ? { ...i, quantity: i.quantity + newItem.quantity }
                                : i
                        ),
                    });
                } else {
                    set({ items: [...items, newItem] });
                }
            },

            removeItem: (variantId) => {
                set({ items: get().items.filter((i) => i.variantId !== variantId) });
            },

            updateQuantity: (variantId, quantity) => {
                if (quantity < 1) return;
                set({
                    items: get().items.map((i) =>
                        i.variantId === variantId ? { ...i, quantity } : i
                    ),
                });
            },

            clearCart: () => set({ items: [] }),

            getTotalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),

            getTotalPrice: () => get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
        }),
        {
            name: 'puro-amor-cart-v2', // v2 to avoid conflicts with old storage
        }
    )
);
