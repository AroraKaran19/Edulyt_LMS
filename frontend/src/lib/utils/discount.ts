import { Discount, CourseDiscount } from "@/types";
import type { CollaborationBenefit } from "@/types/collaborationDomain";

/** Apply partnership checkout benefit on top of plan/course-discounted price (mirrors backend). */
export function applyCollaborationBenefitToPrice(
  basePrice: number,
  benefit: CollaborationBenefit
): number {
  const p = Math.max(0, basePrice);
  let next: number;
  if (benefit.type === "percentage") {
    next = p * (1 - benefit.value / 100);
  } else {
    next = p - benefit.value;
  }
  return Math.round(Math.max(0, next) * 100) / 100;
}

/**
 * Listing / carousel price for internships: base comes from the lowest active batch
 * plan price; only the document-level time-window discount (`internship.discount`)
 * is applied. Unlike courses, we do not stack a separate “plan tier” discount from
 * batch `plan.discount` on the card (batch UI does not configure it; promos are
 * internship-wide in Screen 3).
 */
export const calculateInternshipDiscountDisplay = (
  lowestBatchPlanPrice: number,
  internshipDiscount?: CourseDiscount,
) =>
  calculateDiscountDisplay(lowestBatchPlanPrice, undefined, internshipDiscount);

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
    
    if (isPlanDiscountActive) {
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
    }
    
    isActive = isPlanDiscountActive;
  }

  // Calculate course discount on original price (time-bound / countdown based)
  if (courseDiscount?.value && courseDiscount.isActive) {
    let isCourseDiscountActive = true;
    
    // Check if discount has expired based on displayTime
    // If displayTime is "00:00:00", the discount has expired
    // If displayTime is "00:00:00" OR resetAfter is 0, treat the discount as expired
    if (
      courseDiscount.displayTime === "00:00:00" ||
      courseDiscount.resetAfter === 0
    ) {
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
    
    // Only apply course discount to price if it is currently active
    if (isCourseDiscountActive) {
      if (courseDiscount.discount === "fixed") {
        totalDiscountAmount += courseDiscount.value;
        // Update label to show combined discount
        if (discountLabel) {
          discountLabel += ` + ₹${courseDiscount.value} off`;
        } else {
          discountLabel = `₹${courseDiscount.value} off`;
          discountType = "fixed";
          discountValue = courseDiscount.value;
        }
      } else {
        const courseDiscountAmount = (planPrice * courseDiscount.value) / 100;
        totalDiscountAmount += courseDiscountAmount;
        // Update label to show combined discount
        if (discountLabel) {
          discountLabel += ` + ${courseDiscount.value}% off`;
        } else {
          discountLabel = `${courseDiscount.value}% off`;
          discountType = "percentage";
          discountValue = courseDiscount.value;
        }
      }
    }

    // The overall "isActive" flag should reflect whether any discount is active
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
