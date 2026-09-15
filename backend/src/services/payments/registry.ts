import { AppError } from "../../middlewares/error.middleware";
import { BRANDS, type Brand } from "../../constants/brands";
import { getConfiguredGatewayNames, isGatewayName } from "./config";
import { PaytmProvider } from "./paytm/provider";
import { PhonePeProvider } from "./phonepe/provider";
import { RazorpayProvider } from "./razorpay/provider";
import type { GatewayName, PaymentProvider } from "./types";

const PROVIDERS: Record<GatewayName, PaymentProvider> = {
  paytm: new PaytmProvider(),
  razorpay: new RazorpayProvider(),
  phonepe: new PhonePeProvider(),
};

/** Enabled AND actually configured for this brand, in preference order. */
export const getEnabledGateways = (brand: Brand): GatewayName[] =>
  getConfiguredGatewayNames(brand).filter((name) =>
    PROVIDERS[name].isConfigured(brand),
  );

/**
 * Any registered provider. Settling an order that already exists must not
 * depend on its gateway still being switched on.
 */
export const getProvider = (name?: string): PaymentProvider => {
  const key = (name ?? "").toLowerCase();
  if (!isGatewayName(key)) {
    throw new AppError(`Unsupported payment gateway: ${name}`, 400);
  }
  return PROVIDERS[key];
};

/** A webhook names no brand, so its gateway only has to be live on one of them. */
export const getWebhookProvider = (name?: string): PaymentProvider => {
  const provider = getProvider(name);
  if (!BRANDS.some((brand) => getEnabledGateways(brand).includes(provider.name))) {
    throw new AppError(`Payment gateway is not enabled: ${provider.name}`, 400);
  }
  return provider;
};

/** Pick the gateway for a new order on this brand: the requested one, or the first enabled. */
export const resolveGateway = (brand: Brand, requested?: string): GatewayName => {
  const enabled = getEnabledGateways(brand);
  if (enabled.length === 0) {
    throw new AppError("No payment gateway is configured", 500);
  }
  if (!requested) return enabled[0];
  const { name } = getProvider(requested);
  if (!enabled.includes(name)) {
    throw new AppError(`Payment gateway is not enabled: ${name}`, 400);
  }
  return name;
};
