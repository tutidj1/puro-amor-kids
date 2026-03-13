'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/data/mockDatabase';
import { Product, Variant, CartItem } from '@/types';

export default function POSPage() {
    const defaultProducts = db.getProducts();
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);

    // UI states
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);

    // Derived states
    const filteredProducts = useMemo(() => {
        return defaultProducts.filter(p => p.isActive !== false && (
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.mainCategory.toLowerCase().includes(searchTerm.toLowerCase())
        ));
    }, [defaultProducts, searchTerm]);

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // --- POS specific logic ---
    const handleAddToCart = () => {
        if (!selectedProduct || !selectedColor || !selectedSize) return;

        const variant = selectedProduct.variants.find(v => v.color === selectedColor && v.size === selectedSize);
        if (!variant || variant.stock <= 0) {
            alert("No hay stock disponible para esta variante.");
            return;
        }

        const existingItemIndex = cart.findIndex(i => i.variantId === variant.id);

        if (existingItemIndex > -1) {
            const currentQuantity = cart[existingItemIndex].quantity;
            if (currentQuantity >= variant.stock) {
                alert("No puedes agregar más unidades de las disponibles en stock.");
                return;
            }
            const newCart = [...cart];
            newCart[existingItemIndex].quantity += 1;
            setCart(newCart);
        } else {
            setCart([...cart, {
                productId: selectedProduct.id,
                variantId: variant.id,
                name: selectedProduct.name,
                price: selectedProduct.price,
                color: selectedColor,
                size: selectedSize,
                quantity: 1,
                image: selectedProduct.images[0]
            }]);
        }

        setSelectedProduct(null);
        setSelectedColor(null);
        setSelectedSize(null);
    };

    const handlePay = () => {
        if (cart.length === 0) return;

        const success = db.createOrder({
            id: `POS-${Date.now()}`,
            channel: 'POS',
            items: cart,
            subtotal: cartTotal,
            total: cartTotal, // No shipping in POS
            status: 'DELIVERED',
            paymentMethod: 'CASH', // default mock
            createdAt: new Date().toISOString()
        });

        if (success) {
            alert('Venta procesada con éxito. Stock descontado.');
            setCart([]);
        } else {
            alert('Error al procesar. Verifica el stock.');
        }
    };

    const handleSuspend = (productId: string) => {
        if (confirm('¿Estás seguro de suspender este producto de la Web?')) {
            db.suspendProduct(productId);
            alert('Producto suspendido de la web.');
            // force un pequeña render alert para este mock, en app real mutar fetcher
            setSearchTerm(searchTerm + ' ');
            setTimeout(() => setSearchTerm(searchTerm.trim()), 10);
        }
    };

    // --- Variant filtering logic based on blueprint ---
    const availableColors = selectedProduct ? Array.from(new Set(selectedProduct.variants.filter(v => v.stock > 0).map(v => v.color))) : [];
    const availableSizes = selectedProduct ? Array.from(new Set(selectedProduct.variants.filter(v =>
        v.stock > 0 && (!selectedColor || v.color === selectedColor)
    ).map(v => v.size))) : [];

    return (
        <div className="h-screen flex bg-gray-50 overflow-hidden font-sans">
            {/* Catalog Area (Left) */}
            <div className="flex-1 flex flex-col p-8 lg:p-12 overflow-y-auto">
                <header className="mb-8">
                    <h1 className="text-5xl font-display font-bold text-gray-800 italic tracking-tighter mb-6">Punto de Venta</h1>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                        <input
                            type="text"
                            placeholder="Buscar por Nombre, SKU o Categoría..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border-2 border-white shadow-premium pl-12 pr-6 py-5 rounded-full focus:outline-none focus:border-yellow-500 transition-all font-bold text-gray-700"
                        />
                    </div>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="bg-white p-4 rounded-3xl shadow-sm border-2 border-transparent hover:border-yellow-500 hover:shadow-premium transition-all group flex flex-col cursor-pointer" onClick={() => setSelectedProduct(product)}>
                            <div className="aspect-square bg-cream rounded-2xl mb-4 overflow-hidden relative">
                                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleSuspend(product.id); }}
                                    className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl text-gray-400 hover:text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                    title="Suspender Web"
                                >
                                    <span className="material-symbols-outlined">pause_circle</span>
                                </button>
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">SKU: {product.sku}</p>
                                <h3 className="font-display font-bold text-xl text-gray-800 italic leading-tight mb-2 tracking-tighter line-clamp-2">{product.name}</h3>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-end justify-between">
                                <span className="font-display font-bold text-2xl text-yellow-600">${product.price.toLocaleString()}</span>
                                <span className="text-[10px] bg-gray-50 text-gray-400 font-bold px-3 py-1 rounded-lg uppercase tracking-widest">
                                    {product.variants.reduce((a, b) => a + b.stock, 0)} u.
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cart & Action Area (Right) */}
            <aside className="w-[400px] bg-white shadow-luxury flex flex-col z-20 flex-shrink-0">
                <div className="p-8 border-b border-gray-50">
                    <h2 className="text-[12px] font-bold text-gray-400 uppercase tracking-[0.4em] italic leading-none mb-2">Orden Actual</h2>
                    <p className="font-display text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-600 tracking-tighter italic">Venta Directa</p>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-gray-50/30">
                    <AnimatePresence>
                        {cart.map((item, idx) => (
                            <motion.div
                                key={item.variantId + idx}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex gap-4 items-center"
                            >
                                <img src={item.image} className="w-16 h-16 rounded-xl object-cover" />
                                <div className="flex-1">
                                    <p className="font-bold text-sm text-gray-800 leading-tight mb-1">{item.name}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.color} • {item.size}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-800">${(item.price * item.quantity).toLocaleString()}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">x{item.quantity}</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {cart.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                            <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">shopping_cart</span>
                            <p className="font-display text-xl font-bold text-gray-400 italic tracking-tighter">Caja vacía</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-2">Selecciona productos del catálogo</p>
                        </div>
                    )}
                </div>

                <div className="p-8 bg-white border-t border-gray-50 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] pb-12">
                    <div className="flex justify-between items-end mb-8">
                        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-[0.4em] italic mb-1">Total a Pagar</span>
                        <span className="font-display text-5xl font-bold text-gray-800 tracking-tighter italic leading-none">${cartTotal.toLocaleString()}</span>
                    </div>
                    <button
                        onClick={handlePay}
                        disabled={cart.length === 0}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none text-white font-bold py-6 rounded-3xl shadow-luxury uppercase tracking-[0.4em] text-[12px] transition-all flex items-center justify-center gap-3"
                    >
                        <span className="material-symbols-outlined">payments</span>
                        Confirmar Venta
                    </button>
                    <button
                        onClick={() => setCart([])}
                        disabled={cart.length === 0}
                        className="w-full mt-4 bg-white hover:bg-red-50 text-red-500 tracking-[0.3em] font-bold py-4 rounded-2xl uppercase text-[10px] transition-all disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                </div>
            </aside>

            {/* Variant Selection Modal Overlay */}
            <AnimatePresence>
                {selectedProduct && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => { setSelectedProduct(null); setSelectedColor(null); setSelectedSize(null); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-luxury"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="font-display text-3xl font-bold text-gray-800 italic mb-2 tracking-tighter">{selectedProduct.name}</h3>
                            <p className="text-yellow-600 font-bold text-xl mb-8">${selectedProduct.price.toLocaleString()}</p>

                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-3">1. Color</p>
                                    <div className="flex flex-wrap gap-2">
                                        {availableColors.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setSelectedColor(c)}
                                                className={`px-6 py-3 rounded-full font-bold text-xs transition-all border-2 border-transparent ${selectedColor === c ? 'bg-yellow-500 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {selectedColor && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-3">2. Talle</p>
                                        <div className="flex flex-wrap gap-2">
                                            {availableSizes.map(s => {
                                                const v = selectedProduct.variants.find(v => v.color === selectedColor && v.size === s);
                                                return (
                                                    <button
                                                        key={s}
                                                        onClick={() => setSelectedSize(s)}
                                                        className={`px-6 py-3 rounded-xl font-bold text-xs transition-all border-2 border-transparent ${selectedSize === s ? 'bg-gray-800 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                                                    >
                                                        {s} <span className="text-[9px] opacity-70 ml-1">({v?.stock} u.)</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            <button
                                onClick={handleAddToCart}
                                disabled={!selectedColor || !selectedSize}
                                className="w-full mt-10 bg-black text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-xs disabled:opacity-50 hover:bg-gray-800 transition-colors"
                            >
                                Agregar al Ticket
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
