"use client";

import { useWishlistStore } from "@/store/useWishlistStore";
import { INVENTORY } from "@/data/inventory";
import ProductCard from "@/components/ProductCard";
import Head from "next/head";

export default function WishlistPage() {
    const { favoriteIds } = useWishlistStore();

    const favoriteProducts = INVENTORY.filter(product => favoriteIds.includes(product.id));

    return (
        <div className="min-h-screen bg-[#F5F5F3] pt-32 pb-24">
            <Head>
                <title>Tesoritos Favoritos | Puro Amor Kids</title>
            </Head>
            <div className="max-w-7xl mx-auto px-4 sm:px-8">
                <h1 className="text-5xl font-display font-bold text-gray-800 tracking-tighter mb-4 italic">Tus Tesoros Favoritos</h1>
                <p className="text-gray-500 mb-12">Todas las prendas que te enamoraron, guardadas en un solo lugar.</p>

                {favoriteProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {favoriteProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                image={product.images[0]}
                                name={product.name}
                                price={product.basePrice}
                                category={product.category}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32 bg-white rounded-[3rem] shadow-sm">
                        <span className="material-symbols-outlined text-gray-300 text-6xl mb-4">favorite_border</span>
                        <h2 className="text-2xl font-display font-bold text-gray-800 mb-2">Aún no tienes favoritos</h2>
                        <p className="text-gray-500 max-w-md mx-auto">Explora nuestro catálogo y guarda tus tesoros preferidos tocando el corazón.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
