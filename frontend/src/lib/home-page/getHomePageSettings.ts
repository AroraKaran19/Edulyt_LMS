import { API_BASE_URL, ENDPOINTS } from "@/constants/endpoints";
import type { HomePageSettings } from "@/types/home-page-settings";

/** Cache tag the backend busts via POST /revalidate after a home page edit. */
export const HOME_PAGE_SETTINGS_TAG = "home-page-settings";

/**
 * Backstop only. Edits go live immediately through the cache bust; this bounds
 * staleness if a bust is ever missed (backend down, secret misconfigured).
 */
const REVALIDATE_SECONDS = 3600;

/** The API wraps payloads as `{ data: <settings> }`. Anything else means "no settings". */
function parseSettings(payload: unknown): HomePageSettings {
  if (!payload || typeof payload !== "object") return {};
  const envelope = payload as { data?: unknown };
  const data = envelope.data;
  if (!data || typeof data !== "object") return {};
  return data as HomePageSettings;
}

/**
 * Reads the marketing home page CMS singleton on the server.
 *
 * NEVER throws. A dead API or a malformed document falls back to `{}`, and every
 * section component already renders its own hardcoded copy when its slice is
 * missing, so the page degrades to shipped defaults rather than blank.
 *
 * Cached under the `home-page-settings` tag, so visitors are served from the
 * Next data cache instead of hitting the API (and its database) per request.
 */
export const getHomePageSettings = async (): Promise<HomePageSettings> => {
  try {
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.homePageSettings}`, {
      next: { tags: [HOME_PAGE_SETTINGS_TAG], revalidate: REVALIDATE_SECONDS },
    });

    if (!res.ok) {
      throw new Error(`Home page settings fetch failed: ${res.status}`);
    }

    return parseSettings(await res.json());
  } catch (error) {
    console.error("[home-page-settings] Falling back to UI defaults:", error);
    return {};
  }
};
