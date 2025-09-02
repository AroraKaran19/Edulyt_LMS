import { Course, User } from "./";

export interface PaymentOrder {
  _id?: string;
  amount: number;
  currency: "INR";
  userId: string | User;
  courseId: string | Course;
  planType: "elite" | "essential";
  paymentMethod: "paytm";
  paymentMode: string;
  txnId: string;
  paymentStatus: "pending" | "success" | "failed";
  createdAt?: Date;
  updatedAt?: Date;
}
