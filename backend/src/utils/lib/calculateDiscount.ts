import { Discount } from "../../types";

/**
 * Calculate the final price after applying discount
 * @param basePrice - The original price
 * @param discount - The discount configuration
 * @returns The final discounted price
 */
export const calculateDiscountedPrice = (
  basePrice: number,
  discount?: Discount
): number => {
  // If no discount or discount is inactive, return base price
  if (!discount || discount.isActive === false) {
    return basePrice;
  }

  const { discount: discountType, value: discountValue } = discount;

  if (discountType === "percentage") {
    return basePrice * (1 - discountValue / 100);
  } else {
    // Fixed amount discount
    return Math.max(0, basePrice - discountValue);
  }
};

/**
 * Calculate the final price after applying both course and plan discounts
 * First applies course-level discount, then plan-level discount
 *
 * @param planPrice - The original plan price
 * @param courseDiscount - The course-level discount configuration
 * @param planDiscount - The plan-level discount configuration
 * @returns The final discounted price after applying both discounts
 *
 * @example
 * // Plan price: ₹100
 * // Course discount: 20% off
 * // Plan discount: ₹10 off
 * // Result: ₹100 -> ₹80 (after course discount) -> ₹70 (after plan discount)
 *
 * @example
 * // Plan price: ₹100
 * // Course discount: ₹15 off
 * // Plan discount: 10% off
 * // Result: ₹100 -> ₹85 (after course discount) -> ₹76.5 (after plan discount)
 */
export const calculateFinalDiscountedPrice = (
  planPrice: number,
  courseDiscount?: Discount,
  planDiscount?: Discount
): number => {
  // First apply course-level discount
  const priceAfterCourseDiscount = calculateDiscountedPrice(
    planPrice,
    courseDiscount
  );

  // Then apply plan-level discount on the already discounted price
  const finalPrice = calculateDiscountedPrice(
    priceAfterCourseDiscount,
    planDiscount
  );

  return Math.round(finalPrice);
};
