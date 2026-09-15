import jwt from "jsonwebtoken";
import { AppError } from "../../middlewares/error.middleware";

export const generatePaymentGatewayToken = (orderId: string): string => {
  // Rides through the gateway's hosted page, so it must outlive PhonePe's 20 minute window.
  return jwt.sign({ orderId }, process.env.JWT_SECRET!, { expiresIn: "1h" });
};

export const verifyPaymentGatewayToken = (
  token: string,
): { orderId: string } => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { orderId: string };
  } catch (error) {
    throw new AppError("Invalid token", 400);
  }
};
