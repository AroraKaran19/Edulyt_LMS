import { AppError } from "../../middlewares/error.middleware";
import { getConfiguredGatewayNames } from "./config";
import { PaytmProvider } from "./paytm/provider";
import { RazorpayProvider } from "./razorpay/provider";
import type { GatewayName, PaymentProvider } from "./types";

const PROVIDERS: Partial<Record<GatewayName, PaymentProvider>> = {
  paytm: new PaytmProvider(),
  razorpay: new RazorpayProvider(),
};

/** Enabled AND actually configured (credentials present), in preference order. */
export const getEnabledGateways = (): GatewayName[] =>
  getConfiguredGatewayNames().filter((name) => {
    const provider = PROVIDERS[name];
    return Boolean(provider?.isConfigured());
  });

export const getProvider = (name?: string): PaymentProvider => {
  const key = (name ?? "").toLowerCase();
  const provider = PROVIDERS[key as GatewayName];
  if (!provider) {
    throw new AppError(`Unsupported payment gateway: ${name}`, 400);
  }
  if (!getEnabledGateways().includes(provider.name)) {
    throw new AppError(`Payment gateway is not enabled: ${provider.name}`, 400);
  }
  return provider;
};

/** Pick the gateway for a new order: the requested one, or the first enabled. */
export const resolveGateway = (requested?: string): GatewayName => {
  const enabled = getEnabledGateways();
  if (enabled.length === 0) {
    throw new AppError("No payment gateway is configured", 500);
  }
  if (!requested) return enabled[0];
  return getProvider(requested).name;
};
