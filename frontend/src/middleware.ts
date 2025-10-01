import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    // Temporarily disable middleware to test
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/admin/:path*',
        '/profile/:path*',
        '/cart/:path*',
        '/auth/login',
        '/auth/register'
    ]
};
