'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/data/mockDatabase';
import { Product, MainCategory } from '@/types';

export default function AdminInventoryTable() {
    const products = db.getProducts();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<MainCategory | 'ALL'>('ALL');

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'ALL' || p.mainCategory === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const categories: ('ALL' | MainCategory)[] = ['ALL', 'Bebés', 'Niñas', 'Niños', 'No caminantes'];

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            {/* Search and Filters - Scaled Down */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                    <input
                        type="text"
                        placeholder="Nombre o SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-2xl border-2 border-white shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 font-bold text-xs"
                    />
                </div>
                <div className="flex gap-1 text-[10px] font-bold">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-4 py-2 rounded-2xl transition-all border-2 border-white shadow-sm ${categoryFilter === cat ? 'bg-gray-800 text-white shadow-md' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                        >
                            {cat === 'ALL' ? 'Todas' : cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table - Scaled Down & Sticky Actions */}
            <div className="bg-white rounded-3xl shadow-premium border border-gray-100 overflow-hidden w-full overflow-x-auto relative no-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50/50">
                        <tr className="border-b border-gray-100">
                            <th className="px-6 py-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">Artículo</th>
                            <th className="px-6 py-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">Categoría</th>
                            <th className="px-6 py-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">Precios (M)</th>
                            <th className="px-6 py-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">Stock</th>
                            <th className="px-6 py-4 text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest italic sticky right-0 bg-gray-50/50 shadow-l shadow-gray-100">Gestión</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredProducts.map((product) => (
                            <tr key={product.id} className="hover:bg-yellow-50/10 transition-all group border-b border-gray-50 last:border-0 text-xs">
                                <td className="px-6 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-cream border-2 border-white shadow-sm overflow-hidden p-0.5 flex-shrink-0">
                                            <img src={product.images[0]} className="w-full h-full object-cover rounded-lg" alt="" />
                                        </div>
                                        <div>
                                            <p className="font-display font-bold text-lg text-gray-800 italic leading-none mb-0.5 tracking-tighter">{product.name}</p>
                                            <p className="text-[8px] text-yellow-600 font-bold tracking-widest uppercase">{product.sku}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-3">
                                    <span className="text-[8px] font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg uppercase tracking-tight block text-center mb-0.5 truncate max-w-[80px]">{product.type}</span>
                                    <span className="text-[7px] font-bold text-gray-400 px-1 uppercase tracking-tighter block text-center truncate max-w-[80px]">{product.mainCategory}</span>
                                </td>
                                <td className="px-6 py-3">
                                    <div className="flex flex-col">
                                        <div className="flex items-end gap-1.5">
                                            <p className="text-lg font-display font-bold text-gray-800 leading-none">${product.price.toLocaleString()}</p>
                                            <span className="text-[7px] font-bold text-green-500 uppercase bg-green-50 px-1.5 py-0.5 rounded-sm">+{product.markupPercentage}%</span>
                                        </div>
                                        <p className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter">Base: ${product.basePrice.toLocaleString()}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-3">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center font-display text-sm font-bold text-gray-800 shadow-inner">
                                                {product.variants.reduce((acc, v) => acc + v.stock, 0)}
                                            </div>
                                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">T</span>
                                        </div>
                                        <div className="text-[7px] text-gray-400 flex gap-1 opacity-60">
                                            {product.variants.slice(0, 2).map(v => (
                                                <span key={v.id} className="bg-gray-50 px-1 rounded-sm">{v.size}({v.stock})</span>
                                            ))}
                                            {product.variants.length > 2 && <span>+</span>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-3 text-center sticky right-0 bg-white group-hover:bg-yellow-50/10 transition-all shadow-l shadow-gray-100">
                                    <div className="flex justify-center gap-2">
                                        <button className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:text-yellow-600 hover:bg-white hover:shadow-md transition-all flex items-center justify-center transform active:scale-90" title={product.isActive ? "Pausar Web" : "Activar Web"}>
                                            <span className="material-symbols-outlined text-[16px]">{product.isActive ? 'pause_circle' : 'play_circle'}</span>
                                        </button>
                                        <button className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:text-gray-800 hover:bg-white hover:shadow-md transition-all flex items-center justify-center transform active:scale-90">
                                            <span className="material-symbols-outlined text-[16px]">edit_square</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredProducts.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-10 py-10 text-center text-gray-400 font-bold italic text-sm">
                                    No se encontraron productos.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
