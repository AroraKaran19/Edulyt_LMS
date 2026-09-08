import crypto from "crypto";

/**
 * Draws a winner's discount from a campaign's range.
 *
 * `crypto.randomInt` rather than scaling `Math.random`: it is uniform over the
 * half-open interval with no modulo bias, which the coupon-code generator in
 * `scholarshipTestValidation` does not manage. The `+ 1` makes the maximum
 * reachable, so a campaign can actually award its ceiling.
 */
export const rollDiscountPercent = (min: number, max: number): number => {
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new Error("Discount bounds must be whole percentages");
  }
  if (min < 1 || max > 100 || min > max) {
    throw new Error("Discount bounds must satisfy 1 <= min <= max <= 100");
  }
  return crypto.randomInt(min, max + 1);
};
