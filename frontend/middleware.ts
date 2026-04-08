import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Dashboard routes under `/instructor` — must not redirect to `/mentor`. */
const INSTRUCTOR_APP_ROOT_SEGMENTS = new Set(["reviews", "qna", "course"]);

/**
 * Legacy public profiles lived at `/instructor/:slug` and conflicted with the
 * instructor dashboard. Redirect one-segment paths only to `/mentor/:slug`.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const parts = pathname.split("/").filter(Boolean);

  if (parts[0] !== "instructor" || parts.length !== 2) {
    return NextResponse.next();
  }

  const segment = parts[1];
  if (!segment || INSTRUCTOR_APP_ROOT_SEGMENTS.has(segment)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(
    new URL(`/mentor/${encodeURIComponent(segment)}`, request.url),
    308
  );
}

export const config = {
  matcher: ["/instructor/:path*"],
};
