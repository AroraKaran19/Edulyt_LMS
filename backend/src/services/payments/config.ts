import type { GatewayName } from "./types";

export const ALL_GATEWAYS: GatewayName[] = ["paytm", "razorpay"];

const isGatewayName = (v: string): v is GatewayName =>
  (ALL_GATEWAYS as string[]).includes(v);

/**
 * Gateways the operator has switched on, in preference order.
 * Phase 3 replaces this env read with an admin-managed PaymentSettings doc;
 * this function is the only seam that has to change.
 */
export const getConfiguredGatewayNames = (): GatewayName[] => {
  const raw = process.env.PAYMENT_GATEWAYS_ENABLED?.trim();
  if (!raw) return ["paytm"];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0)
    .filter(isGatewayName);
};
