'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function AdminSettings() {
    const [fontSize, setFontSize] = useState('medium');
    const [uiScale, setUiScale] = useState(100);

    const handleSave = () => {
        alert('Ajustes guardados correctamente. (Simulado)');
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-2xl"
        >
            <div className="bg-white p-8 rounded-[3rem] shadow-premium border border-white">
                <h3 className="font-display text-4xl font-bold text-gray-800 italic mb-8">Configuración Visual</h3>
                
                <div className="space-y-8">
                    {/* Font Size */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 block">Tamaño de Fuente Global</label>
                        <div className="flex gap-4">
                            {['small', 'medium', 'large'].map(size => (
                                <button
                                    key={size}
                                    onClick={() => setFontSize(size)}
                                    className={`px-6 py-2 rounded-xl border-2 font-bold text-xs uppercase tracking-widest transition-all ${fontSize === size ? 'bg-gray-800 border-gray-800 text-white' : 'border-gray-50 text-gray-400 hover:border-gray-100'}`}
                                >
                                    {size === 'small' ? 'Pequeño' : size === 'medium' ? 'Normal' : 'Grande'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* UI Scaling */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 block">Escalado de Interfaz ({uiScale}%)</label>
                        <input 
                            type="range" 
                            min="80" 
                            max="120" 
                            value={uiScale}
                            onChange={(e) => setUiScale(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                        />
                        <div className="flex justify-between text-[8px] font-bold text-gray-300 uppercase mt-2">
                            <span>80% (Compacto)</span>
                            <span>120% (Amplio)</span>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-50 flex justify-end">
                    <button 
                        onClick={handleSave}
                        className="bg-yellow-500 text-white font-bold px-10 py-4 rounded-2xl shadow-luxury hover:bg-yellow-600 transition-all uppercase tracking-widest text-[10px]"
                    >
                        Guardar Cambios
                    </button>
                </div>
            </div>

            {/* Other Settings Placeholder */}
            <div className="bg-gray-800 p-8 rounded-[3rem] shadow-premium text-white">
                <h3 className="font-display text-3xl font-bold italic mb-4">Información del Sistema</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-[10px] uppercase tracking-widest text-gray-400">Estado del Servidor</span>
                        <span className="text-[10px] uppercase tracking-widest text-green-400 font-bold">Online</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-[10px] uppercase tracking-widest text-gray-400">Versión de App</span>
                        <span className="text-[10px] uppercase tracking-widest font-bold">v2.0.4-stable</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
