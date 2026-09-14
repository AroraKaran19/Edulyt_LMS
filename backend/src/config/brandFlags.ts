export type BrandEnforcement = "off" | "grace" | "on";

/**
 * How strictly a session is tied to one brand. Off until the brand backfill
 * has run everywhere, because enforcing earlier locks out anyone whose
 * memberships are not set yet. Read per call so it can be flipped by restart
 * without a redeploy, and so tests can set it.
 */
export const brandEnforcement = (): BrandEnforcement => {
  const value = process.env.BRAND_ENFORCEMENT;
  return value === "grace" || value === "on" ? value : "off";
};

/**
 * Until this is on, Airkrit still serves professional courses and internships,
 * because Edulyt cannot serve them yet and learners must not lose access in
 * the gap. Flipping it back restores the old behaviour without touching data.
 */
export const edulytCutover = (): boolean => process.env.EDULYT_CUTOVER === "true";
