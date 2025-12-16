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

