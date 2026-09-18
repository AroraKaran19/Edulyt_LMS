import { BRAND_MAIL, DEFAULT_BRAND, type Brand } from "../constants/brands";

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
 * public course page renders it. A course moving brands has to lose the old
 * suffix or it advertises the site it just left.
 */
export const rebrandMetaTitle = (
  metaTitle: string | undefined,
  brand: Brand,
): string | undefined => {
  if (!metaTitle) {
    return metaTitle;
  }
  const left = BRAND_MAIL[brand === "edulyt" ? "airkrit" : "edulyt"].fromName;
  return metaTitle.replace(
    new RegExp(`\\|\\s*${left}(\\s+India)?\\s*$`, "i"),
    `| ${BRAND_MAIL[brand].fromName}`,
  );
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
