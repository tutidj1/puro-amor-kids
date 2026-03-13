"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { motion, AnimatePresence } from 'framer-motion';
import CartPanel from './CartPanel';

export default function Navbar() {
    const { items } = useCartStore();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    };

    const handleAdminAccess = async () => {
        // Forzar cierre de sesión para que siempre pida credenciales
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        }
        router.push('/login');
    };

    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <>
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-mint/20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="text-black transform group-hover:rotate-12 transition-transform">
                                <span className="material-symbols-outlined text-4xl">child_care</span>
                            </div>
                            <div className="flex flex-col leading-none">
                                <h1 className="text-2xl font-display font-bold text-text-dark tracking-[0.1em] uppercase">Puro Amor</h1>
                                <span className="text-sm font-display text-black lowercase tracking-widest text-center">kids</span>
                            </div>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-8">
                            <Link href="/" className="text-text-dark hover:text-brand-yellow font-bold text-lg transition-colors">Home</Link>
                            <Link href="/catalog" className="text-text-dark hover:text-brand-yellow font-bold text-lg transition-colors">Catálogo</Link>
                            <Link href="/nosotros" className="text-text-dark hover:text-brand-yellow font-bold text-lg transition-colors">Nosotros</Link>
                            <a href="#footer-contacto" className="text-text-dark hover:text-brand-yellow font-bold text-lg transition-colors">Contacto</a>
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-4">
                            <form onSubmit={handleSearch} className="relative hidden sm:block">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar..."
                                    className="pl-10 pr-4 py-2 rounded-full border border-gray-100 focus:border-brand-teal focus:ring-brand-teal bg-gray-50 text-sm w-48 transition-all focus:w-64 outline-none"
                                />
                                <button type="submit" className="absolute left-3 top-2.5 text-gray-800 transition-colors hover:text-black">
                                    <span className="material-symbols-outlined text-lg">search</span>
                                </button>
                            </form>

                            <Link href="/wishlist" className="p-2 hover:bg-mint-soft rounded-full transition-colors text-text-dark">
                                <span className="material-symbols-outlined">favorite</span>
                            </Link>

                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="p-2 hover:bg-mint-soft rounded-full transition-colors text-text-dark relative group"
                            >
                                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">shopping_cart</span>
                                {totalItems > 0 && (
                                    <span className="absolute top-1 right-1 bg-brand-yellow text-text-dark text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold animate-bounce">
                                        {totalItems}
                                    </span>
                                )}
                            </button>

                            <button 
                                onClick={handleAdminAccess}
                                className="p-2 hover:bg-mint-soft rounded-full transition-colors text-text-dark"
                            >
                                <span className="material-symbols-outlined">account_circle</span>
                            </button>

                            {/* Mobile Toggle */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden p-2 text-gray-800"
                            >
                                <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
                        >
                            <nav className="flex flex-col p-4 space-y-4">
                                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-gray-800">Home</Link>
                                <Link href="/catalog" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-gray-800">Catálogo</Link>
                                <Link href="/nosotros" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-gray-800">Nosotros</Link>
                                <a href="#footer-contacto" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-gray-800">Contacto</a>
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            <CartPanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
    );
}
