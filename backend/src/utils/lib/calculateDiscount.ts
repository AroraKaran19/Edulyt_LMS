import { Discount, CourseDiscount } from "../../types";

/**
 * Check if plan discount is currently active
 * Only apply when current date is within startDate and endDate.
 */
function isPlanDiscountCurrentlyActive(planDiscount?: Discount | null): boolean {
  if (!planDiscount || !planDiscount.isActive) return false;
  if (!planDiscount.startDate || !planDiscount.endDate) return true;
  const now = new Date();
  const startDate = new Date(planDiscount.startDate);
  const endDate = new Date(planDiscount.endDate);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  return now >= startDate && now <= endDate;
}

/**
 * Check if course discount is currently active
 * Respects displayTime/resetAfter (expired) and startTime/endTime window.
 */
function isCourseDiscountCurrentlyActive(courseDiscount?: CourseDiscount | null): boolean {
  if (!courseDiscount || !courseDiscount.isActive) return false;
  const cd = courseDiscount as CourseDiscount & { displayTime?: string; resetAfter?: number };
  if (cd.displayTime === "00:00:00" || cd.resetAfter === 0) return false;
  if (!cd.startTime || !cd.endTime) return true;
  const now = new Date();
  const [startHour, startMin] = cd.startTime.split(":").map(Number);
  const [endHour, endMin] = cd.endTime.split(":").map(Number);
  const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
  const startTimeInMinutes = startHour * 60 + startMin;
  const endTimeInMinutes = endHour * 60 + endMin;
  if (startTimeInMinutes <= endTimeInMinutes) {
    return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
  }
  return currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes <= endTimeInMinutes;
}

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
  courseDiscount?: CourseDiscount | Discount | null,
  planDiscount?: Discount
): number => {
  let totalDiscountAmount = 0;

  // Course discount: only apply when currently active (time window matches frontend)
  if (courseDiscount && isCourseDiscountCurrentlyActive(courseDiscount)) {
    if (courseDiscount.discount === "percentage") {
      totalDiscountAmount += (planPrice * courseDiscount.value) / 100;
    } else {
      totalDiscountAmount += courseDiscount.value;
    }
  }

  // Plan discount: only apply when currently active (date range matches frontend)
  if (planDiscount && isPlanDiscountCurrentlyActive(planDiscount)) {
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
