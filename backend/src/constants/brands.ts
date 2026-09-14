export type Brand = "airkrit" | "edulyt";

export const DEFAULT_BRAND: Brand = "airkrit";

export const BRANDS: readonly Brand[] = ["airkrit", "edulyt"];

export const isBrand = (value: unknown): value is Brand =>
  value === "airkrit" || value === "edulyt";

/**
 * Roles that work across both platforms, so they are exempt from the
 * membership check a learner has to pass.
 */
export const STAFF_USER_TYPES: readonly string[] = [
  "admin",
  "super-admin",
  "instructor",
  "marketer",
  "sales",
  "collaborator",
];

export const BRAND_NOT_JOINED = "BRAND_NOT_JOINED";

/** Narrows an untrusted body field. Anything unrecognised is the default. */
export const asBrand = (value: unknown): Brand =>
  value === "edulyt" || value === "airkrit" ? value : DEFAULT_BRAND;

export interface BrandMailIdentity {
  fromEmail: string;
  fromName: string;
  /** Public site, for links inside that brand's mail. */
  siteUrl: string;
}

/** Fallbacks. Override per brand with MSG91_EMAIL_FROM_<BRAND>. Each domain
 *  must be verified in MSG91 before it will send. */
export const BRAND_MAIL: Record<Brand, BrandMailIdentity> = {
  airkrit: {
    fromEmail: "noreply@notifications.airkrit.com",
    fromName: "Airkrit",
    siteUrl: "https://www.airkrit.com",
  },
  edulyt: {
    fromEmail: "noreply@notifications.edulyt.com",
    fromName: "Edulyt",
    siteUrl: "https://www.edulyt.com",
  },
};

export const brandEnvSuffix = (brand: Brand): string => brand.toUpperCase();

export const brandNotJoinedMessage = (brand: Brand): string =>
  `You do not have an ${BRAND_MAIL[brand].fromName} account yet.`;
