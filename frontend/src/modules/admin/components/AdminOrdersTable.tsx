'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/data/mockDatabase';
import { motion } from 'framer-motion';

import { format, subDays, isAfter, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminOrdersTable() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
    const [customDate, setCustomDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = () => {
        try {
            const data = db.getOrders();
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter((o: any) => {
        if (dateRange === 'all') return true;
        const orderDate = new Date(o.createdAt);
        const now = new Date();
        
        if (dateRange === 'today') return format(orderDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
        if (dateRange === 'week') return isAfter(orderDate, subDays(now, 7));
        if (dateRange === 'month') return isAfter(orderDate, subDays(now, 30));
        if (dateRange === 'custom') return format(orderDate, 'yyyy-MM-dd') === customDate;
        return true;
    });

    const handleConfirm = async (id: string) => {
        if (!confirm('¿Confirmar pago y descontar stock?')) return;
        setConfirmingId(id);
        
        // Simular confirmación en base de datos mock
        setTimeout(() => {
            alert('¡Pago confirmado! (Modo Simulación)');
            setConfirmingId(null);
            fetchOrders();
        }, 500);
    };

    if (loading) return <div className="p-10 text-center font-display text-2xl text-gray-400 italic">Cargando órdenes...</div>;

    return (
        <div className="space-y-4">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold text-gray-800 italic leading-none mb-1">Órdenes</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Gestión de ventas y pagos</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                    {(['all', 'today', 'week', 'month', 'custom'] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-3 py-1.5 rounded-full text-[8px] font-bold uppercase tracking-widest transition-all ${dateRange === range ? 'bg-gray-800 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            {range === 'all' ? 'Todas' : range === 'today' ? 'Hoy' : range === 'week' ? 'Semana' : range === 'month' ? 'Mes' : 'Calendario'}
                        </button>
                    ))}
                    {dateRange === 'custom' && (
                        <input 
                            type="date" 
                            value={customDate}
                            onChange={(e) => setCustomDate(e.target.value)}
                            className="ml-1 px-2 py-1 text-[8px] font-bold bg-gray-50 border-none rounded-lg focus:ring-yellow-500 outline-none"
                        />
                    )}
                </div>
            </header>

            <div className="overflow-hidden rounded-[2.5rem] border border-gray-100 shadow-premium bg-white overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-400 uppercase text-[9px] font-bold tracking-widest border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4">Orden</th>
                            <th className="px-6 py-4">Cliente</th>
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4">Productos</th>
                            <th className="px-6 py-4">Total</th>
                            <th className="px-6 py-4 text-center sticky right-0 bg-gray-50 shadow-l shadow-gray-100">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-20 text-center text-gray-400 italic text-xs">No se encontraron órdenes para este periodo.</td>
                            </tr>
                        ) : (
                            filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors text-[11px] border-b border-gray-50 last:border-0 group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-800">#{order.id}</span>
                                            {order.channel && (
                                                <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase ${order.channel === 'WEB' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}>
                                                    {order.channel}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-700 leading-none mb-0.5">{order.customerName}</div>
                                        <div className="text-[9px] text-gray-400">{order.customerPhone}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                        {format(new Date(order.createdAt), "dd MMM, HH:mm", { locale: es })}
                                    </td>
                                    <td className="px-6 py-4 max-w-xs">
                                        <div className="flex flex-col gap-0.5">
                                            {order.items.slice(0, 2).map((item: any, idx: number) => (
                                                <div key={idx} className="text-[9px] text-gray-500 truncate italic leading-tight">
                                                    {item.quantity}x {item.name} ({item.size})
                                                </div>
                                            ))}
                                            {order.items.length > 2 && <span className="text-[8px] text-gray-300 font-bold uppercase mt-0.5">+{order.items.length - 2} productos</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-base font-display font-bold text-gray-800">${parseFloat(order.total).toLocaleString()}</span>
                                        <div className="text-[7px] text-gray-400 uppercase tracking-tighter font-bold">{order.paymentMethod}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center sticky right-0 bg-white group-hover:bg-gray-50 transition-all shadow-l shadow-gray-100">
                                        <button
                                            onClick={() => handleConfirm(order.id)}
                                            disabled={confirmingId === order.id}
                                            className="bg-gray-800 text-white text-[8px] font-bold py-2 px-5 rounded-xl shadow-sm hover:bg-black transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                                        >
                                            {confirmingId === order.id ? '...' : 'Confirmar'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
