"use client";

import React, { useState } from 'react';
import { MainCategory, ItemType, Product } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import AdminDashboard from '@/modules/admin/components/AdminDashboard';
import AdminInventoryTable from '@/modules/admin/components/AdminInventoryTable';
import AdminOrdersTable from '@/modules/admin/components/AdminOrdersTable';
import AdminSettings from '@/modules/admin/components/AdminSettings';

export default function AdminPage() {
    const [view, setView] = useState<'stats' | 'inventory' | 'orders' | 'settings'>('stats');
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [importProgress, setImportProgress] = useState(0);

    const stats = [
        { label: 'Ventas Marzo', value: '$452.800', icon: 'trending_up', color: 'bg-green-50 text-green-500' },
        { label: 'Nuevos Clientes', value: '48', icon: 'person_add', color: 'bg-blue-50 text-blue-500' },
        { label: 'Órdenes Pendientes', value: '12', icon: 'pending_actions', color: 'bg-yellow-50 text-yellow-500' },
        { label: 'Stock Bajo', value: '5 Artículos', icon: 'inventory_2', color: 'bg-red-50 text-red-500' },
    ];

    const simulateImport = () => {
        setImportProgress(1);
        const interval = setInterval(() => {
            setImportProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    alert('¡Sincronización de 400 artículos completada! 🚀');
                    return 0;
                }
                return prev + 5;
            });
        }, 100);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-admin-primary flex-shrink-0 flex flex-col sticky top-0 h-screen shadow-2xl z-30">
                <div className="p-8 pb-4">
                    <h2 className="text-3xl font-display font-bold text-white italic tracking-tighter leading-none mb-1">Puro Amor</h2>
                    <p className="text-[9px] text-yellow-500 font-bold uppercase tracking-[0.4em] italic">Backoffice Pro</p>
                </div>

                <nav className="mt-6 flex-1 space-y-1">
                    {[
                        { id: 'stats', icon: 'dashboard', label: 'Dashboard' },
                        { id: 'orders', icon: 'local_mall', label: 'Órdenes' },
                        { id: 'inventory', icon: 'inventory', label: 'Inventario' },
                        { id: 'settings', icon: 'settings', label: 'Ajustes' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id as any)}
                            className={`w-full flex items-center gap-4 px-8 py-4 cursor-pointer transition-all border-l-4 ${view === item.id ? 'bg-white/10 border-yellow-500 text-yellow-500 shadow-inner' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <span className="material-symbols-outlined text-xl">{item.icon}</span>
                            <span className="font-bold text-[10px] uppercase tracking-[0.2em] italic">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-6 mb-6 bg-white/5 rounded-[2rem] mx-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Sistema Online</span>
                    </div>
                    <p className="text-white text-[10px] font-bold italic">v2.0.4-stable</p>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto">

                    {/* TOP NOTIFICATION (New Order Mock) */}
                    <AnimatePresence>
                        {view === 'stats' && (
                            <motion.div
                                initial={{ y: -50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="bg-yellow-500 text-white p-6 rounded-[2rem] mb-12 shadow-luxury flex items-center justify-between px-10 border-4 border-white"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                        <span className="material-symbols-outlined font-fill">notifications_active</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest leading-none mb-1">¡Nueva Orden Recibida!</p>
                                        <p className="font-display text-2xl font-bold italic">#ORD-5542 - Maria Perez ($24.500) - Transferencia</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setView('orders')}
                                    className="bg-white text-yellow-600 px-8 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-md hover:scale-105 transition-all"
                                >
                                    Ver Detalle
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <header className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] italic leading-none mb-2 block">Central de Gestión</span>
                            <h1 className="text-6xl font-display font-bold text-gray-800 leading-tight tracking-tighter italic lowercase">
                                {view === 'stats' ? 'Dashboard' : view === 'inventory' ? 'Inventario' : view === 'settings' ? 'Ajustes' : 'Órdenes'}
                            </h1>
                        </div>

                        {view === 'inventory' && (
                            <div className="flex gap-4">
                                <Link
                                    href="/admin/products/upload"
                                    className="bg-white text-gray-800 border-2 border-gray-100 font-bold text-[10px] px-10 py-5 rounded-3xl hover:bg-gray-50 transition-all uppercase tracking-[0.3em] flex items-center gap-3"
                                >
                                    <span className="material-symbols-outlined text-lg">sync</span>
                                    Sincronizar Excel
                                </Link>
                                <Link
                                    href="/admin/products/upload"
                                    className="bg-yellow-500 text-white font-bold text-[10px] px-10 py-5 rounded-3xl shadow-luxury hover:bg-yellow-600 transition-all uppercase tracking-[0.3em] flex items-center gap-3"
                                >
                                    <span className="material-symbols-outlined text-lg">add_circle</span>
                                    Cargar Manual
                                </Link>
                            </div>
                        )}
                    </header>

                    {/* VIEW RENDERING */}
                    <div className="pb-12">
                        {view === 'stats' && <AdminDashboard />}
                        {view === 'inventory' && <AdminInventoryTable />}
                        {view === 'orders' && <AdminOrdersTable />}
                        {view === 'settings' && <AdminSettings />}
                    </div>

                </div>
            </main>
        </div>
    );
}
