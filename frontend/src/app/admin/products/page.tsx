"use client";

import React, { useState } from 'react';
import { INVENTORY } from '@/data/inventory';
import { motion } from 'framer-motion';

export default function AdminProductsPage() {
    const [view, setView] = useState<'list' | 'import'>('list');

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Admin Sidebar */}
            <aside className="w-80 bg-admin-primary flex-shrink-0 flex flex-col sticky top-0 h-screen shadow-2xl z-20">
                <div className="p-14 pb-8">
                    <h2 className="text-5xl font-display font-bold text-white italic tracking-tighter leading-none mb-1">Puro Amor</h2>
                    <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-[0.5em] italic">Panel de Control</p>
                </div>

                <nav className="mt-12 flex-1 space-y-3">
                    {[
                        { icon: 'dashboard', label: 'Dashboard', href: '/admin' },
                        { icon: 'shopping_bag', label: 'Ventas', href: '/admin/orders' },
                        { icon: 'inventory_2', label: 'Inventario', active: true, href: '/admin/products' },
                        { icon: 'group', label: 'Clientes', href: '#' },
                        { icon: 'auto_graph', label: 'Reportes', href: '#' },
                    ].map((item) => (
                        <a
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-6 px-14 py-6 cursor-pointer transition-all border-l-4 ${item.active ? 'bg-white/10 border-yellow-500 text-yellow-500 shadow-inner' : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                            <span className="font-bold text-xs uppercase tracking-[0.3em]">{item.label}</span>
                        </a>
                    ))}
                </nav>

                <div className="p-10 mt-auto border-t border-white/5">
                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl">
                        <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold">A</div>
                        <div>
                            <p className="text-white text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Admin</p>
                            <p className="text-gray-500 text-[9px] font-bold uppercase tracking-tighter underline">Cerrar Sesión</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 p-16 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    <header className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-[11px] font-bold text-yellow-500 uppercase tracking-[0.4em] italic leading-none">Gestión Total</span>
                                <span className="w-2 h-2 rounded-full bg-gray-200" />
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.4em] italic leading-none">{INVENTORY.length} Artículos</span>
                            </div>
                            <h1 className="text-9xl font-display font-bold text-gray-800 leading-[0.75] tracking-tighter italic">Inventario</h1>

                            <div className="flex gap-2 mt-12 bg-white/60 backdrop-blur-sm p-2 rounded-[2.5rem] shadow-soft border border-white w-fit">
                                <button
                                    onClick={() => setView('list')}
                                    className={`px-12 py-4 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all ${view === 'list' ? 'bg-gray-800 text-white shadow-xl' : 'text-gray-400 hover:text-gray-800'}`}
                                >
                                    Stock Actual
                                </button>
                                <button
                                    onClick={() => setView('import')}
                                    className={`px-12 py-4 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all ${view === 'import' ? 'bg-gray-800 text-white shadow-xl' : 'text-gray-400 hover:text-gray-800'}`}
                                >
                                    Carga Masiva
                                </button>
                            </div>
                        </div>

                        <button className="bg-yellow-500 text-white font-bold text-xs px-14 py-6 rounded-3xl shadow-luxury hover:bg-yellow-600 transition-all uppercase tracking-[0.4em] flex items-center gap-5 transform hover:-translate-y-1">
                            <span className="material-symbols-outlined text-2xl">add_box</span>
                            Nuevo Tesoro
                        </button>
                    </header>

                    {view === 'list' ? (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[4.5rem] shadow-luxury border border-white overflow-hidden p-4"
                        >
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-10 py-10 text-[11px] font-bold text-gray-400 uppercase tracking-[0.4em] italic">Prenda</th>
                                        <th className="px-10 py-10 text-[11px] font-bold text-gray-400 uppercase tracking-[0.4em] italic">Folder/Cat</th>
                                        <th className="px-10 py-10 text-[11px] font-bold text-gray-400 uppercase tracking-[0.4em] italic">Precio</th>
                                        <th className="px-10 py-10 text-[11px] font-bold text-gray-400 uppercase tracking-[0.4em] italic">Talles Disp.</th>
                                        <th className="px-10 py-10 text-center text-[11px] font-bold text-gray-400 uppercase tracking-[0.4em] italic">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {INVENTORY.map((product) => (
                                        <tr key={product.id} className="hover:bg-yellow-50/20 transition-all group">
                                            <td className="px-10 py-10">
                                                <div className="flex items-center gap-8">
                                                    <div className="w-20 h-20 rounded-[1.5rem] bg-cream border-4 border-white shadow-premium overflow-hidden p-1 group-hover:rotate-3 transition-transform">
                                                        <img src={product.image} className="w-full h-full object-cover rounded-xl" alt="" />
                                                    </div>
                                                    <div>
                                                        <p className="font-display font-bold text-2xl text-gray-800 italic leading-none mb-2">{product.name}</p>
                                                        <p className="text-[10px] text-yellow-600 font-bold tracking-[0.3em] uppercase">{product.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-10">
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-4 py-1.5 rounded-full uppercase tracking-widest w-fit italic">{product.type}</span>
                                                    <span className="text-[9px] font-bold text-gray-400 px-1 uppercase tracking-widest italic">{product.mainCategory}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-10">
                                                <p className="text-3xl font-display font-bold text-gray-800 leading-none">${product.price.toLocaleString()}</p>
                                            </td>
                                            <td className="px-10 py-10">
                                                <div className="flex flex-wrap gap-2 max-w-[200px]">
                                                    {product.sizes.map(size => (
                                                        <span key={size} className="text-[9px] font-bold border-2 border-gray-50 text-gray-400 px-3 py-1 rounded-xl uppercase hover:border-yellow-200 transition-colors">{size}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-10 py-10 text-center">
                                                <div className="flex justify-center gap-4">
                                                    <button className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 hover:text-gray-800 hover:bg-white hover:shadow-premium transition-all flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-lg">edit_note</span>
                                                    </button>
                                                    <button className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-white hover:shadow-premium transition-all flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-lg italic">delete_forever</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-5xl"
                        >
                            <div className="bg-white rounded-[5rem] p-24 shadow-luxury border-4 border-white text-center relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-3 bg-yellow-500" />
                                <div className="w-36 h-36 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-12 shadow-inner group-hover:scale-110 transition-transform duration-700">
                                    <span className="material-symbols-outlined text-7xl text-yellow-500 italic">auto_fix_high</span>
                                </div>
                                <h2 className="text-7xl font-display font-bold text-gray-800 mb-8 uppercase tracking-tighter italic">Transpolación de Stock</h2>
                                <p className="text-gray-400 font-medium mb-16 text-2xl max-w-2xl mx-auto italic leading-relaxed">
                                    Cargá el archivo Excel con los 400 artículos. <br />
                                    El sistema reconocerá automáticamente Niños, Bebés y No Caminantes.
                                </p>

                                <div className="border-[6px] border-dashed border-gray-50 rounded-[4rem] p-32 hover:border-yellow-200 hover:bg-yellow-50/20 transition-all cursor-pointer group mb-16 relative">
                                    <span className="material-symbols-outlined text-9xl text-gray-100 group-hover:text-yellow-500 transition-all mb-8 block italic">upload_file</span>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.5em] italic">Soltá tu planilla de tesoros aquí</p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-8 justify-center">
                                    <button className="bg-gray-800 text-white font-bold text-sm px-20 py-8 rounded-3xl shadow-luxury hover:bg-black transition-all uppercase tracking-[0.4em] transform hover:-translate-y-1 italic">Iniciar Carga</button>
                                    <button className="bg-white text-gray-400 font-bold text-sm px-20 py-8 rounded-3xl border-4 border-gray-50 hover:bg-gray-50 transition-all uppercase tracking-[0.4em] italic leading-none">Bajar Template</button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    );
}
