import jwt from "jsonwebtoken";
import { AppError } from "../../middlewares/error.middleware";

export const generatePaymentGatewayToken = (orderId: string): string => {
  return jwt.sign({ orderId }, process.env.JWT_SECRET!, { expiresIn: "5m" });
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
