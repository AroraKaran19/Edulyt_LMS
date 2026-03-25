import { Course, User } from "./";

export interface PaymentOrder {
  _id?: string;
  amount: number;
  currency: "INR";
  userId: User["_id"];
  courseId: Course["_id"];
  /** Snapshot at order creation - preserved if course/user deleted */
  courseName?: string;
  userName?: string;
  planType: "elite" | "essential";
  paymentMethod: "paytm";
  paymentMode: string;
  txnId: string;
  token: string;
  paymentStatus: "pending" | "success" | "failed";
  paymentErrorReason?: string;
  couponCode?: string;
  couponDiscount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
