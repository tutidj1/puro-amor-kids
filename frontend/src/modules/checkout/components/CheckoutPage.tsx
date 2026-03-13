"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckoutSchema, type CheckoutData } from '@/types/schemas';
import { useCartStore } from '@/store/useCartStore';
import { processCheckout } from '../services/checkout.service';
import { motion, AnimatePresence } from 'framer-motion';

export default function CheckoutPage() {
    const { items, getTotalPrice, clearCart } = useCartStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderConfirmed, setOrderConfirmed] = useState<{ id: number; whatsappUrl?: string } | null>(null);

    const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutData>({
        resolver: zodResolver(CheckoutSchema),
        defaultValues: {
            shipping: { type: 'PICKUP' }
        }
    });

    const shippingType = watch('shipping.type');

    const onSubmit = async (data: CheckoutData) => {
        setIsSubmitting(true);
        try {
            const cartItems = items.map(i => ({ variantId: i.variantId, quantity: i.quantity }));
            const result = await processCheckout(data, cartItems);

            setOrderConfirmed({ id: result.orderId, whatsappUrl: result.whatsappUrl });
            clearCart();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (orderConfirmed) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-cream font-quicksand">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-10 rounded-3xl shadow-premium text-center max-w-md border border-pink-100"
                >
                    <h1 className="text-5xl font-amatic mb-4 text-pink-500">¡Gracias por tu compra!</h1>
                    <p className="text-lg mb-6">Tu orden <b>#{orderConfirmed.id}</b> ha sido recibida y está pendiente de pago.</p>

                    <a
                        href={orderConfirmed.whatsappUrl || `https://wa.me/YOUR_PHONE?text=Hola! Mi pedido es #${orderConfirmed.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block w-full bg-green-500 text-white font-bold py-4 rounded-full shadow-lg hover:bg-green-600 transition-all transform hover:scale-105"
                    >
                        Enviar Comprobante por WhatsApp
                    </a>

                    <button
                        onClick={() => window.location.href = '/'}
                        className="mt-6 text-sm text-gray-400 hover:text-pink-500 transition-colors"
                    >
                        Volver al Inicio
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8 font-quicksand text-gray-700">
            <div className="md:col-span-2">
                <h1 className="text-4xl font-amatic text-pink-500 mb-8 border-b border-pink-100 pb-2">Finalizar Compra</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* Datos del Cliente */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-amatic text-pink-400 mb-4 tracking-wider uppercase">1. Tus Datos</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter ml-1">Nombre</label>
                                <input {...register('customer.firstName')} className="w-full border-2 border-gray-50 rounded-xl p-3 focus:border-pink-200 outline-none transition-all" />
                                {errors.customer?.firstName && <span className="text-red-400 text-xs">{errors.customer.firstName.message}</span>}
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter ml-1">Apellido</label>
                                <input {...register('customer.lastName')} className="w-full border-2 border-gray-50 rounded-xl p-3 focus:border-pink-200 outline-none transition-all" />
                                {errors.customer?.lastName && <span className="text-red-400 text-xs">{errors.customer.lastName.message}</span>}
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter ml-1">DNI (Para el ticket)</label>
                                <input {...register('customer.dni')} className="w-full border-2 border-gray-50 rounded-xl p-3 focus:border-pink-200 outline-none transition-all" />
                                {errors.customer?.dni && <span className="text-red-400 text-xs">{errors.customer.dni.message}</span>}
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter ml-1">WhatsApp de contacto</label>
                                <input {...register('customer.phone')} placeholder="Ej: 1112345678" className="w-full border-2 border-gray-50 rounded-xl p-3 focus:border-pink-200 outline-none transition-all" />
                                {errors.customer?.phone && <span className="text-red-400 text-xs">{errors.customer.phone.message}</span>}
                            </div>
                        </div>
                    </section>

                    {/* Método de Entrega */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-amatic text-pink-400 mb-4 tracking-wider uppercase">2. Entrega</h2>
                        <div className="flex gap-4 mb-4">
                            <label className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${shippingType === 'PICKUP' ? 'border-pink-300 bg-pink-50' : 'border-gray-50'}`}>
                                <input type="radio" {...register('shipping.type')} value="PICKUP" className="hidden" />
                                <span className="block font-bold">Retiro en Tienda</span>
                                <span className="text-xs text-gray-400">Sin cargo - Local Centro</span>
                            </label>
                            <label className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${shippingType === 'HOME_DELIVERY' ? 'border-pink-300 bg-pink-50' : 'border-gray-50'}`}>
                                <input type="radio" {...register('shipping.type')} value="HOME_DELIVERY" className="hidden" />
                                <span className="block font-bold">Envío a Domicilio</span>
                                <span className="text-xs text-gray-400">Consultar tarifas</span>
                            </label>
                        </div>

                        {shippingType === 'HOME_DELIVERY' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Dirección</label>
                                    <input {...register('shipping.streetAddress')} className="w-full border-2 border-gray-50 rounded-xl p-3 focus:border-pink-200 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Ciudad</label>
                                    <input {...register('shipping.city')} className="w-full border-2 border-gray-50 rounded-xl p-3 focus:border-pink-200 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Provincia</label>
                                    <input {...register('shipping.province')} className="w-full border-2 border-gray-50 rounded-xl p-3 focus:border-pink-200 outline-none transition-all" />
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-sm italic text-yellow-700">
                                Punto de retiro seleccionado: <b>Sucursal Palermo (Av. Santa Fe 1234)</b>
                                <input type="hidden" {...register('shipping.pickupLocationName')} value="Sucursal Palermo" />
                            </div>
                        )}
                    </section>

                    {/* Método de Pago */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-amatic text-pink-400 mb-4 tracking-wider uppercase">3. Pago</h2>
                        <select {...register('paymentMethod')} className="w-full border-2 border-gray-50 rounded-xl p-3 focus:border-pink-200 outline-none">
                            <option value="BANK_TRANSFER">Transferencia Bancaria (-10%)</option>
                            <option value="CASH">Efectivo al retirar</option>
                            <option value="MERCADOPAGO">Mercado Pago</option>
                        </select>
                    </section>

                    <button
                        type="submit"
                        disabled={isSubmitting || items.length === 0}
                        className="w-full bg-pink-500 text-white font-bold py-5 rounded-3xl shadow-premium hover:bg-pink-600 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:transform-none text-xl tracking-widest font-amatic"
                    >
                        {isSubmitting ? 'PROCESANDO...' : 'FINALIZAR COMPRA'}
                    </button>
                </form>
            </div>

            <div className="md:col-span-1">
                <div className="bg-gray-50 p-6 rounded-3xl sticky top-24 border border-gray-200 shadow-sm">
                    <h3 className="text-2xl font-amatic text-gray-600 mb-6 border-b pb-2">Resumen</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {items.map(item => (
                            <div key={item.variantId} className="flex gap-3 text-sm">
                                <div className="w-16 h-16 bg-white rounded-lg flex-shrink-0 border p-1">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold leading-tight">{item.name}</p>
                                    <p className="text-xs text-gray-400">{item.size} / {item.color}</p>
                                    <div className="flex justify-between mt-1">
                                        <span>x{item.quantity}</span>
                                        <span className="font-bold text-pink-500">${(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 border-t border-gray-300 pt-6 space-y-2">
                        <div className="flex justify-between text-gray-400">
                            <span>Subtotal</span>
                            <span>${getTotalPrice().toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Envío</span>
                            <span className="text-xs text-green-500 font-bold">Gratis</span>
                        </div>
                        <div className="flex justify-between text-2xl font-bold text-gray-800 pt-2 font-amatic">
                            <span>TOTAL</span>
                            <span className="text-pink-600">${getTotalPrice().toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
