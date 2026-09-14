import {
  DEFAULT_BRAND,
  STAFF_USER_TYPES,
  isBrand,
  type Brand,
} from "../constants/brands";
import type { BrandEnforcement } from "../config/brandFlags";

export const isStaffUserType = (userType: unknown): boolean =>
  STAFF_USER_TYPES.includes(String(userType));

/**
 * An account with no memberships predates the split, when everyone was on
 * Airkrit. Reading it as Airkrit rather than as nobody is what keeps the
 * backfill from being able to lock anyone out.
 */
export const effectiveBrands = (brands: unknown): Brand[] => {
  const known = Array.isArray(brands) ? brands.filter(isBrand) : [];
  return known.length > 0 ? known : [DEFAULT_BRAND];
};

export const canUseBrand = (
  user: { userType?: unknown; brands?: unknown },
  brand: Brand,
): boolean =>
  isStaffUserType(user.userType) || effectiveBrands(user.brands).includes(brand);

export type TokenBrandVerdict = "ok" | "mismatch";

/**
 * Tokens minted before brand binding carry no claim. Under grace they count as
 * Airkrit so nobody is signed out by the deploy; once enforcement is on they
 * are refused and the next refresh mints a bound one.
 */
export const checkTokenBrand = (
  tokenBrand: unknown,
  requestBrand: Brand,
  mode: BrandEnforcement,
): TokenBrandVerdict => {
  if (mode === "off") {
    return "ok";
  }
  if (isBrand(tokenBrand)) {
    return tokenBrand === requestBrand ? "ok" : "mismatch";
  }
  return mode === "grace" && requestBrand === DEFAULT_BRAND ? "ok" : "mismatch";
};

/** The partner portal is Airkrit's, so a partner never joins another brand. */
export const canJoinBrand = (
  user: { userType?: unknown },
  brand: Brand,
): boolean => String(user.userType) !== "partner" || brand === DEFAULT_BRAND;
