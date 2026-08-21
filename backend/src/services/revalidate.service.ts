import axios from "axios";

/** Next route that busts the cached home page settings. */
const REVALIDATE_PATH = "/revalidate";

/**
 * Falls back to `FRONTEND_URL` so a normal deploy only has to set
 * `REVALIDATE_SECRET`. Set `FRONTEND_REVALIDATE_URL` when the frontend is
 * reachable at a different address from inside the network than it is publicly.
 */
function resolveRevalidateUrl(): string | null {
  const explicit = process.env.FRONTEND_REVALIDATE_URL?.trim();
  if (explicit) return explicit;

  const base = process.env.FRONTEND_URL?.trim();
  if (!base) return null;

  return `${base.replace(/\/+$/, "")}${REVALIDATE_PATH}`;
}

/**
 * Cache tags the frontend knows how to bust. Sent as a body field so one route
 * serves every CMS page; the frontend rejects anything not on its own allowlist.
 */
export const REVALIDATE_TAGS = {
  homePage: "home-page-settings",
  enquiryPage: "enquiry-page-settings",
} as const;

export type RevalidateTag =
  (typeof REVALIDATE_TAGS)[keyof typeof REVALIDATE_TAGS];

/**
 * Busts the Next cache after a settings write.
 *
 * Deliberately fire-and-forget: the edit is already persisted, so a failure here
 * must not fail the admin's request. Worst case the change goes live when the
 * time-based revalidate expires instead of immediately.
 *
 * Defaults to the home page tag so the original caller keeps working unchanged.
 */
export const triggerRevalidate = async (
  tag: RevalidateTag = REVALIDATE_TAGS.homePage,
): Promise<void> => {
  const url = resolveRevalidateUrl();
  const secret = process.env.REVALIDATE_SECRET;

  if (!url || !secret) {
    console.warn("⚠️  Revalidation not configured - skipping cache bust");
    return;
  }

  try {
    await axios.post(
      url,
      { tag },
      {
        headers: { "x-revalidate-secret": secret },
        timeout: 5000,
      },
    );
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : null;
    console.error(
      `⚠️  Revalidation failed${status ? ` (${status})` : ""}:`,
      error instanceof Error ? error.message : error,
    );
  }
};
