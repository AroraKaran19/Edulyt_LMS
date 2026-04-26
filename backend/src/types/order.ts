import { Course, User } from "./";

/** Distinguishes course checkout from internship batch (seat) Paytm orders. */
export type PaymentOrderKind = "course" | "internship_seat";

/**
 * One document per payment attempt (Paytm). Course purchases use `orderKind: "course"`;
 * “book seat / without entrance” uses `orderKind: "internship_seat"`.
 */
export interface PaymentOrder {
  _id?: string;
  amount: number;
  currency: "INR";
  userId: User["_id"];
  orderKind: PaymentOrderKind;
  /**
   * Course purchase — set when `orderKind === "course"`.
   * Omitted for internship seat orders.
   */
  courseId?: Course["_id"];
  /**
   * Elite / essential — course orders; omitted for internship seat orders.
   */
  planType?: "elite" | "essential";
  /** Snapshot at order creation - preserved if course/user deleted */
  courseName?: string;
  userName?: string;
  /**
   * Internship direct-seat purchase — set when `orderKind === "internship_seat"`.
   * `batchId` is the internship subdocument batch `_id` string.
   */
  internshipId?: string;
  batchId?: string;
  /** Pending paid enrollment row to complete after successful payment. */
  internshipEnrollmentId?: string;
  /** Display on receipts / admin (internship title at checkout). */
  internshipTitle?: string;
  paymentMethod: "paytm";
  paymentMode: string;
  txnId: string;
  token: string;
  paymentStatus: "pending" | "success" | "failed";
  paymentErrorReason?: string;
  couponCode?: string;
  couponDiscount?: number;
  /** Partnership checkout discount (after plan/course discounts), when applicable */
  collaborationDiscount?: number;
  collaborationDomainId?: string;
  /** CSV / manual partnership import discount (not email-domain collaboration). */
  partnershipImportConfigId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
