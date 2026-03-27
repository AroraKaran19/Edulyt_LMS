import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req) {
    const { pathname, searchParams } = req.nextUrl;
    const token = req.nextauth.token;

    // If user is authenticated and trying to access auth pages, redirect to callbackUrl or dashboard
    if (
      token &&
      (pathname.startsWith("/login") || pathname.startsWith("/register"))
    ) {
      const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
      return NextResponse.redirect(new URL(callbackUrl, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow access to auth pages without token
        if (
          pathname.startsWith("/login") ||
          pathname.startsWith("/register") ||
          pathname.startsWith("/api/auth")
        ) {
          return true;
        }

        // Require authentication for protected routes
        if (
          pathname.startsWith("/dashboard") ||
          pathname.startsWith("/admin") ||
          pathname.startsWith("/instructor") ||
          pathname.startsWith("/cart")
        ) {
          return !!token;
        }

        // Allow public routes
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/instructor/:path*",
    "/cart/:path*",
    "/login",
    "/register",
  ],
};
