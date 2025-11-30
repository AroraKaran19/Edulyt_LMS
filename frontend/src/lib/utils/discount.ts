import { Discount, CourseDiscount } from "@/types";

export const calculateDiscountDisplay = (
  planPrice: number,
  planDiscount?: Discount,
  courseDiscount?: CourseDiscount
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
    // Check if discount should be displayed based on startDate and endDate
    let isPlanDiscountActive = true;
    if (planDiscount.startDate && planDiscount.endDate) {
      const now = new Date();
      const startDate = new Date(planDiscount.startDate);
      const endDate = new Date(planDiscount.endDate);
      
      // Set time to start of day for date comparison
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      isPlanDiscountActive = now >= startDate && now <= endDate;
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
    
    // Check if discount has expired based on displayTime
    // If displayTime is "00:00:00", the discount has expired
    if (courseDiscount.displayTime === "00:00:00" || courseDiscount.resetAfter === 0) {
      isCourseDiscountActive = false;
    } else if (courseDiscount.startTime && courseDiscount.endTime) {
      const now = new Date();
      const [startHour, startMin] = courseDiscount.startTime.split(':').map(Number);
      const [endHour, endMin] = courseDiscount.endTime.split(':').map(Number);
      
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMin;
      const startTimeInMinutes = startHour * 60 + startMin;
      const endTimeInMinutes = endHour * 60 + endMin;
      
      // Check if current time is within the time range
      if (startTimeInMinutes <= endTimeInMinutes) {
        // Normal case: start time is before end time (e.g., 12:00 to 23:00)
        isCourseDiscountActive = currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
      } else {
        // Edge case: time range spans midnight (e.g., 22:00 to 06:00)
        isCourseDiscountActive = currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes <= endTimeInMinutes;
      }
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
