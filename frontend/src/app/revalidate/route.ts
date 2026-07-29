import { revalidateTag } from "next/cache";
import { HOME_PAGE_SETTINGS_TAG } from "@/lib/home-page/getHomePageSettings";

/**
 * Cache bust, called by the backend after a home page settings write.
 *
 * Kept outside /api so it can never collide with the NextAuth handlers already
 * mounted there. Fails closed: with no REVALIDATE_SECRET configured, no caller
 * can match it and every request is rejected.
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-revalidate-secret");
  const expected = process.env.REVALIDATE_SECRET;

  if (!expected || !secret || secret !== expected) {
    return Response.json({ message: "Invalid secret" }, { status: 401 });
  }

  // Next 16 requires a cache profile. "max" gives the longest stale-while-
  // revalidate window: visitors keep getting instant responses while the fresh
  // settings are fetched in the background.
  revalidateTag(HOME_PAGE_SETTINGS_TAG, "max");

  return Response.json({ revalidated: true, tag: HOME_PAGE_SETTINGS_TAG });
}
