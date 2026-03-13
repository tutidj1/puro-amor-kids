"use client";

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminOrder {
    id: number;
    createdAt: string;
    totalAmount: string;
    status: string;
    paymentMethod: string;
    customer: {
        firstName: string;
        lastName: string;
        phone: string;
    };
    items: {
        productName: string;
        variantSize: string;
        variantColor: string;
        quantity: number;
    }[];
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmingId, setConfirmingId] = useState<number | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const data = await api.get<AdminOrder[]>('/orders?status=PENDING_PAYMENT');
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async (id: number) => {
        setConfirmingId(id);
        try {
            const result = await api.patch<{ whatsappUrl: string }>(`/orders/admin/${id}/confirm`, {});
            alert('✅ Pago confirmado correctamente. Stock actualizado.');

            if (confirm('¿Enviar notificación de confirmación al cliente por WhatsApp?')) {
                window.open(result.whatsappUrl, '_blank');
            }

            fetchOrders();
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setConfirmingId(null);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-6xl font-display text-yellow-500 animate-pulse uppercase tracking-wider">Cargando Pedidos...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar Admin */}
            <aside className="w-64 bg-admin-primary flex-shrink-0 flex flex-col">
                <div className="p-8 pb-4">
                    <h2 className="text-2xl font-display font-bold text-white italic tracking-wider">Admin Panel</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-1">Puro Amor Kids</p>
                </div>

                <nav className="mt-8 flex-1">
                    {[
                        { icon: 'dashboard', label: 'Dashboard', active: false },
                        { icon: 'shopping_bag', label: 'Ventas', active: true },
                        { icon: 'inventory_2', label: 'Stock', active: false },
                        { icon: 'group', label: 'Clientes', active: false },
                        { icon: 'settings', label: 'Ajustes', active: false },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className={`flex items-center gap-4 px-8 py-4 cursor-pointer transition-colors ${item.active ? 'bg-white/5 border-l-4 border-yellow-500 text-yellow-500' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <span className="material-symbols-outlined text-xl">{item.icon}</span>
                            <span className="font-bold text-sm tracking-wide">{item.label}</span>
                        </div>
                    ))}
                </nav>

                <div className="p-8 border-t border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center font-bold text-admin-primary">A</div>
                        <div>
                            <p className="text-sm font-bold text-white leading-none">Admin</p>
                            <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase">Cerrar Sesión</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 p-12 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    <header className="flex justify-between items-end mb-12">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="block w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Actualizado hace instantes</span>
                            </div>
                            <h1 className="text-7xl font-display font-bold text-gray-800 leading-[0.8]">Ventas</h1>
                            <p className="text-gray-400 font-medium mt-4">Gestión de cobros y estados de pedido</p>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-white px-8 py-5 rounded-3xl shadow-soft border border-gray-100 flex items-center gap-4">
                                <span className="text-4xl font-display text-gray-800 leading-none">{orders.length}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Pendientes<br />de cobro</span>
                            </div>
                        </div>
                    </header>

                    {/* Table Container */}
                    <div className="bg-white rounded-[2rem] shadow-luxury border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-50">
                                    <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Información de Orden</th>
                                    <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cliente / Contacto</th>
                                    <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Detalle de Compra</th>
                                    <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total / Método</th>
                                    <th className="px-8 py-6 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                <AnimatePresence>
                                    {orders.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-32 text-center">
                                                <div className="text-5xl font-display text-gray-200 uppercase mb-4 tracking-widest">Bandeja Vacía</div>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No hay órdenes pendientes en este momento</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.map((order) => (
                                            <motion.tr
                                                key={order.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="hover:bg-gray-50/50 transition-colors group"
                                            >
                                                <td className="px-8 py-8">
                                                    <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-tighter">
                                                        {new Date(order.createdAt).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-3xl font-display font-bold text-gray-800 tracking-wide">#{order.id}</div>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <div className="font-bold text-gray-700 text-sm mb-2">{order.customer.firstName} {order.customer.lastName}</div>
                                                    <a
                                                        href={`https://wa.me/${order.customer.phone}`}
                                                        target="_blank"
                                                        className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-600 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-100 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">chat</span>
                                                        WhatsApp
                                                    </a>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <div className="space-y-1.5 max-w-[200px]">
                                                        {order.items.map((item, i) => (
                                                            <div key={i} className="text-[11px] font-medium text-gray-500 truncate">
                                                                <span className="font-bold text-gray-800">{item.quantity}x</span> {item.productName}
                                                                <span className="text-[9px] text-gray-400 ml-1">({item.variantSize})</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <div className="text-2xl font-display text-yellow-500 font-bold leading-none mb-2">
                                                        ${parseFloat(order.totalAmount).toLocaleString()}
                                                    </div>
                                                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                        {order.paymentMethod.replace('_', ' ')}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8 text-center">
                                                    <button
                                                        onClick={() => handleConfirm(order.id)}
                                                        disabled={confirmingId === order.id}
                                                        className="w-full bg-gray-800 text-white font-bold text-[11px] py-3 rounded-xl uppercase tracking-[0.2em] shadow-sm hover:bg-gray-900 transform active:scale-95 transition-all disabled:opacity-50"
                                                    >
                                                        {confirmingId === order.id ? 'ESPERÁ...' : 'CONFIRMAR'}
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
