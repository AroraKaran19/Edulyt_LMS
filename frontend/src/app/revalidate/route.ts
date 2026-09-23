import { revalidateTag } from "next/cache";
import { HOME_PAGE_SETTINGS_TAG } from "@/lib/home-page/getHomePageSettings";
import { ENQUIRY_PAGE_SETTINGS_TAG } from "@/lib/enquiry-page/getEnquiryPageSettings";
import { CA_PAGE_SETTINGS_TAG } from "@/lib/ca-page/getCaPageSettings";

/**
 * Cache bust, called by the backend after a CMS write.
 *
 * Kept outside /api so it can never collide with the NextAuth handlers already
 * mounted there. Fails closed: with no REVALIDATE_SECRET configured, no caller
 * can match it and every request is rejected.
 */

/** Only these may be busted, so a valid secret cannot clear arbitrary tags. */
const ALLOWED_TAGS = [
  HOME_PAGE_SETTINGS_TAG,
  ENQUIRY_PAGE_SETTINGS_TAG,
  CA_PAGE_SETTINGS_TAG,
] as const;

export async function POST(request: Request) {
  const secret = request.headers.get("x-revalidate-secret");
  const expected = process.env.REVALIDATE_SECRET;

  if (!expected || !secret || secret !== expected) {
    return Response.json({ message: "Invalid secret" }, { status: 401 });
  }

  // Defaults to the home tag: the original caller sent no body at all.
  const body = await request.json().catch(() => null);
  const requested = (body as { tag?: unknown } | null)?.tag;
  const tag =
    typeof requested === "string" ? requested : HOME_PAGE_SETTINGS_TAG;

  if (!(ALLOWED_TAGS as readonly string[]).includes(tag)) {
    return Response.json({ message: "Unknown tag" }, { status: 400 });
  }

  // Next 16 requires a cache profile. "max" gives the longest stale-while-
  // revalidate window: visitors keep getting instant responses while the fresh
  // settings are fetched in the background.
  revalidateTag(tag, "max");

  return Response.json({ revalidated: true, tag });
}
