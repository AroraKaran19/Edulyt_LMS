import { Course, User } from "./";

export interface PaymentOrder {
  _id?: string;
	orderId: string;
  amount: number;
  currency: "INR";
  userId: string | User;
  courseId: string | Course;
  planType: "elite" | "essential";
  paymentMethod: "phonepe";
  paymentStatus: "pending" | "success" | "failed" | "processing";
  createdAt?: Date;
  updatedAt?: Date;
}
