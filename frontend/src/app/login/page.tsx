"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (res.ok) {
                router.push("/admin");
                router.refresh();
            } else {
                setError("Credenciales incorrectas");
            }
        } catch (err) {
            setError("Error de conexión");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center p-4">
            <Head>
                <title>Acceso Administrador | Puro Amor Kids</title>
            </Head>
            
            <div className="bg-white rounded-[2.5rem] shadow-premium p-10 w-full max-w-md">
                <div className="text-center mb-10">
                    <span className="material-symbols-outlined text-brand-yellow text-5xl mb-4">admin_panel_settings</span>
                    <h1 className="text-3xl font-display font-bold text-gray-800 tracking-tighter uppercase mb-1">Backoffice</h1>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest italic">Acceso Restringido</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Usuario</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:ring-brand-teal focus:border-brand-teal outline-none transition-all placeholder-gray-300"
                            placeholder="Ingrese su usuario..."
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:ring-brand-teal focus:border-brand-teal outline-none transition-all placeholder-gray-300"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-xs font-bold text-center italic">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-admin-primary text-brand-yellow font-bold uppercase tracking-widest text-xs py-4 rounded-full shadow-md hover:bg-admin-secondary transition-all disabled:opacity-50 mt-4"
                    >
                        {isLoading ? "Verificando..." : "Ingresar"}
                    </button>
                    
                    <div className="text-center mt-6 pt-6 border-t border-gray-50">
                        <button 
                            type="button" 
                            onClick={() => router.push('/')}
                            className="text-xs font-bold text-gray-400 hover:text-black uppercase tracking-widest italic transition-colors"
                        >
                            Volver a la tienda
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
