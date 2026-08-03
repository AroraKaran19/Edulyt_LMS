import { Course, User } from "./";

/** Distinguishes course checkout from internship batch (seat) orders. */
export type PaymentOrderKind =
  | "course"
  | "internship_seat"
  | "internship_success_points";

/**
 * One document per payment attempt. Course purchases use `orderKind: "course"`;
 * “book seat / without entrance” uses `orderKind: "internship_seat"`.
 * Purchased internship certification success points use `internship_success_points`.
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
  /** Course-internship add-on: program chosen at checkout. */
  courseInternshipProgramId?: string;
  /** Course-internship add-on: duration the learner picked, in months. */
  courseInternshipMonths?: number;
  /** Course-internship add-on: amount charged for it, as charged. */
  courseInternshipPrice?: number;
  /** Success-points purchase — whole points purchased (when `orderKind === "internship_success_points"`). */
  internshipSuccessPointsQuantity?: number;
  /** Set after points are credited so webhooks cannot double-apply. */
  internshipSuccessPointsFulfillmentApplied?: boolean;
  /** The gateway that owns this order. Doubles as the provider discriminator. */
  paymentMethod: "paytm" | "razorpay";
  paymentMode: string;
  txnId: string;
  token: string;
  /** The gateway's own order id. paytm: our _id | razorpay: "order_XXX". */
  gatewayOrderId?: string;
  paymentStatus: "pending" | "success" | "failed";
  paymentErrorReason?: string;
  couponCode?: string;
  couponDiscount?: number;
  /** Partnership checkout discount (after plan/course discounts), when applicable */
  collaborationDiscount?: number;
  collaborationDomainId?: string;
  /** CSV / manual partnership import discount (not email-domain collaboration). */
  partnershipImportConfigId?: string;
  /** Referral code used at checkout — drives both the referrer payout and the buyer discount. */
  referralCode?: string;
  /** ₹ discount applied to the buyer from the configured referral buyer-discount %. */
  referralDiscount?: number;
  /** Idempotency flag: per-plan `purchaseSuccessPoints` already credited. */
  successPointsPurchaseGranted?: boolean;
  /** Number of success points the buyer chose to redeem at checkout. */
  successPointsApplied?: number;
  /** ₹ discount produced by `successPointsApplied × redemption rate`. */
  successPointsDiscount?: number;
  /** Idempotency flag: redeemed points already deducted from buyer's wallet. */
  successPointsRedeemed?: boolean;
  /**
   * Tax-invoice sequence, e.g. "2627-00001", allocated once when the invoice
   * job first runs. Retries reuse it so a re-run never burns a second number.
   */
  invoiceNumber?: string;
  /** Public S3 URL of the generated invoice PDF. */
  invoiceUrl?: string;
  /** When the invoice PDF was rendered and uploaded. */
  invoicedAt?: Date;
  /**
   * When the buyer was emailed their confirmation and invoice. Claimed
   * atomically before the send so retries and re-settlement cannot resend it.
   */
  confirmationEmailSentAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
