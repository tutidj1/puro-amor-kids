"use client";

import React from 'react';
import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartFullPage() {
    const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
                <div className="text-center">
                    <span className="material-symbols-outlined text-9xl text-yellow-100 mb-8 italic">shopping_basket</span>
                    <h1 className="text-6xl font-display font-bold text-gray-800 mb-4 tracking-wider">Tu carrito está vacío</h1>
                    <p className="text-gray-400 font-medium mb-12 text-xl">¿Aún no encontraste nada para tus peques?</p>
                    <Link
                        href="/catalog"
                        className="bg-gray-800 text-white font-bold px-12 py-5 rounded-2xl shadow-luxury hover:bg-gray-900 transition-all transform hover:-translate-y-1 active:scale-95 uppercase tracking-widest inline-block"
                    >
                        Ir al Catálogo
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-cream min-h-screen pb-24">
            <main className="max-w-7xl mx-auto px-4 py-16">
                <h1 className="text-8xl font-display font-bold text-gray-800 mb-16 tracking-tight">Tu Compra</h1>

                <div className="flex flex-col lg:flex-row gap-16">
                    {/* Items List */}
                    <div className="flex-1 space-y-8">
                        <AnimatePresence>
                            {items.map((item) => (
                                <motion.div
                                    key={item.variantId}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-white flex flex-col sm:flex-row items-center gap-10 group"
                                >
                                    <div className="w-40 h-40 bg-gray-50 rounded-3xl overflow-hidden p-2 flex-shrink-0 border border-gray-50 transform group-hover:rotate-2 transition-transform">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-2xl" />
                                    </div>

                                    <div className="flex-1 text-center sm:text-left">
                                        <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-[0.3em] mb-2">Producto</p>
                                        <h3 className="text-3xl font-display font-bold text-gray-800 mb-4">{item.name}</h3>
                                        <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                                            <span className="bg-gray-50 text-gray-400 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-gray-100 italic">Talle: {item.size}</span>
                                            <span className="bg-gray-50 text-gray-400 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-gray-100 italic">Color: {item.color}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 bg-cream rounded-2xl p-1.5 border border-white">
                                        <button
                                            onClick={() => updateQuantity(item.variantId, Math.max(1, item.quantity - 1))}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white text-gray-400 transition-colors shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-sm">remove</span>
                                        </button>
                                        <span className="w-8 text-center font-bold text-gray-800 text-lg">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white text-gray-400 transition-colors shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-sm">add</span>
                                        </button>
                                    </div>

                                    <div className="text-right min-w-[120px]">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Precio</p>
                                        <p className="text-3xl font-display font-bold text-gray-800">
                                            ${(item.price * item.quantity).toLocaleString()}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => removeItem(item.variantId)}
                                        className="w-12 h-12 rounded-2xl bg-red-50 text-red-300 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                    >
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:w-96">
                        <div className="bg-white rounded-[3rem] p-10 shadow-luxury border border-white sticky top-28">
                            <h2 className="text-4xl font-display font-bold text-gray-800 mb-8 tracking-widest uppercase">Resumen</h2>

                            <div className="space-y-6 mb-10">
                                <div className="flex justify-between text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                                    <span>Subtotal</span>
                                    <span className="text-gray-800 text-lg font-display">${getTotalPrice().toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                                    <span>Envío estimado</span>
                                    <span className="text-black font-bold">GRATIS</span>
                                </div>
                                <div className="pt-6 border-t border-gray-100 flex justify-between items-end">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Total Final</span>
                                    <span className="text-6xl font-display font-bold text-yellow-500">${getTotalPrice().toLocaleString()}</span>
                                </div>
                            </div>

                            <Link
                                href="/checkout"
                                className="w-full bg-yellow-500 text-white font-bold py-6 rounded-2xl shadow-luxury hover:bg-yellow-600 transition-all transform hover:-translate-y-1 active:scale-95 uppercase tracking-[0.2em] text-center inline-block"
                            >
                                Finalizar Pedido
                            </Link>

                            <div className="mt-8 flex flex-col gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-lg text-yellow-500">verified_user</span>
                                    Compra 100% segura
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-lg text-yellow-500">local_shipping</span>
                                    Entrega en 48hs hábiles
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
