'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/data/mockDatabase';
import { format, subDays, isAfter, startOfDay, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

export default function AdminDashboard() {
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('week');
    const [channelFilter, setChannelFilter] = useState<'ALL' | 'WEB' | 'POS'>('ALL');
    const [customDate, setCustomDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Fetch data
    const orders = db.getOrders();
    const products = db.getProducts();

    // Prepare chart data based on range
    const chartData = useMemo(() => {
        const now = new Date();
        const start = dateRange === 'today' ? startOfDay(now) :
                     dateRange === 'week' ? subDays(now, 6) :
                     dateRange === 'month' ? subDays(now, 29) :
                     startOfDay(new Date(customDate));
        
        const days = dateRange === 'custom' ? [start] : eachDayOfInterval({ start, end: now });
        
        return days.map(day => {
            const dayOrders = orders.filter(o => {
                const orderDate = new Date(o.createdAt);
                const isSameDay = format(orderDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
                const matchesChannel = channelFilter === 'ALL' || o.channel === channelFilter;
                return isSameDay && matchesChannel;
            });

            return {
                name: format(day, dateRange === 'today' || dateRange === 'custom' ? 'HH:mm' : 'dd MMM', { locale: es }),
                ventas: dayOrders.reduce((sum, o) => sum + o.total, 0),
                ordenes: dayOrders.length
            };
        });
    }, [orders, dateRange, channelFilter, customDate]);

    // Calculate Stats
    const stats = useMemo(() => {
        const now = new Date();
        const cutoffDate = dateRange === 'today' ? startOfDay(now) :
                          dateRange === 'week' ? subDays(now, 7) :
                          dateRange === 'month' ? subDays(now, 30) :
                          startOfDay(new Date(customDate));

        const filteredOrders = orders.filter(o => {
            const matchesDate = dateRange === 'custom' ? 
                format(new Date(o.createdAt), 'yyyy-MM-dd') === customDate :
                isAfter(new Date(o.createdAt), cutoffDate);
            const matchesChannel = channelFilter === 'ALL' || o.channel === channelFilter;
            return matchesDate && matchesChannel;
        });

        const totalIncome = filteredOrders.reduce((sum, o) => sum + o.total, 0);
        const webIncome = filteredOrders.filter(o => o.channel === 'WEB').reduce((sum, o) => sum + o.total, 0);
        const posIncome = filteredOrders.filter(o => o.channel === 'POS').reduce((sum, o) => sum + o.total, 0);
        const totalStockValue = products.reduce((sum, p) => sum + (p.basePrice * p.variants.reduce((vSum, v) => vSum + v.stock, 0)), 0);
        const lowStockItems = products.filter(p => p.variants.some(v => v.stock < 5)).length;

        return {
            totalIncome,
            webIncome,
            posIncome,
            ordersCount: filteredOrders.length,
            totalStockValue,
            lowStockItems
        };
    }, [orders, products, dateRange, channelFilter, customDate]);

    const statCards = [
        { label: 'Ingresos', value: `$${stats.totalIncome.toLocaleString()}`, icon: 'payments', color: 'bg-green-50 text-green-500' },
        { label: 'Canales (W/P)', value: `$${stats.webIncome.toLocaleString()} / $${stats.posIncome.toLocaleString()}`, icon: 'storefront', color: 'bg-blue-50 text-blue-500' },
        { label: 'Órdenes', value: stats.ordersCount.toString(), icon: 'shopping_bag', color: 'bg-purple-50 text-purple-500' },
        { label: 'Stock Bajo', value: `${stats.lowStockItems}`, icon: 'warning', color: 'bg-red-50 text-red-500' },
    ];

    return (
        <div className="space-y-6">
            {/* Filters Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mr-2">Periodo:</span>
                    {(['today', 'week', 'month', 'custom'] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${dateRange === range ? 'bg-gray-800 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            {range === 'today' ? 'Hoy' : range === 'week' ? 'Semana' : range === 'month' ? 'Mes' : 'Calendario'}
                        </button>
                    ))}
                    {dateRange === 'custom' && (
                        <input 
                            type="date" 
                            value={customDate}
                            onChange={(e) => setCustomDate(e.target.value)}
                            className="ml-2 px-3 py-1 text-[9px] font-bold bg-gray-50 border-none rounded-lg focus:ring-yellow-500 outline-none"
                        />
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mr-2">Canal:</span>
                    {(['ALL', 'WEB', 'POS'] as const).map(c => (
                        <button
                            key={c}
                            onClick={() => setChannelFilter(c)}
                            className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${channelFilter === c ? 'bg-yellow-500 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            {c === 'ALL' ? 'Todos' : c}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stat Cards - Scaled Down */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((s, idx) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white p-5 rounded-3xl shadow-premium border border-white group hover:border-gray-100 transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                <span className="material-symbols-outlined text-xl">{s.icon}</span>
                            </div>
                            <div>
                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{s.label}</p>
                                <p className="text-xl font-display font-bold text-gray-800 italic leading-none">{s.value}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Visual: Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] shadow-premium border border-gray-50">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="font-display text-2xl font-bold text-gray-800 italic tracking-tighter">Rendimiento de Ventas</h4>
                        <div className="flex items-center gap-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500" /> Monto ($)</span>
                        </div>
                    </div>
                    
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F4CC70" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#F4CC70" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 9, fill: '#A0A8AD', fontWeight: 'bold'}}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 9, fill: '#A0A8AD', fontWeight: 'bold'}}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '10px', fontStyle: 'italic', fontWeight: 'bold' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="ventas" 
                                    stroke="#F4CC70" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorSales)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sub Visual: Recent Activity Scaled Down */}
                <div className="bg-white p-6 rounded-[2.5rem] shadow-premium border border-gray-50 flex flex-col">
                    <h4 className="font-display text-2xl font-bold text-gray-800 italic tracking-tighter mb-4">Actividad</h4>
                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[250px] no-scrollbar pr-2">
                        {orders.slice(0, 10).map(o => (
                            <div key={o.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white rounded-lg border border-gray-100 flex items-center justify-center font-bold text-gray-400 group-hover:text-yellow-600 transition-colors">
                                        <span className="material-symbols-outlined text-sm">receipt_long</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-[10px] text-gray-800 leading-none mb-1">Orden {o.id}</p>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{format(new Date(o.createdAt), "dd MMM", { locale: es })} • {o.channel}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-display font-bold text-gray-800">${o.total.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="mt-4 w-full py-2 bg-gray-50 text-[9px] font-bold text-gray-400 uppercase tracking-widest rounded-xl hover:bg-gray-100 transition-all">Ver Historial Completo</button>
                </div>
            </div>
        </div>
    );
}
