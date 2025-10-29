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
 * Calculate the final price after applying both course and plan discounts simultaneously
 * Both discounts are calculated on the original price and then combined
 *
 * @param planPrice - The original plan price
 * @param courseDiscount - The course-level discount configuration
 * @param planDiscount - The plan-level discount configuration
 * @returns The final discounted price after applying both discounts simultaneously
 *
 * @example
 * // Plan price: ₹100
 * // Course discount: 20% off
 * // Plan discount: ₹10 off
 * // Result: ₹100 - (₹20 + ₹10) = ₹70
 *
 * @example
 * // Plan price: ₹100
 * // Course discount: ₹15 off
 * // Plan discount: 10% off
 * // Result: ₹100 - (₹15 + ₹10) = ₹75
 */
export const calculateFinalDiscountedPrice = (
  planPrice: number,
  courseDiscount?: Discount,
  planDiscount?: Discount
): number => {
  let totalDiscountAmount = 0;

  // Calculate course discount on original price
  if (courseDiscount && courseDiscount.isActive) {
    if (courseDiscount.discount === "percentage") {
      totalDiscountAmount += (planPrice * courseDiscount.value) / 100;
    } else {
      totalDiscountAmount += courseDiscount.value;
    }
  }

  // Calculate plan discount on original price (simultaneously)
  if (planDiscount && planDiscount.isActive) {
    if (planDiscount.discount === "percentage") {
      totalDiscountAmount += (planPrice * planDiscount.value) / 100;
    } else {
      totalDiscountAmount += planDiscount.value;
    }
  }

  // Calculate final price by subtracting total discount from original price
  const finalPrice = planPrice - totalDiscountAmount;

  return Math.round(Math.max(0, finalPrice)); // Ensure price doesn't go below 0
};
