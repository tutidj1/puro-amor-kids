"use client";

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { INVENTORY } from '@/data/inventory';
import ProductCard from '@/components/ProductCard';

export default function HomePage() {
    const products = INVENTORY.filter(p => p.isActive !== false);
    const newArrivals = products.filter(p => p.isNew).slice(0, 6);
    const weeklyTrends = products.slice(0, 4); // Just mock some trends

    const sliderRef = useRef<HTMLDivElement>(null);

    const scrollSlider = (dir: 'left' | 'right') => {
        if (sliderRef.current) {
            const scrollAmount = 300;
            sliderRef.current.scrollBy({
                left: dir === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="bg-cream min-h-screen pb-20">
            {/* Hero Categories Section */}
            <section className="max-w-[1600px] mx-auto p-4 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[70vh] min-h-[500px]">
                {/* Babies */}
                <Link href="/catalog?category=Bebés" className="relative group rounded-3xl overflow-hidden shadow-premium">
                    <img src="https://images.unsplash.com/photo-1522771930-78848d92d3e8?auto=format&fit=crop&q=80&w=800" alt="Bebés" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex flex-col justify-end p-10">
                        <span className="bg-white text-gray-800 text-[10px] font-bold uppercase tracking-[0.4em] px-4 py-2 rounded-full w-fit mb-4">Colección</span>
                        <h2 className="text-5xl font-display font-bold text-white italic tracking-tighter">Bebés</h2>
                    </div>
                </Link>

                {/* Boys/Girls */}
                <Link href="/catalog?category=Niños" className="relative group rounded-3xl overflow-hidden shadow-premium">
                    <img src="https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=800" alt="Niños y Niñas" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex flex-col justify-end p-10">
                        <span className="bg-brand-yellow text-white text-[10px] font-bold uppercase tracking-[0.4em] px-4 py-2 rounded-full w-fit mb-4">Temporada</span>
                        <h2 className="text-5xl font-display font-bold text-white italic tracking-tighter">Niños/as</h2>
                    </div>
                </Link>

                {/* Non-Walkers */}
                <Link href="/catalog?category=No caminantes" className="relative group rounded-3xl overflow-hidden shadow-premium">
                    <img src="https://images.unsplash.com/photo-1549488344-c13f6df3d1c1?auto=format&fit=crop&q=80&w=800" alt="No caminantes" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex flex-col justify-end p-10">
                        <span className="bg-brand-teal text-black text-[10px] font-bold uppercase tracking-[0.4em] px-4 py-2 rounded-full w-fit mb-4">Destacado</span>
                        <h2 className="text-5xl font-display font-bold text-white italic tracking-tighter">No Caminantes</h2>
                    </div>
                </Link>
            </section>

            {/* Weekly Trends */}
            <section className="py-24">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {weeklyTrends.map((p, idx) => (
                            <Link href={`/product/${p.id}`} key={p.id}>
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="relative group rounded-[3rem] overflow-hidden aspect-[4/5] bg-white shadow-luxury"
                                >
                                    <img
                                        src={p.images[0]}
                                        alt={p.name}
                                        className="w-full h-full object-cover transition-all duration-500 filter brightness-95 group-hover:brightness-110 group-hover:scale-105"
                                    />

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8">
                                        <h3 className="text-3xl font-display font-bold text-white italic tracking-tighter mb-1">{p.name}</h3>
                                        <p className="text-brand-yellow font-bold text-xl mb-6">${p.price.toLocaleString()}</p>

                                        <div className="bg-white text-gray-900 font-bold uppercase tracking-[0.3em] text-[10px] py-4 rounded-full text-center hover:bg-gray-100 transition-colors shadow-premium transform translate-y-4 group-hover:translate-y-0 duration-300">
                                            Ver Producto
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Subcategory Highlights */}
            {/* ... keeping it simple by combining with the new arrivals slider ... */}

            {/* New Arrivals Slider */}
            <section className="py-24 bg-white/50 border-y border-white">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-8">
                    <div className="text-center mb-16 relative">
                        <span className="text-[12px] text-brand-yellow font-bold tracking-[0.4em] uppercase mb-4 block">Novedades</span>
                        <h2 className="text-6xl font-display font-bold text-gray-800 italic tracking-tighter">Recién Llegados</h2>
                    </div>

                    <div className="relative group/slider mx-auto max-w-6xl">
                        {/* Navigation Arrows positioned for better reach */}
                        <button
                            onClick={() => scrollSlider('left')}
                            className="absolute -left-6 lg:-left-16 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white border border-gray-100 shadow-premium flex items-center justify-center text-gray-800 hover:text-black hover:border-black transition-all group-hover/slider:scale-110 active:scale-95"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <button
                            onClick={() => scrollSlider('right')}
                            className="absolute -right-6 lg:-right-16 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white border border-gray-100 shadow-premium flex items-center justify-center text-gray-800 hover:text-black hover:border-black transition-all group-hover/slider:scale-110 active:scale-95"
                        >
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>

                        <div
                            ref={sliderRef}
                            className="flex overflow-x-auto gap-6 pb-10 snap-x snap-mandatory scrollbar-hide no-scrollbar"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {newArrivals.map(p => (
                                <div key={p.id} className="min-w-[240px] md:min-w-[280px] snap-center">
                                    <Link href={`/product/${p.id}`} className="block group">
                                        <div className="bg-white rounded-[2rem] p-3 shadow-sm border border-gray-50 group-hover:border-yellow-500 transition-all">
                                            <div className="aspect-[4/5] bg-cream rounded-2xl overflow-hidden mb-3 relative">
                                                <span className="absolute top-3 left-3 z-10 bg-brand-teal text-black px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-sm">Nuevo</span>
                                                <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            </div>
                                            <div className="px-1 text-center">
                                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{p.mainCategory}</p>
                                                <h3 className="font-display font-bold text-lg text-gray-800 italic tracking-tighter mb-1 line-clamp-1">{p.name}</h3>
                                                <p className="font-bold text-black text-base">${p.price.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Continuous Scroll: Offers Section */}
            <section className="py-32 bg-[#F5F5F3]">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between bg-brand-teal rounded-[3rem] p-12 md:p-20 shadow-luxury overflow-hidden relative">
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
                        
                        <div className="md:w-1/2 relative z-10 mb-10 md:mb-0">
                            <span className="inline-block px-4 py-2 bg-white/20 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.3em] mb-6 border border-white/20">Oportunidad Única</span>
                            <h2 className="text-5xl md:text-7xl font-display font-bold text-white italic tracking-tighter mb-6 leading-tight">
                                Ofertas <br />Especiales
                            </h2>
                            <p className="text-white/80 font-medium text-lg max-w-sm mb-10">
                                Descubrí tesoros con descuentos exclusivos para acompañar el crecimiento de tu pequeño con el mejor estilo.
                            </p>
                            <Link href="/catalog?ofertas=true" className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-black hover:text-white transition-all shadow-md">
                                Ver todas las ofertas
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </Link>
                        </div>
                        
                        {/* Mini Featured Offers Carousel */}
                        <div className="md:w-1/2 w-full relative z-10 flex gap-6 overflow-x-auto pb-4 snap-x no-scrollbar">
                            {INVENTORY.filter(p => p.markupPercentage < 40).slice(0,3).map(p => (
                                <Link href={`/product/${p.id}`} key={p.id} className="min-w-[240px] snap-center bg-white rounded-3xl p-3 shadow-md group hover:-translate-y-2 transition-transform">
                                    <div className="aspect-square rounded-2xl overflow-hidden relative mb-4">
                                        <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase z-10">-20% OFF</div>
                                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    </div>
                                    <h3 className="font-display font-bold text-gray-800 italic line-clamp-1 mb-1 px-1">{p.name}</h3>
                                    <p className="font-bold text-brand-yellow px-1">${p.price.toLocaleString()}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
