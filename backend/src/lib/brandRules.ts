import { DEFAULT_BRAND, type Brand } from "../constants/brands";

/**
 * The one-time mapping used to brand existing courses and categories, and the
 * fallback for a write that names no brand until the admin form requires one.
 * Brand is its own field afterwards: an internship is Edulyt whatever its
 * audience says, and Edulyt sells to students too.
 */
export const brandFromAudience = (audience: unknown): Brand =>
  audience === "professionals" ? "edulyt" : DEFAULT_BRAND;

/**
 * The admin SEO screen bakes a brand suffix into the saved meta title, and the
 * public course page renders it. A course moving to Edulyt has to lose the
 * Airkrit suffix or it shows up on edulyt.com.
 */
export const rebrandMetaTitle = (
  metaTitle: string | undefined,
  brand: Brand,
): string | undefined => {
  if (!metaTitle || brand !== "edulyt") {
    return metaTitle;
  }
  return metaTitle.replace(/\|\s*Airkrit(\s+India)?\s*$/i, "| Edulyt");
};

/**
 * A coupon written for professional courses only belongs to Edulyt. One that
 * spans both brands stays on Airkrit and is reported, because an admin has to
 * decide what it was for.
 */
export const couponBrandFor = (
  applicableType: unknown,
  memberBrands: Brand[],
): Brand => {
  if (applicableType !== "specific-courses" || memberBrands.length === 0) {
    return DEFAULT_BRAND;
  }
  return memberBrands.every((brand) => brand === "edulyt") ? "edulyt" : DEFAULT_BRAND;
};
