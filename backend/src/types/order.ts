import { Course, User } from "./";

export interface PaymentOrder {
  _id?: string;
	orderId: string;
  amount: number;
  currency: "INR";
  userId: string | User;
  courseId: string | Course;
  planType: "elite" | "essential";
  paymentMethod: "paytm";
  paymentMode: string;
  paymentStatus: "pending" | "success" | "failed";
  createdAt?: Date;
  updatedAt?: Date;
}
