import { Discount } from "@/types";

/**
 * Interface for the result of combined discount calculation
 */
export interface CombinedDiscountResult {
  discountPrice: number;
  discountLabel: string;
  discountType: string;
  discountValue: number;
}

/**
 * Calculates combined discount from course and plan discounts
 * Applies plan discount first, then course discount on the already discounted price
 * 
 * @param planPrice - The original plan price
 * @param planDiscount - Optional plan-level discount
 * @param courseDiscount - Optional course-level discount
 * @returns Combined discount result with final price and labels
 */
export const calculateCombinedDiscount = (
  planPrice: number,
  planDiscount?: Discount,
  courseDiscount?: Discount
): CombinedDiscountResult => {
  let finalPrice = planPrice;
  let discountLabel = "";
  let discountType = "";
  let discountValue = 0;

  // Apply plan discount first
  if (planDiscount?.value) {
    if (planDiscount.discount === "fixed") {
      finalPrice -= planDiscount.value;
      discountValue = planDiscount.value;
      discountType = "fixed";
      discountLabel = `₹${planDiscount.value} off`;
    } else {
      const planDiscountAmount = (planPrice * planDiscount.value) / 100;
      finalPrice -= planDiscountAmount;
      discountValue = planDiscount.value;
      discountType = "percentage";
      discountLabel = `${planDiscount.value}% off`;
    }
  }

  // Apply course discount on the already discounted price
  if (courseDiscount?.value) {
    if (courseDiscount.discount === "fixed") {
      finalPrice -= courseDiscount.value;
      // Update label to show combined discount
      if (discountLabel) {
        discountLabel += ` + ₹${courseDiscount.value} off`;
      } else {
        discountLabel = `₹${courseDiscount.value} off`;
      }
    } else {
      const courseDiscountAmount = (finalPrice * courseDiscount.value) / 100;
      finalPrice -= courseDiscountAmount;
      // Update label to show combined discount
      if (discountLabel) {
        discountLabel += ` + ${courseDiscount.value}% off`;
      } else {
        discountLabel = `${courseDiscount.value}% off`;
      }
    }
  }

  return {
    discountPrice: Math.round(Math.max(0, finalPrice)), // Ensure price doesn't go below 0
    discountLabel,
    discountType,
    discountValue,
  };
};

/**
 * Calculates a simple discount (single discount only)
 * Useful for cases where you only need to apply one discount
 * 
 * @param price - The original price
 * @param discount - The discount to apply
 * @returns Simple discount result
 */
export const calculateSimpleDiscount = (
  price: number,
  discount?: Discount
): CombinedDiscountResult => {
  if (!discount?.value) {
    return {
      discountPrice: price,
      discountLabel: "",
      discountType: "",
      discountValue: 0,
    };
  }

  let finalPrice = price;
  let discountLabel = "";
  const discountType = discount.discount;
  const discountValue = discount.value;

  if (discount.discount === "fixed") {
    finalPrice -= discount.value;
    discountLabel = `₹${discount.value} off`;
  } else {
    const discountAmount = (price * discount.value) / 100;
    finalPrice -= discountAmount;
    discountLabel = `${discount.value}% off`;
  }

  return {
    discountPrice: Math.round(Math.max(0, finalPrice)),
    discountLabel,
    discountType,
    discountValue,
  };
};

/**
 * Checks if a discount is currently active based on start and end dates
 * 
 * @param discount - The discount to check
 * @returns True if discount is active, false otherwise
 */
export const isDiscountActive = (discount?: Discount): boolean => {
  if (!discount?.value || discount.isActive === false) {
    return false;
  }

  const now = new Date();
  const startDate = discount.startDate ? new Date(discount.startDate) : null;
  const endDate = discount.endDate ? new Date(discount.endDate) : null;

  // If no dates are set, consider it active if isActive is true
  if (!startDate && !endDate) {
    return discount.isActive === true;
  }

  // Check if current time is within the discount period
  if (startDate && now < startDate) {
    return false;
  }

  if (endDate && now > endDate) {
    return false;
  }

  return true;
};

/**
 * Gets the effective discount (the one that should be used for calculations)
 * Prioritizes plan discount over course discount if both exist
 * 
 * @param planDiscount - Plan-level discount
 * @param courseDiscount - Course-level discount
 * @returns The effective discount to use
 */
export const getEffectiveDiscount = (
  planDiscount?: Discount,
  courseDiscount?: Discount
): { plan?: Discount; course?: Discount } => {
  return {
    plan: planDiscount,
    course: courseDiscount,
  };
};
