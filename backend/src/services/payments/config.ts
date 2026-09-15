import type { Brand } from "../../constants/brands";
import { gatewayEnvName } from "./env";
import type { GatewayName } from "./types";

export const ALL_GATEWAYS: GatewayName[] = ["paytm", "razorpay", "phonepe"];

/** Used when a brand's list is unset. */
const DEFAULT_GATEWAY: Record<Brand, GatewayName> = {
  airkrit: "paytm",
  edulyt: "phonepe",
};

export const isGatewayName = (v: string): v is GatewayName =>
  (ALL_GATEWAYS as string[]).includes(v);

export const gatewayListEnv = (brand: Brand): string =>
  gatewayEnvName("PAYMENT_GATEWAYS_ENABLED", brand);

/**
 * Gateways the operator has switched on for a brand, in preference order.
 * Phase 3 replaces this env read with an admin-managed PaymentSettings doc;
 * this function is the only seam that has to change.
 */
export const getConfiguredGatewayNames = (brand: Brand): GatewayName[] => {
  const raw = process.env[gatewayListEnv(brand)]?.trim();
  if (!raw) return [DEFAULT_GATEWAY[brand]];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0)
    .filter(isGatewayName);
};
