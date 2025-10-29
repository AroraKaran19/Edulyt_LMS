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
  let totalDiscountAmount = 0;
  let discountLabel = "";
  let discountType = "";
  let discountValue = 0;
  let isActive = false;

  // Calculate plan discount on original price
  if (planDiscount?.value && planDiscount.isActive) {
    // Check if discount is within date range
    const isPlanDiscountActive = (!planDiscount.startDate || new Date(planDiscount.startDate) <= new Date()) &&
      (!planDiscount.endDate || new Date(planDiscount.endDate) >= new Date());
    
    if (planDiscount.discount === "fixed") {
      totalDiscountAmount += planDiscount.value;
      discountValue = planDiscount.value;
      discountType = "fixed";
      discountLabel = `₹${planDiscount.value} off`;
    } else {
      const planDiscountAmount = (planPrice * planDiscount.value) / 100;
      totalDiscountAmount += planDiscountAmount;
      discountValue = planDiscount.value;
      discountType = "percentage";
      discountLabel = `${planDiscount.value}% off`;
    }
    
    isActive = isPlanDiscountActive;
  }

  // Calculate course discount on original price (simultaneously)
  if (courseDiscount?.value && courseDiscount.isActive) {
    // Check if discount is within date range
    const isCourseDiscountActive = (!courseDiscount.startDate || new Date(courseDiscount.startDate) <= new Date()) &&
      (!courseDiscount.endDate || new Date(courseDiscount.endDate) >= new Date());
    
    if (courseDiscount.discount === "fixed") {
      totalDiscountAmount += courseDiscount.value;
      // Update label to show combined discount
      if (discountLabel) {
        discountLabel += ` + ₹${courseDiscount.value} off`;
      } else {
        discountLabel = `₹${courseDiscount.value} off`;
      }
    } else {
      const courseDiscountAmount = (planPrice * courseDiscount.value) / 100;
      totalDiscountAmount += courseDiscountAmount;
      // Update label to show combined discount
      if (discountLabel) {
        discountLabel += ` + ${courseDiscount.value}% off`;
      } else {
        discountLabel = `${courseDiscount.value}% off`;
      }
    }
    
    isActive = isActive || isCourseDiscountActive;
  }

  // Calculate final price by subtracting total discount from original price
  const finalPrice = planPrice - totalDiscountAmount;

  return {
    discountPrice: Math.round(Math.max(0, finalPrice)) || 0, // Ensure price doesn't go below 0
    discountLabel: discountLabel || "",
    discountType: discountType || "",
    discountValue: discountValue || 0,
    isActive: isActive,
  };
};
