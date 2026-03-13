'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { db } from '@/data/mockDatabase';
import { MainCategory, ItemType, Product } from '@/types';

export default function UploadProductPage() {
    const router = useRouter();
    const [method, setMethod] = useState<'manual' | 'csv'>('manual');
    const [importProgress, setImportProgress] = useState(0);

    // Form State
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [mainCategory, setMainCategory] = useState<MainCategory | ''>('');
    const [type, setType] = useState<ItemType | ''>('');
    const [basePrice, setBasePrice] = useState<number | ''>('');
    const [markup, setMarkup] = useState<number>(50); // Default 50%
    const [imageUrl, setImageUrl] = useState('');

    const finalPrice = typeof basePrice === 'number' ? basePrice * (1 + markup / 100) : 0;

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !sku || !mainCategory || !type || !basePrice) {
            alert("Por favor complete todos los campos requeridos.");
            return;
        }

        const newProduct: Product = {
            id: Date.now().toString(),
            name,
            sku,
            basePrice,
            markupPercentage: markup,
            price: finalPrice,
            mainCategory: mainCategory as MainCategory,
            type: type as ItemType,
            description: 'Producto registrado manualmente.',
            images: [imageUrl || 'https://via.placeholder.com/800x800.png?text=Sin+Imagen'],
            variants: [], // Empty for now, would be added in a second step
            isActive: false, // suspended by default until stock is added
        };

        db.addProduct(newProduct);
        alert('Producto creado exitosamente.');
        router.push('/admin');
    };

    const simulateImport = () => {
        setImportProgress(1);
        const interval = setInterval(() => {
            setImportProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    alert('¡Sincronización de 400 artículos completada! 🚀');
                    router.push('/admin');
                    return 0;
                }
                return prev + 10;
            });
        }, 300);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 sm:p-16">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => router.push('/admin')}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-800 font-bold uppercase tracking-widest text-[10px] mb-10 transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Volver al Panel
                </button>

                <header className="mb-12">
                    <span className="text-[12px] font-bold text-gray-400 uppercase tracking-[0.4em] italic leading-none mb-4 block">Inventario</span>
                    <h1 className="text-7xl font-display font-bold text-gray-800 leading-[0.8] tracking-tighter italic">
                        Carga de <br /> Productos
                    </h1>
                </header>

                {/* Method Selector */}
                <div className="flex bg-white rounded-full p-2 w-fit mb-12 shadow-sm border border-gray-100">
                    <button
                        onClick={() => setMethod('manual')}
                        className={`px-10 py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] transition-all flex items-center gap-2 ${method === 'manual' ? 'bg-yellow-500 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                        <span className="material-symbols-outlined text-lg">edit_square</span>
                        Ingreso Manual
                    </button>
                    <button
                        onClick={() => setMethod('csv')}
                        className={`px-10 py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] transition-all flex items-center gap-2 ${method === 'csv' ? 'bg-yellow-500 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                        <span className="material-symbols-outlined text-lg">upload_file</span>
                        Importación CSV
                    </button>
                </div>

                <motion.div
                    key={method}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-10 sm:p-16 rounded-[4rem] shadow-premium border-2 border-white"
                >
                    {method === 'csv' ? (
                        <div className="text-center py-20">
                            <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <span className="material-symbols-outlined text-5xl">cloud_upload</span>
                            </div>
                            <h3 className="font-display text-4xl font-bold text-gray-800 italic mb-4 tracking-tighter">Sincronización Masiva</h3>
                            <p className="text-gray-400 text-sm mb-10 max-w-sm mx-auto">Sube tu archivo .csv descargado del sistema actual para sincronizar todo el catálogo (SKUs, Precios, Stock).</p>

                            <button
                                onClick={simulateImport}
                                disabled={importProgress > 0}
                                className="bg-gray-800 text-white font-bold px-12 py-5 rounded-full hover:bg-black transition-all uppercase tracking-[0.3em] text-[10px] shadow-luxury disabled:opacity-50"
                            >
                                {importProgress > 0 ? `Procesando... ${importProgress}%` : 'Seleccionar Archivo .CSV'}
                            </button>

                            {importProgress > 0 && (
                                <div className="mt-8 max-w-xs mx-auto">
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-500 transition-all duration-300" style={{ width: `${importProgress}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleManualSubmit} className="space-y-8">
                            <h3 className="font-display text-3xl font-bold text-gray-800 italic mb-10 border-b border-gray-100 pb-6">Detalles Principales</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-4">SKU / Código Único</label>
                                    <input
                                        type="text"
                                        value={sku}
                                        onChange={(e) => setSku(e.target.value)}
                                        className="w-full bg-gray-50 border-2 border-transparent px-6 py-4 rounded-3xl focus:bg-white focus:border-yellow-500 focus:outline-none transition-all font-bold text-gray-800 text-sm"
                                        placeholder="Ej: RMB-001"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-4">Nombre del Producto</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-gray-50 border-2 border-transparent px-6 py-4 rounded-3xl focus:bg-white focus:border-yellow-500 focus:outline-none transition-all font-bold text-gray-800 text-sm"
                                        placeholder="Ej: Remera Osito Algodón"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-4">Categoría Principal</label>
                                    <select
                                        value={mainCategory}
                                        onChange={(e) => setMainCategory(e.target.value as MainCategory)}
                                        className="w-full bg-gray-50 border-2 border-transparent px-6 py-4 rounded-3xl focus:bg-white focus:border-yellow-500 focus:outline-none transition-all font-bold text-gray-800 text-sm appearance-none"
                                    >
                                        <option value="" disabled>Seleccionar...</option>
                                        <option value="Bebés">Bebés</option>
                                        <option value="Niñas">Niñas</option>
                                        <option value="Niños">Niños</option>
                                        <option value="No caminantes">No caminantes</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-4">Subcategoría (Tipo)</label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value as ItemType)}
                                        className="w-full bg-gray-50 border-2 border-transparent px-6 py-4 rounded-3xl focus:bg-white focus:border-yellow-500 focus:outline-none transition-all font-bold text-gray-800 text-sm appearance-none"
                                    >
                                        <option value="" disabled>Seleccionar...</option>
                                        <option value="Remeras cortas">Remeras</option>
                                        <option value="Pantalon">Pantalón</option>
                                        <option value="Conjuntos">Conjunto</option>
                                        <option value="Vestidos">Vestido</option>
                                        <option value="Bodys">Body</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-yellow-50/50 p-8 rounded-3xl border border-yellow-100 mt-12 mb-8">
                                <h4 className="text-[10px] font-bold text-yellow-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">calculate</span>
                                    Calculadora de Precio
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-4">Costo Base ($)</label>
                                        <input
                                            type="number"
                                            value={basePrice}
                                            onChange={(e) => setBasePrice(Number(e.target.value) || '')}
                                            className="w-full bg-white border-2 border-transparent px-6 py-4 rounded-2xl focus:border-yellow-500 focus:outline-none transition-all font-display font-bold text-xl text-gray-800"
                                            placeholder="5000"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-4">Margen de Ganancia (%)</label>
                                        <input
                                            type="number"
                                            value={markup}
                                            onChange={(e) => setMarkup(Number(e.target.value))}
                                            className="w-full bg-white border-2 border-transparent px-6 py-4 rounded-2xl focus:border-yellow-500 focus:outline-none transition-all font-display font-bold text-xl text-gray-800"
                                        />
                                    </div>
                                    <div className="space-y-3 flex flex-col justify-end">
                                        <label className="text-[10px] font-bold text-green-600 uppercase tracking-widest pl-4">Precio Final de Venta</label>
                                        <div className="bg-white px-6 py-4 rounded-2xl border-2 border-green-200">
                                            <span className="font-display font-bold text-3xl text-green-600">${finalPrice.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pb-8">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-4">URL de la Fotografía Principal</label>
                                <input
                                    type="text"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-transparent px-6 py-4 rounded-3xl focus:bg-white focus:border-yellow-500 focus:outline-none transition-all font-bold text-gray-800 text-sm"
                                    placeholder="https://ejemplo.com/foto.jpg"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-6 rounded-full bg-yellow-500 text-white font-bold uppercase tracking-[0.4em] text-[11px] shadow-luxury hover:bg-yellow-600 transition-colors flex items-center justify-center gap-3"
                            >
                                <span className="material-symbols-outlined">add_circle</span>
                                Registrar Producto y Continuar a Variantes
                            </button>
                        </form>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
