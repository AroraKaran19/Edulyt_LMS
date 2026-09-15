import axios from "axios";
import { AppError } from "../../../middlewares/error.middleware";
import type { Brand } from "../../../constants/brands";
import { gatewayEnvName, readGatewayEnv } from "../env";

export const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

/** Read once per call so tests and hot-reloads see env changes. */
export const razorpayCredentials = (brand: Brand): { keyId: string; keySecret: string } => {
  const keyId = readGatewayEnv("RAZORPAY_KEY_ID", brand);
  const keySecret = readGatewayEnv("RAZORPAY_KEY_SECRET", brand);
  if (!keyId || !keySecret) {
    throw new AppError(
      `${gatewayEnvName("RAZORPAY_KEY_ID", brand)} or ${gatewayEnvName("RAZORPAY_KEY_SECRET", brand)} is not set`,
      500,
    );
  }
  return { keyId, keySecret };
};

export const razorpayRequest = async <T>(
  brand: Brand,
  method: "get" | "post",
  path: string,
  body?: unknown,
): Promise<T> => {
  const { keyId, keySecret } = razorpayCredentials(brand);
  const url = `${RAZORPAY_API_BASE}${path}`;
  const config = {
    auth: { username: keyId, password: keySecret },
    headers: { "Content-Type": "application/json" },
    timeout: 10000,
  };

  try {
    const res =
      method === "get"
        ? await axios.get(url, config)
        : await axios.post(url, body ?? {}, config);
    return res.data as T;
  } catch (err: any) {
    // Razorpay puts the human-readable cause in error.description.
    const description = err?.response?.data?.error?.description;
    throw new AppError(
      description || err?.message || "Razorpay request failed",
      err?.response?.status || 500,
    );
  }
};
