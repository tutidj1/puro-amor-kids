"use client";

import React, { useState, useEffect } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { motion, AnimatePresence } from 'framer-motion';
import CartPanel from './CartPanel';

export default function FloatingCart() {
    const { items } = useCartStore();
    const [isOpen, setIsOpen] = useState(false);
    const [pulse, setPulse] = useState(false);

    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

    // Trigger a pulse animation whenever items change
    useEffect(() => {
        if (totalItems > 0) {
            setPulse(true);
            const timer = setTimeout(() => setPulse(false), 600);
            return () => clearTimeout(timer);
        }
    }, [totalItems]);

    return (
        <>
            {/* Floating Cart Bubble */}
            <AnimatePresence>
                <motion.button
                    onClick={() => setIsOpen(true)}
                    aria-label="Abrir carrito"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.5 }}
                    whileHover={{ scale: 1.1, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    className="fixed bottom-8 right-8 z-40 w-16 h-16 bg-yellow-500 hover:bg-yellow-600 rounded-full shadow-2xl flex items-center justify-center text-white transition-colors"
                    style={{
                        boxShadow: '0 8px 32px rgba(234, 179, 8, 0.45)',
                    }}
                >
                    <span
                        className="material-symbols-outlined text-3xl"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                        shopping_bag
                    </span>

                    {/* Item Count Badge */}
                    <AnimatePresence>
                        {totalItems > 0 && (
                            <motion.span
                                key={totalItems}
                                initial={{ scale: 0 }}
                                animate={{ scale: pulse ? 1.4 : 1 }}
                                exit={{ scale: 0 }}
                                transition={{ type: "spring", stiffness: 500 }}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-yellow-300 leading-none"
                            >
                                {totalItems > 99 ? '99+' : totalItems}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>
            </AnimatePresence>

            {/* Cart Panel Drawer */}
            <CartPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
