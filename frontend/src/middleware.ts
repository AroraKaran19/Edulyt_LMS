import { NextResponse } from 'next/server';

export function middleware() {
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
