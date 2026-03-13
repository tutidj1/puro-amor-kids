import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ success: true });
    
    // Borrar la cookie de sesión
    response.cookies.set({
        name: 'admin_session',
        value: '',
        httpOnly: true,
        path: '/',
        maxAge: 0, // Expiración inmediata
    });

    return response;
}

export async function GET() {
    return POST(); // Permitir ambos métodos para flexibilidad
}
