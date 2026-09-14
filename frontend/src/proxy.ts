import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse, type NextFetchEvent } from "next/server";
import { getPostLoginRedirectPath } from "@/lib/postLoginRedirect";
import { edulytRedirectUrl } from "@/lib/edulytRedirect";

const authProxy = withAuth(
  function authenticatedProxy(req) {
    const { pathname, searchParams } = req.nextUrl;
    const token = req.nextauth.token;

    // If user is authenticated and trying to access auth pages, redirect to role home / callbackUrl
    if (
      token &&
      (pathname.startsWith("/login") || pathname.startsWith("/register"))
    ) {
      const ut = (token as { userType?: string })?.userType;
      const dest = getPostLoginRedirectPath(
        { userType: ut },
        searchParams.get("callbackUrl"),
      );
      return NextResponse.redirect(new URL(dest, req.url));
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
          pathname.startsWith("/profile") ||
          pathname.startsWith("/settings") ||
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

export default function proxy(req: NextRequestWithAuth, event: NextFetchEvent) {
  // Ahead of the auth check, so a signed-out learner on an old dashboard link
  // lands on Edulyt rather than on Airkrit's login.
  const moved = edulytRedirectUrl(req.nextUrl);
  if (moved) {
    return NextResponse.redirect(moved, 301);
  }
  return authProxy(req, event);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/instructor/:path*",
    "/cart/:path*",
    "/login",
    "/register",
    "/internships",
    "/internships/:path*",
  ],
};
