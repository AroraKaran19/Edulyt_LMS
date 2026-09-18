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

/**
 * The one audience each brand sells to. A course may be held on either brand
 * with either audience, but it can only go live on the matching pair.
 */
export const AUDIENCE_BY_BRAND: Record<
  Brand,
  "college-students" | "professionals"
> = {
  airkrit: "college-students",
  edulyt: "professionals",
};

export const AUDIENCE_LABEL: Record<string, string> = {
  "college-students": "college students",
  professionals: "working professionals",
};

export const audienceMatchesBrand = (
  audience: unknown,
  brand: unknown
): boolean => isBrand(brand) && audience === AUDIENCE_BY_BRAND[brand];

/** Error code the API returns when a correct password meets a missing membership. */
export const BRAND_NOT_JOINED = "BRAND_NOT_JOINED";

/** This site is Airkrit. */
export const BRAND = "airkrit" as const;
