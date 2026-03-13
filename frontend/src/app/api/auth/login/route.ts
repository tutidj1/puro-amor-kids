import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (username === 'tomas123' && password === '12345') {
            const response = NextResponse.json({ success: true }, { status: 200 });
            
            response.cookies.set({
                name: 'admin_session',
                value: 'authenticated',
                httpOnly: true,
                path: '/',
                maxAge: 60 * 60 * 24 * 7, // 1 semana
            });

            return response;
        }

        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
