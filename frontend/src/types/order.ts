import { Course, User } from "./";

export interface PaymentOrder {
  _id?: string;
  amount: number;
  currency: "INR";
  userId: User | string;
  courseId: Course | string;
  planType: "elite" | "essential";
  paymentMethod: "paytm";
  paymentMode: string;
  txnId: string;
  token: string;
  paymentStatus: "pending" | "success" | "failed";
  couponCode?: string;
  couponDiscount?: number;
  collaborationDiscount?: number;
  collaborationDomainId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
