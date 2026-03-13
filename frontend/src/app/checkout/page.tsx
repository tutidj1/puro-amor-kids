"use client";

import React, { useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckoutDataSchema, CheckoutData, ShippingType, PaymentMethod } from '@/types';

export default function CheckoutPage() {
    const { items, getTotalPrice, clearCart } = useCartStore();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CheckoutData>({
        resolver: zodResolver(CheckoutDataSchema),
        defaultValues: {
            shippingType: 'PICKUP',
            paymentMethod: 'MERCADOPAGO'
        }
    });

    const currentShipping = watch('shippingType');
    const currentPayment = watch('paymentMethod');

    const onSubmit = (data: CheckoutData) => {
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
            clearCart();
        }, 2000);
    };

    const nextStep = () => setStep(s => Math.min(3, s + 1));
    const prevStep = () => setStep(s => Math.max(1, s - 1));

    if (items.length === 0 && !isSuccess) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="font-display text-6xl font-bold text-gray-800 mb-8 italic">El carrito está vacío</h2>
                    <a href="/catalog" className="bg-yellow-500 text-white px-12 py-5 rounded-3xl font-bold uppercase tracking-widest hover:bg-yellow-600 transition-colors shadow-luxury">Volver al Catálogo</a>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-20 rounded-[4rem] shadow-luxury border-4 border-white text-center max-w-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-3 bg-green-400" />
                    <div className="w-32 h-32 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-10">
                        <span className="material-symbols-outlined text-6xl text-green-500">verified_user</span>
                    </div>
                    <h2 className="text-8xl font-display font-bold text-gray-800 italic mb-6 leading-none">¡Pedido Realizado!</h2>
                    <p className="text-gray-400 font-medium text-xl mb-12 italic leading-relaxed">
                        Tus tesoros ya están en camino. Recibirás un mensaje de confirmación en breve.
                    </p>

                    <div className="space-y-4">
                        <button
                            onClick={() => window.open('https://wa.me/549342000000', '_blank')}
                            className="w-full bg-[#25D366] text-white py-6 rounded-3xl font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:scale-105 transition-all shadow-lg"
                        >
                            <span className="material-symbols-outlined">send</span>
                            Enviar Comprobante (WA)
                        </button>
                        <a href="/" className="block text-gray-400 font-bold uppercase text-[10px] tracking-widest hover:text-gray-800 transition-colors mt-8 underline">Volver al Inicio</a>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="bg-cream min-h-screen py-20 lg:py-32">
            <div className="max-w-7xl mx-auto px-4">
                {/* Stepper Header */}
                <div className="flex justify-between items-center mb-24 max-w-3xl mx-auto relative px-4">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 z-0" />
                    {[1, 2, 3].map(s => (
                        <div key={s} className="relative z-10 flex flex-col items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-display text-2xl font-bold transition-all border-4 ${step >= s ? 'bg-gray-800 border-gray-800 text-white shadow-xl scale-110' : 'bg-white border-gray-100 text-gray-200'}`}>
                                {s}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${step >= s ? 'text-gray-800' : 'text-gray-400'}`}>
                                {s === 1 ? 'Datos' : s === 2 ? 'Logística' : 'Pago'}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col lg:flex-row gap-20">
                    {/* Form Section */}
                    <div className="flex-1">
                        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-[4rem] shadow-luxury border-2 border-white p-12 lg:p-20 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-yellow-500" />

                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-10"
                                    >
                                        <h3 className="text-6xl font-display font-bold text-gray-800 italic mb-12 tracking-tighter">Tus Datos Personales</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-4">Nombre Completo</label>
                                                <input {...register('firstName')} placeholder="Ej: Maria Perez" className="w-full bg-gray-50 border-none rounded-[1.5rem] py-6 px-8 text-sm font-bold focus:ring-4 focus:ring-yellow-100 transition-all" />
                                                {errors.firstName && <p className="text-red-400 text-[10px] font-bold uppercase ml-4">{errors.firstName.message}</p>}
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-4">DNI / CUIL</label>
                                                <input {...register('dni')} placeholder="Sin puntos" className="w-full bg-gray-50 border-none rounded-[1.5rem] py-6 px-8 text-sm font-bold focus:ring-4 focus:ring-yellow-100 transition-all" />
                                                {errors.dni && <p className="text-red-400 text-[10px] font-bold uppercase ml-4">{errors.dni.message}</p>}
                                            </div>
                                            <div className="space-y-4 md:col-span-2">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-4">WhatsApp de Contacto</label>
                                                <input {...register('phone')} placeholder="+54 9..." className="w-full bg-gray-50 border-none rounded-[1.5rem] py-6 px-8 text-sm font-bold focus:ring-4 focus:ring-yellow-100 transition-all" />
                                                {errors.phone && <p className="text-red-400 text-[10px] font-bold uppercase ml-4">{errors.phone.message}</p>}
                                            </div>
                                        </div>
                                        <button type="button" onClick={nextStep} className="w-full bg-gray-800 text-white py-7 rounded-3xl font-bold uppercase tracking-[0.4em] shadow-xl hover:bg-black transition-all mt-10">Continuar</button>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-12"
                                    >
                                        <h3 className="text-6xl font-display font-bold text-gray-800 italic mb-12 tracking-tighter">¿Cómo lo enviamos?</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {[
                                                { id: 'PICKUP', label: 'Retiro en Local', sub: 'Sin costo - Santa Fe' },
                                                { id: 'DELIVERY_SANTA_FE', label: 'Envío Santa Fe', sub: '$1500 - 24hs' },
                                                { id: 'DELIVERY_CALCHINES', label: 'Envío Calchines', sub: '$2500 - Semanal' },
                                                { id: 'DELIVERY_OTHER', label: 'Correo Argentino', sub: 'Todo el país' },
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => setValue('shippingType', opt.id as ShippingType)}
                                                    className={`p-8 rounded-[2rem] border-4 text-left transition-all ${currentShipping === opt.id ? 'bg-yellow-50 border-yellow-500 shadow-xl scale-[1.02]' : 'bg-white border-gray-50 hover:border-gray-100'}`}
                                                >
                                                    <p className={`font-bold text-base mb-1 ${currentShipping === opt.id ? 'text-yellow-700' : 'text-gray-800'}`}>{opt.label}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{opt.sub}</p>
                                                </button>
                                            ))}
                                        </div>

                                        {currentShipping !== 'PICKUP' && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-6">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-4">Dirección de Entrega</label>
                                                <input {...register('address')} placeholder="Calle, número, depto..." className="w-full bg-gray-50 border-none rounded-[1.5rem] py-6 px-8 text-sm font-bold focus:ring-4 focus:ring-yellow-100 transition-all" />
                                            </motion.div>
                                        )}

                                        <div className="flex gap-6">
                                            <button type="button" onClick={prevStep} className="flex-1 bg-white text-gray-400 border-2 border-gray-50 py-7 rounded-3xl font-bold uppercase tracking-widest hover:text-gray-500 transition-all">Volver</button>
                                            <button type="button" onClick={nextStep} className="flex-[2] bg-gray-800 text-white py-7 rounded-3xl font-bold uppercase tracking-[0.4em] shadow-xl hover:bg-black transition-all">Siguiente</button>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 3 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-12"
                                    >
                                        <h3 className="text-6xl font-display font-bold text-gray-800 italic mb-12 tracking-tighter">Pago y Confirmación</h3>
                                        <div className="space-y-6">
                                            {[
                                                { id: 'MERCADOPAGO', label: 'Mercado Pago', icon: 'credit_card', desc: 'Tarjeta o Dinero en cuenta' },
                                                { id: 'TRANSFER', label: 'Transferencia Bancaria', icon: 'account_balance', desc: '10% OFF - Te enviamos el Alias' },
                                                { id: 'CASH', label: 'Efectivo', icon: 'payments', desc: 'Solo retiro en local / contra-entrega' },
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => setValue('paymentMethod', opt.id as PaymentMethod)}
                                                    className={`w-full p-8 rounded-[2rem] border-4 flex items-center gap-8 transition-all ${currentPayment === opt.id ? 'bg-gray-800 border-gray-800 text-white shadow-2xl scale-[1.02]' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}
                                                >
                                                    <span className={`material-symbols-outlined text-4xl ${currentPayment === opt.id ? 'text-yellow-500' : 'text-gray-200'}`}>{opt.icon}</span>
                                                    <div className="text-left">
                                                        <p className="font-bold text-xl leading-none mb-2 italic">{opt.label}</p>
                                                        <p className={`text-[10px] font-bold uppercase tracking-widest ${currentPayment === opt.id ? 'text-gray-400' : 'text-gray-400'}`}>{opt.desc}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        {currentPayment === 'TRANSFER' && (
                                            <div className="bg-yellow-50 p-10 rounded-[2.5rem] border-2 border-yellow-100 italic">
                                                <p className="text-[11px] font-bold text-yellow-600 uppercase tracking-widest mb-4">Datos Bancarios:</p>
                                                <p className="text-gray-800 font-bold mb-2">ALIAS: PURO.AMOR.KIDS</p>
                                                <p className="text-gray-800 font-bold">CBU: 00000031000000000123</p>
                                                <p className="text-[10px] text-gray-400 font-medium mt-6 leading-relaxed">Luego de pagar, enviá el comprobante por WhatsApp para validar tu pedido.</p>
                                            </div>
                                        )}

                                        <div className="flex gap-6">
                                            <button type="button" onClick={prevStep} className="flex-1 bg-white text-gray-400 border-2 border-gray-50 py-7 rounded-3xl font-bold uppercase tracking-widest hover:text-gray-500 transition-all">Volver</button>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="flex-[2] bg-yellow-500 text-white py-7 rounded-3xl font-bold uppercase tracking-[0.4em] shadow-luxury hover:bg-yellow-600 transition-all flex items-center justify-center gap-4"
                                            >
                                                {isSubmitting ? 'Procesando...' : 'Finalizar Pedido'}
                                                {!isSubmitting && <span className="material-symbols-outlined">rocket_launch</span>}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </form>
                    </div>

                    {/* Order Summary Sidebar */}
                    <aside className="lg:w-96">
                        <div className="bg-white rounded-[4rem] shadow-premium border border-gray-50 p-12 sticky top-32">
                            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5em] mb-12 italic border-b border-gray-50 pb-6">Resumen de Bolsa</h4>
                            <div className="space-y-8 max-h-[400px] overflow-y-auto mb-12 pr-4 scrollbar-hide">
                                {items.map(item => (
                                    <div key={item.variantId} className="flex gap-6 items-center">
                                        <div className="w-16 h-16 rounded-2xl bg-cream p-1 overflow-hidden shrink-0 border-2 border-white shadow-soft">
                                            <img src={item.image} className="w-full h-full object-cover rounded-xl" alt="" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-xs text-gray-800 italic truncate mb-1">{item.name}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest tracking-tighter">
                                                {item.color} / {item.size} <span className="mx-2">×</span> {item.quantity}
                                            </p>
                                        </div>
                                        <p className="font-display font-bold text-xl text-gray-800">${(item.price * item.quantity).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-5 pt-8 border-t border-gray-50">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subtotal</span>
                                    <span className="font-bold text-sm text-gray-400">${getTotalPrice().toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Envío</span>
                                    <span className="font-bold text-sm text-green-400 italic">A calcular</span>
                                </div>
                                <div className="flex justify-between items-end pt-5">
                                    <span className="text-[11px] font-bold text-gray-800 uppercase tracking-[0.3em] italic">Total Final</span>
                                    <span className="text-5xl font-display font-bold text-gray-800 leading-none">${getTotalPrice().toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
