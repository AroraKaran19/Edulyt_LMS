import { User, Course, Category } from "./index";

export interface Coupon {
  _id?: string;
  code: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  applicableType: "all" | "specific-courses" | "specific-categories";
  applicableCourses?: string[] | Course[];
  applicableCategories?: string[] | Category[];
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount?: number;
  userUsageLimit?: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  createdBy: string | User;
  /** Set when this coupon belongs to a scholarship campaign. */
  sourceScholarshipTestId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CouponUsage {
  _id?: string;
  couponId: string | Coupon;
  userId: string | User;
  courseId: string | Course;
  orderId?: string;
  discountApplied: number;
  usedAt: Date;
}

export interface ValidateCouponRequest {
  code: string;
  courseId: string;
  userId?: string;
  purchaseAmount: number;
}

export interface ValidateCouponResponse {
  valid: boolean;
  message: string;
  coupon?: Coupon;
  discountAmount?: number;
  finalAmount?: number;
}

