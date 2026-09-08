export type Brand = "airkrit" | "edulyt";

export const DEFAULT_BRAND: Brand = "airkrit";

export interface BrandMailIdentity {
  fromEmail: string;
  fromName: string;
}

export const BRAND_MAIL: Record<Brand, BrandMailIdentity> = {
  airkrit: {
    fromEmail: "noreply@notifications.airkrit.com",
    fromName: "Airkrit",
  },
  edulyt: {
    fromEmail: "noreply@notifications.edulyt.com",
    fromName: "Edulyt",
  },
};

export const brandEnvSuffix = (brand: Brand): string => brand.toUpperCase();
