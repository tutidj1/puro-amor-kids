import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistStore {
    favoriteIds: string[];
    toggleFavorite: (id: string) => void;
    isFavorite: (id: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
    persist(
        (set, get) => ({
            favoriteIds: [],
            toggleFavorite: (id: string) => {
                const current = get().favoriteIds;
                if (current.includes(id)) {
                    set({ favoriteIds: current.filter((item) => item !== id) });
                } else {
                    set({ favoriteIds: [...current, id] });
                }
            },
            isFavorite: (id: string) => get().favoriteIds.includes(id),
        }),
        {
            name: 'puroamor-wishlist',
        }
    )
);
