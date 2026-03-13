"use client";

import React from 'react';
import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link';

interface CartPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartPanel({ isOpen, onClose }: CartPanelProps) {
    const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[60] transition-opacity"
                onClick={onClose}
            />

            {/* Slide-out Panel */}
            <div className="fixed top-0 right-0 h-full w-full md:w-[480px] bg-white z-[70] shadow-luxury flex flex-col animate-slide-in-right border-l border-white">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-8 border-b border-gray-50">
                    <div>
                        <h2 className="text-4xl font-display font-bold text-gray-800 tracking-widest uppercase italic">Tu Carro</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Puro Amor Kids</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full hover:bg-gray-50 flex items-center justify-center transition-colors text-gray-400 hover:text-red-500"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 scrollbar-hide">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <span className="material-symbols-outlined text-8xl text-yellow-50 mb-6 italic">shopping_basket</span>
                            <p className="text-3xl font-display font-bold text-gray-800 mb-2 uppercase tracking-widest">Está muy tranquilo por acá...</p>
                            <p className="text-gray-400 font-medium mb-10 text-sm">Agregá algo lindo para tus peques</p>
                            <button
                                onClick={onClose}
                                className="bg-gray-800 text-white font-bold px-10 py-4 rounded-2xl shadow-luxury hover:bg-gray-900 transition-all uppercase tracking-widest text-xs"
                            >
                                Explorar Catálogo
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {items.map((item) => (
                                <div key={item.variantId} className="flex gap-5 group">
                                    <div className="w-24 h-24 bg-cream rounded-[1.5rem] flex-shrink-0 border border-gray-100 p-1 overflow-hidden transition-transform group-hover:rotate-2">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-display font-bold text-2xl text-gray-800 uppercase tracking-tighter leading-none">{item.name}</h3>
                                            <button
                                                onClick={() => removeItem(item.variantId)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md italic">T{item.size}</span>
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md italic">{item.color}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="font-display font-bold text-3xl text-yellow-500">${(item.price * item.quantity).toLocaleString()}</p>
                                            <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                                                <button
                                                    onClick={() => updateQuantity(item.variantId, Math.max(1, item.quantity - 1))}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-gray-400 hover:text-yellow-500 transition-colors shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-xs">remove</span>
                                                </button>
                                                <span className="w-8 text-center text-xs font-bold text-gray-800">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-gray-400 hover:text-yellow-500 transition-colors shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-xs">add</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="bg-white p-8 border-t border-gray-50 shadow-luxury">
                        <div className="space-y-4 mb-10">
                            <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <span>Subtotal</span>
                                <span className="text-gray-800 text-sm">${getTotalPrice().toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <span>Envío</span>
                                <span className="text-black font-bold italic">Envío Gratis</span>
                            </div>
                            <div className="flex justify-between items-end pt-4">
                                <span className="font-display font-bold text-5xl text-gray-800 leading-none italic">Total</span>
                                <span className="font-display font-bold text-6xl text-yellow-500 leading-none">${getTotalPrice().toLocaleString()}</span>
                            </div>
                        </div>
                        <Link
                            href="/checkout"
                            onClick={onClose}
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-6 rounded-2xl shadow-luxury transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-sm"
                        >
                            <span className="material-symbols-outlined">shopping_bag</span>
                            Finalizar Pedido
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
}
