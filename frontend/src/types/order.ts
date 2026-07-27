import { Course, User } from "./";

export interface PaymentOrder {
  _id?: string;
  amount: number;
  currency: "INR";
  userId: User | string;
  courseId: Course | string;
  planType: "elite" | "essential";
  paymentMethod: "paytm" | "razorpay";
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

export type GatewayName = "paytm" | "razorpay";

export interface ActiveGateway {
  name: GatewayName;
  label: string;
}

/** What a create-order endpoint returns and `launchCheckout` consumes. */
export interface CheckoutOrder {
  _id: string;
  freeOrder?: boolean;
  /** Paytm txn token, and the JWT for the free-order branch. Absent for Razorpay. */
  token?: string;
  gateway?: GatewayName;
  /** Razorpay's own order id ("order_XXX"). Never our _id. */
  gatewayOrderId?: string;
  /** Razorpay publishable key. */
  keyId?: string;
  amount?: number;
  currency?: string;
}
