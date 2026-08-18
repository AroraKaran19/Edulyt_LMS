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
  validFrom: Date | string;
  validUntil: Date | string;
  isActive: boolean;
  createdBy: string | User;
  /**
   * Set when a scholarship campaign owns this coupon. Every qualifier redeems
   * the same code, so editing or deleting it here would break the reward for all
   * of them: the API refuses, and the row is locked to match.
   */
  sourceScholarshipTestId?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CreateCouponData {
  code: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  applicableType: "all" | "specific-courses" | "specific-categories";
  applicableCourses?: string[];
  applicableCategories?: string[];
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  userUsageLimit?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export interface UpdateCouponData extends Partial<CreateCouponData> {}

export interface ValidateCouponRequest {
  code: string;
  courseId: string;
  purchaseAmount: number;
}

export interface ValidateCouponResponse {
  valid: boolean;
  message: string;
  coupon?: Coupon;
  discountAmount?: number;
  finalAmount?: number;
}

