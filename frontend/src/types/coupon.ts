import { User, Course, Category } from "./index";
import type { Brand } from "@/constants/brands";

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
  /** `null` means unlimited. */
  usageLimit?: number | null;
  usageCount?: number;
  /** `null` means unlimited. */
  userUsageLimit?: number | null;
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
  /** Present on a campaign-owned coupon: the campaign it rewards and its winner. */
  scholarship?: CouponScholarshipView;
  brand?: Brand;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/** Worst-to-best precedence, the order the backend's `couponStateOf` encodes. */
export type CouponScholarshipState =
  | "revoked"
  | "redeemed"
  | "expired"
  | "issued";

/** Which campaign a scholarship coupon belongs to and who holds it. Read-only, from the list API. */
export interface CouponScholarshipView {
  campaign: {
    /** Null when only a deleted campaign's frozen snapshot names it. */
    id: string | null;
    title: string;
    slug: string;
    deleted: boolean;
  } | null;
  /** One per winner, or several when a legacy campaign shared one code. */
  holders: number;
  redeemed: number;
  /** The winner, when the code belongs to exactly one. */
  holder: {
    email: string;
    awardedPercent: number;
    issuedAt: string;
    expiresAt: string;
    redeemedAt: string | null;
    state: CouponScholarshipState;
  } | null;
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
  /** Sent as `null` to clear a limit; an omitted key leaves it unchanged on update. */
  usageLimit?: number | null;
  userUsageLimit?: number | null;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  brand?: Brand;
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

