export type Brand = "airkrit" | "edulyt";
export type BrandFilter = "all" | Brand;

export const BRANDS: readonly Brand[] = ["airkrit", "edulyt"];

export const BRAND_LABEL: Record<Brand, string> = {
  airkrit: "Airkrit",
  edulyt: "Edulyt",
};

/** Public origins, for previews in the admin panel. */
export const BRAND_SITE_URL: Record<Brand, string> = {
  airkrit: "https://airkrit.com",
  edulyt: "https://edulyt.com",
};

export const isBrand = (value: unknown): value is Brand =>
  value === "airkrit" || value === "edulyt";

/** Error code the API returns when a correct password meets a missing membership. */
export const BRAND_NOT_JOINED = "BRAND_NOT_JOINED";
