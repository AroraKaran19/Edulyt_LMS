import { API_BASE_URL, ENDPOINTS } from "@/constants/endpoints";
import type { EnquiryPageSettings } from "@/types/enquiry-page-settings";

/** Cache tag the backend busts via POST /revalidate after an enquiry edit. */
export const ENQUIRY_PAGE_SETTINGS_TAG = "enquiry-page-settings";

/**
 * Backstop only. Edits go live immediately through the cache bust; this bounds
 * staleness if a bust is ever missed (backend down, secret misconfigured).
 */
const REVALIDATE_SECONDS = 3600;

function parseSettings(payload: unknown): EnquiryPageSettings {
  if (!payload || typeof payload !== "object") return {};
  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== "object") return {};
  return data as EnquiryPageSettings;
}

/**
 * Reads the enquiry page CMS singleton on the server.
 *
 * NEVER throws. A dead API or malformed document falls back to `{}`, and every
 * section renders its shipped constants when its slice is missing, so the page
 * degrades to what it looks like today rather than blank.
 */
export const getEnquiryPageSettings =
  async (): Promise<EnquiryPageSettings> => {
    try {
      const res = await fetch(
        `${API_BASE_URL}${ENDPOINTS.enquiryPageSettings}`,
        {
          next: {
            tags: [ENQUIRY_PAGE_SETTINGS_TAG],
            revalidate: REVALIDATE_SECONDS,
          },
        },
      );

      if (!res.ok) {
        throw new Error(`Enquiry page settings fetch failed: ${res.status}`);
      }

      return parseSettings(await res.json());
    } catch (error) {
      console.error("[enquiry-page-settings] Falling back to defaults:", error);
      return {};
    }
  };
