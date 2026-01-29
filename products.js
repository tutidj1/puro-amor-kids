const products = [
    {
        id: 1,
        name: "Body Algodón Arcoíris",
        price: 15000,
        image: "https://images.unsplash.com/photo-1522771753035-4a53c9f13185?q=80&w=1000&auto=format&fit=crop",
        category: "Bebés",
        description: "Body de algodón orgánico suave con estampado minimalista.",
        variants: [
            { id: 101, color: "Estampado", size: "0-3m", stock: 5 },
            { id: 102, color: "Estampado", size: "3-6m", stock: 3 },
            { id: 103, color: "Estampado", size: "6-9m", stock: 0 }
        ]
    },
    {
        id: 2,
        name: "Vestido Mostaza Volados",
        price: 22500,
        image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?q=80&w=1000&auto=format&fit=crop",
        category: "Niñas",
        description: "Vestido ideal para verano, tela fresca y color vibrante.",
        variants: [
            { id: 201, color: "Mostaza", size: "2", stock: 2 },
            { id: 202, color: "Mostaza", size: "4", stock: 4 },
            { id: 203, color: "Mostaza", size: "6", stock: 1 }
        ]
    },
    {
        id: 3,
        name: "Jardinero Mint",
        price: 28000,
        image: "https://images.unsplash.com/photo-1519278409-1f56fdda7e70?q=80&w=1000&auto=format&fit=crop",
        category: "Niños",
        description: "Jardinero clásico en color menta pastel. Súper resistente.",
        variants: [
            { id: 301, color: "Mint", size: "1", stock: 3 },
            { id: 302, color: "Mint", size: "2", stock: 2 },
            { id: 303, color: "Mint", size: "3", stock: 5 }
        ]
    },
    {
        id: 4,
        name: "Set Bienvenida",
        price: 35000,
        image: "https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?q=80&w=1000&auto=format&fit=crop",
        category: "Kits",
        description: "Ajuar completo para recién nacido. Incluye gorrito y manta.",
        variants: [
            { id: 401, color: "Único", size: "Único", stock: 10 }
        ]
    },
    {
        id: 5,
        name: "Remera Rayas Kids",
        price: 12000,
        image: "https://images.unsplash.com/photo-1471286174890-9c808743a753?q=80&w=1000&auto=format&fit=crop",
        category: "Niñas",
        description: "Básico infaltable. Algodón 100% premium.",
        variants: [
            { id: 501, color: "Rayado", size: "4", stock: 6 },
            { id: 502, color: "Rayado", size: "6", stock: 4 },
            { id: 503, color: "Rayado", size: "8", stock: 2 },
            { id: 504, color: "Rayado", size: "10", stock: 3 }
        ]
    },
    {
        id: 6,
        name: "Pantalón Jogger Gris",
        price: 18500,
        image: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?q=80&w=1000&auto=format&fit=crop",
        category: "Niños",
        description: "Comodidad total para jugar. Cintura elástica.",
        variants: [
            { id: 601, color: "Gris", size: "2", stock: 4 },
            { id: 602, color: "Gris", size: "4", stock: 4 },
            { id: 603, color: "Gris", size: "6", stock: 3 },
            { id: 604, color: "Gris", size: "8", stock: 1 }
        ]
    }
];
