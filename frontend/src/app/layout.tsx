import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingCart from "@/components/FloatingCart";

export const metadata: Metadata = {
    title: "Puro Amor Kids | Ropa Premium para Niños",
    description: "Ropa premium para los más pequeños, diseñada con amor y calidad superior. Bebés, niños y niñas.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <head>
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />
            </head>
            <body className="antialiased bg-cream font-body text-text-dark min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1">
                    {children}
                </main>
                <Footer />
                <FloatingCart />
            </body>
        </html>
    );
}
