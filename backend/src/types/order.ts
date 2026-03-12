import { Course, User } from "./";

export interface PaymentOrder {
  _id?: string;
  amount: number;
  currency: "INR";
  userId: User["_id"];
  courseId: Course["_id"];
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
