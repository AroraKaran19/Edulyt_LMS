import type { CaPageSettings } from "./ca-page-settings";

/**
 * Admin GET/PATCH payload. Adds the offer-letter designations, which the
 * public payload strips (see `getPublicCaPageSettingsController`).
 */
export type CaPageAdminSettings = CaPageSettings & {
  documents: { designations: { marketing: string; "social-media": string } };
};

/** Mirrors `CA_PAGE_SECTION_KEYS` in backend/src/services/caPageSettings.services.ts. */
export const CA_PAGE_ADMIN_SECTION_KEYS = [
  "batch",
  "form",
  "documents",
  "money",
  "hero",
  "kit",
  "videos",
  "faqs",
  "samples",
] as const satisfies ReadonlyArray<keyof CaPageAdminSettings>;

export type CaPageAdminSectionKey = (typeof CA_PAGE_ADMIN_SECTION_KEYS)[number];
