// Client-visible feature flags. NEXT_PUBLIC_ vars are inlined at build time, so
// these are plain module constants (evaluated once when the bundle loads).

/**
 * Mirrors the backend CATEGORY_SIBLING_ENROLLMENT_ENABLED flag. When "true",
 * buying one course in a category grants its sibling courses (same primary
 * category) for free, and the UI advertises that perk. Keep both env vars in
 * sync — if they diverge, students see a perk that isn't actually granted.
 */
export const CATEGORY_SIBLING_PERK_ENABLED =
  process.env.NEXT_PUBLIC_CATEGORY_SIBLING_ENROLLMENT_ENABLED === "true";
