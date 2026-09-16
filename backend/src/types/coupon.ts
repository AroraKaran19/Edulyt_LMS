import { User, Course, Category } from "./index";
import type { Brand } from "../constants/brands";
import type { ScholarshipCouponState } from "./scholarship";

export interface Coupon {
  brand?: Brand;
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
  /** `null` or absent means unlimited. */
  usageLimit?: number | null;
  usageCount?: number;
  /** `null` or absent means unlimited. */
  userUsageLimit?: number | null;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  createdBy: string | User;
  /** Set when this coupon belongs to a scholarship campaign. */
  sourceScholarshipTestId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Which campaign a scholarship coupon belongs to, and who holds it. */
export interface CouponScholarshipView {
  /** Null once the campaign is deleted and no entitlement kept a snapshot of it. */
  campaign: {
    /** Null when only a deleted campaign's snapshot names it. */
    id: string | null;
    title: string;
    slug: string;
    deleted: boolean;
  } | null;
  /** Entitlements minted against this code: one per winner, or many for a legacy shared code. */
  holders: number;
  redeemed: number;
  /** The winner, when the code belongs to exactly one. */
  holder: {
    email: string;
    awardedPercent: number;
    issuedAt: Date;
    expiresAt: Date;
    redeemedAt: Date | null;
    state: ScholarshipCouponState;
  } | null;
}

export type CouponListItem = Coupon & { scholarship?: CouponScholarshipView };

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
  /** The site the checkout runs on. A coupon only applies on its own brand. */
  brand: Brand;
}

export interface ValidateCouponResponse {
  valid: boolean;
  message: string;
  coupon?: Coupon;
  discountAmount?: number;
  finalAmount?: number;
}

