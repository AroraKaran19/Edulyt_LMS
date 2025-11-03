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
    // Check if discount should be displayed based on displayTime and resetAfter
    let isPlanDiscountActive = true;
    if (planDiscount.displayTime && planDiscount.resetAfter) {
      const now = new Date();
      const [displayHour, displayMin, displaySec] = planDiscount.displayTime.split(':').map(Number);
      const displayTimeInSeconds = displayHour * 3600 + displayMin * 60 + displaySec;
      const currentTimeInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      
      const totalSecondsInDay = 86400;
      
      let secondsSinceCycleStart: number;
      if (currentTimeInSeconds < displayTimeInSeconds) {
        const secondsFromYesterday = totalSecondsInDay - displayTimeInSeconds;
        const totalSecondsSinceCycleStart = secondsFromYesterday + currentTimeInSeconds;
        secondsSinceCycleStart = totalSecondsSinceCycleStart % planDiscount.resetAfter;
      } else {
        secondsSinceCycleStart = (currentTimeInSeconds - displayTimeInSeconds) % planDiscount.resetAfter;
      }
      
      isPlanDiscountActive = secondsSinceCycleStart < planDiscount.resetAfter;
    }
    
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
    let isCourseDiscountActive = true;
    if (courseDiscount.displayTime && courseDiscount.resetAfter) {
      const now = new Date();
      const [displayHour, displayMin, displaySec] = courseDiscount.displayTime.split(':').map(Number);
      const displayTimeInSeconds = displayHour * 3600 + displayMin * 60 + displaySec;
      const currentTimeInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      
      const totalSecondsInDay = 86400;
      
      let secondsSinceCycleStart: number;
      if (currentTimeInSeconds < displayTimeInSeconds) {
        const secondsFromYesterday = totalSecondsInDay - displayTimeInSeconds;
        const totalSecondsSinceCycleStart = secondsFromYesterday + currentTimeInSeconds;
        secondsSinceCycleStart = totalSecondsSinceCycleStart % courseDiscount.resetAfter;
      } else {
        // We're after displayTime today
        secondsSinceCycleStart = (currentTimeInSeconds - displayTimeInSeconds) % courseDiscount.resetAfter;
      }
      
      isCourseDiscountActive = secondsSinceCycleStart < courseDiscount.resetAfter;
    }
    
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
