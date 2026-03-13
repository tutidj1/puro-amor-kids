export interface Product {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    category: string;
    sizes: string[];
    colors: string[];
    image: string;
    description: string;
    isNew?: boolean;
    onSale?: boolean;
}

export const MOCK_PRODUCTS: Product[] = [
    {
        id: "PROD-001",
        name: "Enterito Solcito Mostaza",
        price: 12500,
        originalPrice: 15000,
        category: "Enteritos",
        sizes: ["3m", "6m", "9m"],
        colors: ["Mostaza", "Crema"],
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBA8eeD6DwexrSFksbA3xt_C7O7jQJIUa07kPPZM7cFKmBeagMCaIaigCKOf637JbbAWyU70XUCU8oHKQji0V3FqEhh_Dgi-5irp1QpJZlUnGdj5otD9IoipZ7FDaX13VlNR-ekTNLekNzWzzg70t5_ipk0olL7J_HexE-5MtCod0PRkI3ccBnd7qr5z03ttJulLwbV8d7dqx3k6U9ZnsIuAocFqyPQQdOO2mzoqnyJjs-vUvmVE7S5BECEvOM4FB6Hcg6Sc8xmUgI",
        description: "Enterito de algodón premium con broches a presión para mayor comodidad.",
        isNew: true,
        onSale: true
    },
    {
        id: "PROD-002",
        name: "Campera Denim Classic",
        price: 22800,
        category: "Abrigos",
        sizes: ["12m", "18m", "2"],
        colors: ["Azul Denim"],
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBJQgUmIR1kMgDBvWhv8jHFQFDljy8wgsJGgHYZuUWAo39wJPid8nDInorLdyofwl0xQxRUH6R_CMUejDhaiOCweXqcSYtDtP921mQ3BkJO_clyfQaUh01Efgb--OWfpcq_EK9wU4VToF-mkmIaeyzFfygxrZdk7U6y7cMCfWSj0HaVxKVKVaq3p_FyT5tp-yNtXC6YBD1YcCSnp_GQXbknkKB0Os5pnkg0JxqXF_heZ1MOkJra_tOygt62SdrsWEOUwyje-jXC6pE",
        description: "Campera de jean clásica con lavado suave para pieles sensibles."
    },
    {
        id: "PROD-003",
        name: "Vestido Flores Mágicas",
        price: 18900,
        category: "Vestidos",
        sizes: ["4", "6", "8"],
        colors: ["Rosa", "Blanco"],
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2wI1iPoO0N5xUiBVKJp3rJcJam0J0M_ypCIcSThLZwEwXAVoxtJOFNwM2d5Wx4CebCHYvSg7DPEM_PrAzPj_efxjGffJEMk7JRiqFfe8uQqrSTl8zrOBWa_US4jkzVpvSyuRFwRzNQ32qpNYZpPQ8IffYUo4OvucKcsDTaQorX8uKMmb_Z_NEIs4QLTCqLmTIewQTrSAtU5xTIJ-ZhKzFBQgwY0a6REqr0h7LOdXkgiT5XpqZgWXnm0VAFn3jBW9LeeivS01J4Wo",
        description: "Vestido de gasa con estampado floral y forro de algodón."
    },
    {
        id: "PROD-004",
        name: "Set Tejido Nórdico",
        price: 15200,
        category: "Conjuntos",
        sizes: ["0m", "3m", "6m"],
        colors: ["Gris", "Celeste"],
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBIDYzIZLAMp5WQcTxexWcqSK3k7lwaQw5Ejx92M2lbqX1qjvx12I3KtmgTc72PZ0ba39wWg_pBxH_pYifpKgBjDhyetIverGksS9Oxd3-Ve7SbNXDClt96RBpoINkuUBxh43damgheyMtwgO1Ui9XyJJ0YA70i_V3hVtYkLoDHhFcIfP_oa-tvR2Ciq0pn-ez2iXuizr4bNiIQJ-IhT4pReaIyawBQFWKk6a3VimRTfkH9aIuBo4dBHIQoQAhCvTGAg4v-lMz-_RQ",
        description: "Set de dos piezas tejido en lana hipoalergénica."
    },
    {
        id: "PROD-005",
        name: "Remera Rayas Marinero",
        price: 9900,
        category: "Remeras",
        sizes: ["2", "4", "6"],
        colors: ["Azul/Blanco"],
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCIEsgZO49YOLLHW5_mIoRA3aGHidO-LhI3G43sqiyONFsN_Y8hfYHS27Hppa7dmSIr6apr5p3SjzonvNWPobP_LslTXmD4-e8AEshlGURAYooXkKq-foVsoXMnpiHfauLhDwxMYa-zb7lAGCbfZnzWB3p6PHLzBnNROnXVYi17PymIo9U7UR-bkfWtGcCH9MJHwVVvFz_zaxzhvJRaAUW2H7J5zOY0pJjD7YEOP6c5xDwi0tDXBOpA8GkfuOtHIkUDumsN-WJNqD0",
        description: "Remera de algodón con rayas clásicas marineras."
    },
    {
        id: "PROD-006",
        name: "Sombrero de Playa Pink",
        price: 6500,
        category: "Accesorios",
        sizes: ["Único"],
        colors: ["Rosa"],
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuByhBXVQ1t8roJPNwtx7Ge0YNReYVK_TKXZ0yqgi0CaKkLq-GYG5p0ae5hW452aJ9RYcXHviWzeEwaRM-J9hgUu3LpwZd0i9OGlIE9efmiD1JuEC5vEUU16ObxnWgDTJEmKAbp8ReiBDNe0_AvDViQlFdj9Wefi3GA5xpwXv21EbbpCEAPAaYSm0ZR-zWmD1aDWtyl_mtinZdjsYWod8zbz2w4O5CxeSgg780nnouuW4s9jRi2OuyMCqGIlhLF_1ITc0KKMAyXEfvU",
        description: "Sombrero de rafia con cinta ajustable."
    },
    {
        id: "PROD-007",
        name: "Pantalón Jogger Soft",
        price: 11200,
        category: "Pantalones",
        sizes: ["2", "4", "6", "8"],
        colors: ["Verde", "Gris"],
        image: "https://placehold.co/400x500/FDFCF5/2D3B36?text=Pantalon+Jogger",
        description: "Pantalón de frisa liviana, ideal para el juego diario."
    },
    {
        id: "PROD-008",
        name: "Body Algodón Pima",
        price: 7800,
        category: "Bodys",
        sizes: ["0m", "3m", "6m"],
        colors: ["Blanco", "Celeste", "Rosa"],
        image: "https://placehold.co/400x500/FDFCF5/2D3B36?text=Body+Pima",
        description: "Body básico de algodón pima, el más suave para el recién nacido."
    },
    {
        id: "PROD-009",
        name: "Zapatillas Urban Kids",
        price: 24500,
        category: "Calzado",
        sizes: ["20", "21", "22", "23"],
        colors: ["Blanco/Miel"],
        image: "https://placehold.co/400x500/FDFCF5/2D3B36?text=Zapatillas+Urban",
        description: "Calzado ergonómico con suela flexible."
    },
    {
        id: "PROD-010",
        name: "Sweater Rayado Lana",
        price: 16800,
        category: "Abrigos",
        sizes: ["2", "4", "6"],
        colors: ["Mostaza/Crema"],
        image: "https://placehold.co/400x500/FDFCF5/2D3B36?text=Sweater+Rayado",
        description: "Sweater tejido con mezcla de lana suave."
    },
    {
        id: "PROD-011",
        name: "Short de Baño Selva",
        price: 8900,
        category: "Trajes de Baño",
        sizes: ["4", "6", "8"],
        colors: ["Verde"],
        image: "https://placehold.co/400x500/FDFCF5/2D3B36?text=Short+Baño",
        description: "Short con protección UV y secado rápido."
    },
    {
        id: "PROD-012",
        name: "Mochila Animalitos",
        price: 13400,
        category: "Accesorios",
        sizes: ["Único"],
        colors: ["León", "Oso"],
        image: "https://placehold.co/400x500/FDFCF5/2D3B36?text=Mochila+Kids",
        description: "Mochila pequeña para jardín con motivos de animales."
    }
];
