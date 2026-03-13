"use client";

import React from 'react';
import { motion } from 'framer-motion';

const Footer = () => {
    return (
        <footer id="footer-contacto" className="bg-admin-primary pt-32 pb-16 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-32">
                    {/* Brand Section */}
                    <div className="space-y-10">
                        <div>
                            <h2 className="text-6xl font-display font-bold text-white uppercase tracking-[0.1em] mb-1">Puro Amor</h2>
                            <p className="text-xl text-brand-yellow font-display lowercase tracking-[0.3em]">kids</p>
                        </div>
                        <p className="text-gray-400 font-medium leading-relaxed italic max-w-xs">
                            Seleccionamos cada prenda con el amor que tus pequeños merecen. Estilo premium para momentos mágicos.
                        </p>
                        <div className="flex gap-6">
                            {[
                                { id: 'instagram', url: 'https://www.instagram.com/puroamorkidss/', icon: 'photo_camera' },
                                { id: 'facebook', url: 'https://www.facebook.com/Puro-Amor-Kids-100060439643455', icon: 'groups' },
                                { id: 'whatsapp', url: 'https://wa.me/5493425555555', icon: 'chat' }
                            ].map(social => (
                                <a key={social.id} href={social.url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-brand-teal transition-all">
                                    <span className="material-symbols-outlined text-xl italic">{social.icon}</span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h4 className="text-[11px] font-bold text-white uppercase tracking-[0.5em] mb-12 italic">Explorar</h4>
                        <ul className="space-y-6">
                            {['Home', 'Catálogo', 'Nosotros', 'Contacto', 'Guía de Talles'].map(link => (
                                <li key={link}>
                                    <a href="#" className="text-gray-400 font-bold text-sm hover:text-brand-yellow transition-colors italic tracking-tight">{link}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Logistics / Zones */}
                    <div>
                        <h4 className="text-[11px] font-bold text-white uppercase tracking-[0.5em] mb-12 italic">Zonas de Envío</h4>
                        <div className="space-y-8">
                            <div className="flex gap-4">
                                <span className="material-symbols-outlined text-brand-yellow italic">local_shipping</span>
                                <div>
                                    <p className="text-white font-bold text-sm mb-1 italic">Santa Fe Capital</p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-loose">Entregas en 24hs <br /> Lunes a Viernes</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <span className="material-symbols-outlined text-brand-yellow italic">location_on</span>
                                <div>
                                    <p className="text-white font-bold text-sm mb-1 italic">Santa Rosa de Calchines</p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-loose">Entregas semanales <br /> Punto de retiro central</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Newsletter / Contact */}
                    <div id="footer-contacto">
                        <h4 className="text-[11px] font-bold text-white uppercase tracking-[0.5em] mb-12 italic">Sumate a la Magia</h4>
                        <p className="text-gray-400 font-bold text-xs mb-8 italic">Recibí ofertas exclusivas y nuevos tesoros.</p>
                        <div className="flex bg-white/5 p-2 rounded-[1.5rem] border border-white/5 focus-within:border-brand-teal/30 transition-all">
                            <input type="email" placeholder="Tu email..." className="bg-transparent border-none focus:ring-0 text-white font-bold text-xs p-4 w-full" />
                            <button className="bg-brand-teal text-gray-900 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg hover:bg-mint-dark transition-all">
                                <span className="material-symbols-outlined text-sm">send</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        © 2026 Puro Amor Kids. Todos los derechos reservados.
                    </p>
                    <div className="flex gap-8">
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest italic cursor-pointer">Términos</span>
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest italic cursor-pointer">Privacidad</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
