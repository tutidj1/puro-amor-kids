"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { INVENTORY } from '@/data/inventory';
import { useCartStore } from '@/store/useCartStore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function ProductDetailPage() {
    const { id } = useParams();
    const { addItem } = useCartStore();
    const product = INVENTORY.find(p => p.id === id);

    const initialVariant = product?.variants.find(v => v.stock > 0) || product?.variants[0];
    const [selectedColor, setSelectedColor] = useState(initialVariant?.color || '');
    const [selectedSize, setSelectedSize] = useState('');
    const [activeImage, setActiveImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [addedToast, setAddedToast] = useState(false);

    const availableColors = useMemo(() => {
        return Array.from(new Set(product?.variants.map(v => v.color)));
    }, [product]);

    const availableSizes = useMemo(() => {
        if (!selectedColor) return [];
        return product?.variants
            .filter(v => v.color === selectedColor && v.stock > 0)
            .map(v => v.size) || [];
    }, [selectedColor, product]);

    useEffect(() => {
        if (selectedColor && !availableSizes.includes(selectedSize)) {
            setSelectedSize('');
        }
    }, [selectedColor, availableSizes, selectedSize]);

    const relatedProducts = useMemo(() => {
        return INVENTORY
            .filter(p => p.id !== product?.id && p.isActive !== false && (p.mainCategory === product?.mainCategory || p.type === product?.type))
            .slice(0, 4);
    }, [product]);

    if (!product) return (
        <div className="min-h-screen bg-cream flex items-center justify-center">
            <div className="text-center">
                <span className="material-symbols-outlined text-9xl text-gray-100 block mb-8 italic">search_off</span>
                <h2 className="text-6xl font-display font-bold text-gray-800 italic tracking-tighter mb-6">Tesorito no encontrado</h2>
                <Link href="/catalog" className="bg-yellow-500 text-white font-bold px-12 py-5 rounded-2xl shadow-luxury text-sm uppercase tracking-widest hover:bg-yellow-600 transition-all">
                    Ver Catálogo
                </Link>
            </div>
        </div>
    );

    const handleAddToCart = () => {
        if (!selectedSize || !selectedColor) {
            alert('Por favor elegí color y talle ✨');
            return;
        }

        addItem({
            variantId: `${product.id}-${selectedColor}-${selectedSize}`,
            productId: product.id,
            name: product.name,
            price: product.price,
            size: selectedSize,
            color: selectedColor,
            image: product.images[0],
            quantity: quantity
        });

        setAddedToast(true);
        setTimeout(() => setAddedToast(false), 3000);
    };

    return (
        <div className="bg-cream min-h-screen">
            <AnimatePresence>
                {addedToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white px-10 py-5 rounded-full shadow-luxury font-bold text-sm flex items-center gap-4 italic"
                    >
                        <span className="material-symbols-outlined text-yellow-500">check_circle</span>
                        ¡Tesorito agregado con éxito! +{quantity}
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="max-w-7xl mx-auto px-4 py-8 lg:py-10">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-3 mb-8 text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em]">
                    <Link href="/" className="hover:text-yellow-500 transition-colors">Home</Link>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                    <Link href="/catalog" className="hover:text-yellow-500 transition-colors">Catálogo</Link>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                    <span className="text-gray-600">{product.name}</span>
                </nav>

                <div className="flex flex-col lg:flex-row gap-10 mb-20 max-h-[85vh]">
                    {/* Media Gallery */}
                    <div className="lg:w-[45%] flex flex-col items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="w-full max-w-sm"
                        >
                            {/* Main Image */}
                            <div className="aspect-[4/5] rounded-[3rem] overflow-hidden bg-white shadow-luxury border-[6px] border-white p-1 group mb-4 relative max-h-[60vh]">
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={activeImage}
                                        initial={{ opacity: 0, scale: 1.05 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        src={product.images[activeImage] || product.images[0]}
                                        alt={product.name}
                                        className="w-full h-full object-contain rounded-[2.5rem] group-hover:scale-105 transition-transform duration-1000"
                                    />
                                </AnimatePresence>
                                {product.onSale && (
                                    <div className="absolute top-6 left-6 bg-red-500 text-white font-display font-bold px-6 py-2 rounded-full text-lg shadow-xl -rotate-12 italic border-4 border-white z-10">
                                        ¡SALE!
                                    </div>
                                )}
                                {product.isNew && !product.onSale && (
                                    <div className="absolute top-6 left-6 bg-yellow-500 text-white font-bold px-4 py-2 rounded-full text-[10px] shadow-xl uppercase tracking-widest border-2 border-white z-10">
                                        Nuevo
                                    </div>
                                )}
                            </div>

                            {/* Thumbnail strip (if multiple images) */}
                            {product.images.length > 1 && (
                                <div className="flex gap-2 justify-center">
                                    {product.images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImage(idx)}
                                            className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-yellow-500 shadow-md scale-105' : 'border-white opacity-60 hover:opacity-100'}`}
                                        >
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Content Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:w-[55%] flex flex-col justify-center"
                    >
                        <header className="mb-14">
                            <div className="flex items-center gap-4 mb-8">
                                <span className="text-[12px] font-bold text-yellow-500 bg-yellow-50 px-5 py-2 rounded-full uppercase tracking-[0.4em] italic leading-none">{product.mainCategory}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                                <span className="text-[12px] font-bold text-gray-400 uppercase tracking-[0.4em] italic leading-none">{product.type}</span>
                            </div>
                            <h1 className="text-6xl font-display font-bold text-gray-800 leading-[0.82] mb-6 tracking-tighter italic">{product.name}</h1>

                            <div className="flex items-center gap-8 mb-6">
                                <div className="flex items-end gap-4">
                                    <span className="text-5xl font-display text-gray-800 leading-none">${product.price.toLocaleString()}</span>
                                    {product.originalPrice && (
                                        <span className="text-3xl font-display text-gray-200 line-through leading-none mb-1">${product.originalPrice.toLocaleString()}</span>
                                    )}
                                </div>
                                <div className="h-8 w-[2px] bg-gray-100" />
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-yellow-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                    <span className="font-bold text-gray-800 text-xs">4.9</span>
                                    <span className="text-gray-400 text-[10px]">(24 reseñas)</span>
                                </div>
                            </div>

                            <p className="text-sm text-gray-500 font-medium leading-relaxed italic max-w-xl bg-white/60 rounded-2xl p-4 border border-white shadow-sm mb-6">
                                {product.description}
                            </p>
                        </header>

                        {/* Order Options */}
                        <div className="space-y-6 mb-8">
                            {/* Color Selector */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.5em] italic">1. Elegí el Color</h4>
                                    {selectedColor && <span className="text-[10px] font-bold text-gray-600 italic">{selectedColor}</span>}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {availableColors.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setSelectedColor(color)}
                                            className={`px-5 py-2.5 rounded-xl border-2 font-bold text-[10px] transition-all flex items-center gap-2 ${selectedColor === color ? 'bg-gray-800 border-gray-800 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-800 hover:text-gray-800'}`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${selectedColor === color ? 'bg-yellow-500' : 'bg-gray-200'}`} />
                                            {color}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Size Selector (Depends on Color) */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.5em] italic">2. Seleccioná el Talle</h4>
                                    <button className="text-[9px] font-bold text-yellow-500 uppercase tracking-[0.2em] underline underline-offset-4 decoration-yellow-500/30">Guía de Talles</button>
                                </div>
                                {!selectedColor ? (
                                    <p className="text-[10px] font-bold text-gray-400 italic">← Elegí un color primero...</p>
                                ) : availableSizes.length === 0 ? (
                                    <p className="text-[10px] font-bold text-red-300 italic">Sin stock disponible en este color.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {availableSizes.map(size => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`min-w-[50px] h-10 rounded-xl border-2 font-bold text-[10px] transition-all flex items-center justify-center ${selectedSize === size ? 'bg-gray-800 border-gray-800 text-white shadow-lg scale-105' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-800 hover:text-gray-800'}`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Quantity */}
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.5em] mb-3 italic">Cantidad</h4>
                                <div className="flex items-center bg-white rounded-2xl p-1.5 border-2 border-gray-100 shadow-sm w-fit">
                                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-xl hover:bg-gray-50 text-gray-400 font-bold transition-all">
                                        <span className="material-symbols-outlined text-sm">remove</span>
                                    </button>
                                    <span className="w-12 text-center text-xl font-display font-bold text-gray-800 italic">{quantity}</span>
                                    <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 rounded-xl hover:bg-gray-50 text-gray-400 font-bold transition-all">
                                        <span className="material-symbols-outlined text-sm">add</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-4">
                            <button
                                onClick={handleAddToCart}
                                disabled={!selectedColor || !selectedSize}
                                className="w-full bg-yellow-500 text-white font-bold py-4 rounded-[2rem] shadow-luxury hover:bg-yellow-600 transition-all transform hover:-translate-y-1 active:scale-95 uppercase tracking-[0.4em] flex items-center justify-center gap-4 text-xs disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                <span className="material-symbols-outlined text-2xl">add_shopping_cart</span>
                                ¡Sumar al Carrito!
                            </button>
                            <div className="flex flex-wrap items-center justify-center gap-4 text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em] italic">
                                <span className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
                                    Entrega en 24hs en Santa Fe
                                </span>
                                <span className="hidden sm:block w-1 h-1 rounded-full bg-gray-200" />
                                <span className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-green-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                                    Calidad Garantizada
                                </span>
                            </div>
                        </div>

                        {/* SKU */}
                        <p className="mt-6 text-[9px] font-bold text-gray-200 uppercase tracking-widest">SKU: {product.sku}</p>
                    </motion.div>
                </div>

                <section className="mt-4 pt-4 border-t border-white/80 pb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <span className="text-[9px] font-bold text-gray-800 uppercase tracking-[0.4em] italic mb-1 block">Te puede gustar</span>
                            <h2 className="text-3xl font-display font-bold text-gray-800 italic tracking-tighter">Más Tesoritos</h2>
                        </div>
                        <div className="flex gap-2 items-center">
                            <button className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:text-black transition-colors">
                                <span className="material-symbols-outlined text-sm caps">chevron_left</span>
                            </button>
                            <button className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:text-black transition-colors">
                                <span className="material-symbols-outlined text-sm caps">chevron_right</span>
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {relatedProducts.slice(0, 4).map(p => (
                            <Link href={`/product/${p.id}`} key={p.id} className="block group">
                                <div className="bg-white rounded-[1.5rem] p-2 shadow-sm border border-gray-50 group-hover:border-yellow-500 transition-all">
                                    <div className="aspect-[4/5] bg-cream rounded-xl overflow-hidden mb-2 relative">
                                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                    <div className="px-1 pb-1 text-center">
                                        <h3 className="font-display font-bold text-xs text-gray-800 italic tracking-tighter mb-0.5 line-clamp-1">{p.name}</h3>
                                        <p className="font-bold text-black text-xs">${p.price.toLocaleString()}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
