import { Discount } from "@/types";

export const calculateDiscountDisplay = (
  planPrice: number,
  planDiscount?: Discount,
  courseDiscount?: Discount
): {
  discountPrice: number;
  discountLabel: string;
  discountType: string;
  discountValue: number;
  isActive: boolean;
} => {
  let finalPrice = planPrice;
  let discountLabel = "";
  let discountType = "";
  let discountValue = 0;
  let isActive = false;

  // Apply plan discount first (calculate regardless of date for display)
  if (planDiscount?.value && planDiscount.isActive) {
    // Check if discount is within date range
    const isPlanDiscountActive = (!planDiscount.startDate || new Date(planDiscount.startDate) <= new Date()) &&
      (!planDiscount.endDate || new Date(planDiscount.endDate) >= new Date());
    
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
    
    isActive = isPlanDiscountActive;
  }

  // Apply course discount on the already discounted price (calculate regardless of date for display)
  if (courseDiscount?.value && courseDiscount.isActive) {
    // Check if discount is within date range
    const isCourseDiscountActive = (!courseDiscount.startDate || new Date(courseDiscount.startDate) <= new Date()) &&
      (!courseDiscount.endDate || new Date(courseDiscount.endDate) >= new Date());
    
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
    
    isActive = isActive || isCourseDiscountActive;
  }

  return {
    discountPrice: Math.round(Math.max(0, finalPrice)) || 0, // Ensure price doesn't go below 0
    discountLabel: discountLabel || "",
    discountType: discountType || "",
    discountValue: discountValue || 0,
    isActive: isActive,
  };
};
