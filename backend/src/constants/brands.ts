export type Brand = "airkrit" | "edulyt";

export const DEFAULT_BRAND: Brand = "airkrit";

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
