import Link from 'next/link';
import { useWishlistStore } from '@/store/useWishlistStore';

interface ProductCardProps {
    id: string;
    image: string;
    name: string;
    size?: string;
    color?: string;
    price: number;
    originalPrice?: number;
    category?: string;
}

export default function ProductCard({
    id,
    image,
    name,
    size,
    color,
    price,
    originalPrice,
    category,
}: ProductCardProps) {
    const { isFavorite, toggleFavorite } = useWishlistStore();
    const favorited = isFavorite(id);

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(id);
    };
    return (
        <Link
            href={`/product/${id}`}
            className="group cursor-pointer bg-white rounded-[2.5rem] overflow-hidden shadow-premium hover:shadow-luxury transition-all duration-500 border-2 border-white flex flex-col transform hover:-translate-y-2"
        >
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-50">
                {image ? (
                    <img
                        src={image}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <span className="material-symbols-outlined text-4xl mb-2">image</span>
                        <span className="text-xs">Sin Imagen</span>
                    </div>
                )}

                {originalPrice && originalPrice > price && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider z-10">
                        -{Math.round((1 - price / originalPrice) * 100)}% OFF
                    </div>
                )}

                <button className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-12 group-hover:translate-y-0 bg-white text-text-dark hover:bg-brand-teal hover:text-gray-900 px-6 py-2 rounded-full font-bold text-sm shadow-md transition-all duration-300 whitespace-nowrap opacity-0 group-hover:opacity-100 flex items-center gap-2 z-10">
                    <span className="material-symbols-outlined text-sm">shopping_bag</span>
                    Añadir
                </button>

                <button
                    onClick={handleFavoriteClick}
                    className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-brand-grey transition-colors shadow-sm flex items-center justify-center group/fav"
                >
                    <span
                        className={`material-symbols-outlined text-lg transition-colors ${favorited ? 'text-red-500' : 'text-gray-400 group-hover/fav:text-red-500'}`}
                        style={favorited ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                        favorite
                    </span>
                </button>
            </div>

            <div className="p-4 flex flex-col flex-1 text-center">
                {category && (
                    <p className="text-[10px] text-text-light uppercase tracking-widest mb-1 font-bold">{category}</p>
                )}
                <h3 className="font-display text-xl font-bold text-text-dark leading-tight group-hover:text-brand-yellow transition-colors mb-2">
                    {name}
                </h3>

                <div className="mt-auto flex items-center justify-center">
                    <div className="flex items-center gap-2">
                        <span className="font-body font-bold text-lg text-black">
                            ${price.toLocaleString('es-AR')}
                        </span>
                        {originalPrice && originalPrice > price && (
                            <span className="font-body text-text-light line-through text-sm">
                                ${originalPrice.toLocaleString('es-AR')}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
