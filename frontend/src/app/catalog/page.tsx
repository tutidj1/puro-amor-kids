"use client";

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { INVENTORY } from '@/data/inventory';
import { MainCategory, ItemType } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';


const CATEGORIES: MainCategory[] = ['Niños', 'Niñas', 'Bebés', 'No caminantes'];
const TYPES: ItemType[] = [
    'Accesorio', 'Bermudas', 'Bodys', 'Camperas', 'Conjuntos',
    'Pantalon', 'Remeras cortas', 'Remeras largas', 'Ropa interior', 'Vestidos', 'Zapatilla'
];
const SIZES = ['RN', '0m', '3m', '6m', '9m', '12m', '18m', '24m', '2', '4', '6', '8', '10', '12', '14'];

export default function CatalogPage() {
    const [selectedCategories, setSelectedCategories] = useState<MainCategory[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<ItemType[]>([]);
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
    const [sortBy, setSortBy] = useState('Más recientes');

    const searchParams = useSearchParams();
    const query = searchParams.get('q')?.toLowerCase() || '';

    // Combinatorial Filter Logic: Intersection (Cat AND Type AND Size AND Color AND Price AND Search)
    const allProducts = INVENTORY.filter(p => p.isActive !== false);

    const filteredProducts = useMemo(() => {
        return allProducts.filter(product => {
            const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.mainCategory);
            const matchesType = selectedTypes.length === 0 || selectedTypes.includes(product.type);
            const matchesPrice = product.price >= priceRange.min && product.price <= priceRange.max;
            const matchesSearch = !query || 
                product.name.toLowerCase().includes(query) || 
                product.id.toLowerCase().includes(query) ||
                (product.type && product.type.toLowerCase().includes(query));

            // Variational filters (Size & Color)
            const matchesSize = selectedSizes.length === 0 || product.variants.some(v => selectedSizes.includes(v.size) && v.stock > 0);
            const matchesColor = selectedColors.length === 0 || product.variants.some(v => selectedColors.includes(v.color) && v.stock > 0);

            return matchesCategory && matchesType && matchesPrice && matchesSize && matchesColor && matchesSearch;
        }).sort((a, b) => {
            if (sortBy === 'Menor precio') return a.price - b.price;
            if (sortBy === 'Mayor precio') return b.price - a.price;
            return 0;
        });
    }, [selectedCategories, selectedTypes, selectedSizes, selectedColors, priceRange, sortBy]);

    // Unique Colors in Inventory
    const allColors = useMemo(() => {
        const colors = new Set<string>();
        allProducts.forEach(p => p.variants.forEach(v => colors.add(v.color)));
        return Array.from(colors);
    }, [allProducts]);

    const toggleFilter = (list: any[], setList: Function, item: any) => {
        setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
    };

    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedTypes([]);
        setSelectedSizes([]);
        setSelectedColors([]);
        setPriceRange({ min: 0, max: 100000 });
    };

    return (
        <div className="bg-cream min-h-screen">
            <main className="max-w-7xl mx-auto px-4 py-20">
                <header className="mb-12 text-center max-w-2xl mx-auto">
                    <span className="text-[12px] font-bold text-yellow-500 uppercase tracking-[0.5em] italic mb-6 block">Encontrá el look ideal</span>
                    <h1 className="text-9xl font-display font-bold text-gray-800 leading-[0.75] tracking-tighter italic mb-8">Catálogo</h1>
                    <p className="text-gray-400 font-medium text-lg leading-relaxed italic mb-12">
                        Explorá nuestra colección seleccionada manualmente para tus pequeños.
                    </p>

                    {/* Quick Horizontal Garment Filters */}
                    <div className="flex flex-wrap justify-center gap-3">
                        {TYPES.map(type => (
                            <button
                                key={type}
                                onClick={() => toggleFilter(selectedTypes, setSelectedTypes, type)}
                                className={`px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${selectedTypes.includes(type) ? 'bg-gray-800 text-white shadow-lg scale-105' : 'bg-white text-gray-400 hover:text-gray-600 border border-gray-100'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-16">
                    {/* Combinatorial Sidebar */}
                    <aside className="w-full lg:w-72 flex-shrink-0">
                        <div className="bg-white rounded-[4rem] shadow-luxury border-2 border-white p-12 sticky top-32 space-y-14">
                            <div className="flex items-center justify-between pb-8 border-b border-gray-50">
                                <h3 className="font-display text-4xl font-bold text-gray-800 italic">Filtros</h3>
                                <button onClick={clearFilters} className="text-[10px] font-bold text-red-300 hover:text-red-500 uppercase tracking-widest transition-colors">Limpiar</button>
                            </div>

                            {/* Main Categories */}
                            <div>
                                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.4em] mb-8 italic">Colección</h4>
                                <div className="space-y-4">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => toggleFilter(selectedCategories, setSelectedCategories, cat)}
                                            className={`w-full text-left px-5 py-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-between group ${selectedCategories.includes(cat) ? 'bg-yellow-50 text-yellow-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            {cat}
                                            {selectedCategories.includes(cat) && <span className="material-symbols-outlined text-sm font-bold">check</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Item Types (Styled Sidebar) */}
                            <div>
                                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.4em] mb-8 italic">Prendas</h4>
                                <div className="space-y-5 max-h-[400px] overflow-y-auto pr-4 scrollbar-hide py-1">
                                    {TYPES.map(type => (
                                        <label key={type} className="flex items-center gap-4 cursor-pointer group">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTypes.includes(type)}
                                                    onChange={() => toggleFilter(selectedTypes, setSelectedTypes, type)}
                                                    className="peer appearance-none w-6 h-6 rounded-full border-2 border-gray-100 checked:bg-yellow-100 checked:border-yellow-200 transition-all cursor-pointer"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]"></div>
                                                </div>
                                            </div>
                                            <span className={`text-[13px] font-bold tracking-tight transition-colors ${selectedTypes.includes(type) ? 'text-gray-800' : 'text-gray-400 group-hover:text-gray-500'}`}>
                                                {type}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Sizes */}
                            <div>
                                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.4em] mb-8 italic">Talles</h4>
                                <div className="grid grid-cols-4 gap-3">
                                    {SIZES.map(size => (
                                        <button
                                            key={size}
                                            onClick={() => toggleFilter(selectedSizes, setSelectedSizes, size)}
                                            className={`w-11 h-11 rounded-2xl border-2 text-[10px] font-bold transition-all flex items-center justify-center ${selectedSizes.includes(size) ? 'bg-gray-800 border-gray-800 text-white shadow-lg' : 'bg-white border-gray-50 text-gray-200 hover:border-yellow-100 hover:text-yellow-600'}`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Colors */}
                            <div>
                                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.4em] mb-8 italic">Colores</h4>
                                <div className="flex flex-wrap gap-2">
                                    {allColors.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => toggleFilter(selectedColors, setSelectedColors, color)}
                                            className={`px-4 py-2.5 rounded-xl border-2 text-[9px] font-bold uppercase tracking-widest transition-all ${selectedColors.includes(color) ? 'bg-yellow-500 border-yellow-500 text-white' : 'bg-white border-gray-50 text-gray-400 hover:border-gray-200'}`}
                                        >
                                            {color}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Content */}
                    <div className="flex-1">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={filteredProducts.length}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12"
                            >
                                {filteredProducts.map((p) => (
                                    <ProductCard
                                        key={p.id}
                                        id={p.id}
                                        name={p.name}
                                        price={p.price}
                                        originalPrice={p.originalPrice}
                                        image={p.images[0]}
                                        category={p.mainCategory}
                                    />
                                ))}
                            </motion.div>
                        </AnimatePresence>

                        {filteredProducts.length === 0 && (
                            <div className="py-60 text-center">
                                <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center mx-auto mb-12 shadow-premium border-8 border-gray-50/50">
                                    <span className="material-symbols-outlined text-9xl text-gray-100 italic">local_mall</span>
                                </div>
                                <h3 className="text-6xl font-display font-bold text-gray-800 mb-6 uppercase tracking-tighter italic">Bolsa Vacía</h3>
                                <p className="text-gray-400 font-bold uppercase text-[12px] tracking-[0.4em] max-w-sm mx-auto leading-loose italic">Ningún tesoro coincide <br />con esta combinación.</p>
                                <button onClick={clearFilters} className="mt-14 bg-yellow-500 text-white font-bold px-16 py-7 rounded-[2rem] shadow-luxury hover:bg-yellow-600 transition-all uppercase tracking-[0.3em] text-xs">Resetear Filtros</button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
