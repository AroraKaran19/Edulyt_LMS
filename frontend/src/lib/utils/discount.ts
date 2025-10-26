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
} => {
  let finalPrice = planPrice;
  let discountLabel = "";
  let discountType = "";
  let discountValue = 0;

  // Apply plan discount first (only if it exists and is active)
  if (planDiscount?.value && planDiscount.isActive) {
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

  // Apply course discount on the already discounted price (only if it exists and is active)
  if (courseDiscount?.value && courseDiscount.isActive) {
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
    discountPrice: Math.round(Math.max(0, finalPrice)) || 0, // Ensure price doesn't go below 0
    discountLabel: discountLabel || "",
    discountType: discountType || "",
    discountValue: discountValue || 0,
  };
};
