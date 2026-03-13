import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    const url = req.nextUrl;
    
    if (url.pathname.startsWith('/admin')) {
        const session = req.cookies.get('admin_session');

        if (!session || session.value !== 'authenticated') {
            // Redirect to login page
            const loginUrl = new URL('/login', req.url);
            return NextResponse.redirect(loginUrl);
        }
    }
    
    // Redirect /login to /admin if already authed
    if (url.pathname === '/login') {
        const session = req.cookies.get('admin_session');
        if (session && session.value === 'authenticated') {
            return NextResponse.redirect(new URL('/admin', req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/admin', '/login'],
};
