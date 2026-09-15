import axios from "axios";
import crypto from "crypto";
import { AppError } from "../../../middlewares/error.middleware";
import { BRANDS, type Brand } from "../../../constants/brands";
import { gatewayEnvName, readGatewayEnv } from "../env";

type PhonePeEnv = "sandbox" | "production";

const HOSTS: Record<PhonePeEnv, { token: string; api: string }> = {
  sandbox: {
    token: "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token",
    api: "https://api-preprod.phonepe.com/apis/pg-sandbox",
  },
  production: {
    token: "https://api.phonepe.com/apis/identity-manager/v1/oauth/token",
    api: "https://api.phonepe.com/apis/pg",
  },
};

/** Refresh this long before expiry so a request never leaves with a dying token. */
const REFRESH_MARGIN_MS = 60_000;

export const phonepeEnvName = (key: string, brand: Brand): string =>
  gatewayEnvName(`PHONEPE_${key}`, brand);

const readEnv = (key: string, brand: Brand): string | undefined =>
  readGatewayEnv(`PHONEPE_${key}`, brand);

interface PhonePeCredentials {
  env: PhonePeEnv;
  clientId: string;
  clientSecret: string;
  clientVersion: string;
}

const readCredentials = (brand: Brand): PhonePeCredentials | null => {
  const env = readEnv("ENV", brand)?.toLowerCase();
  const clientId = readEnv("CLIENT_ID", brand);
  const clientSecret = readEnv("CLIENT_SECRET", brand);
  const clientVersion = readEnv("CLIENT_VERSION", brand);
  if (
    (env !== "sandbox" && env !== "production") ||
    !clientId ||
    !clientSecret ||
    !clientVersion
  ) {
    return null;
  }
  return { env, clientId, clientSecret, clientVersion };
};

export const phonepeIsConfigured = (brand: Brand): boolean =>
  readCredentials(brand) !== null;

export const phonepeCredentials = (brand: Brand): PhonePeCredentials => {
  const credentials = readCredentials(brand);
  if (!credentials) {
    const names = ["ENV", "CLIENT_ID", "CLIENT_SECRET", "CLIENT_VERSION"].map(
      (key) => phonepeEnvName(key, brand),
    );
    throw new AppError(
      `PhonePe is not configured: set ${names.join(", ")} (ENV is sandbox or production)`,
      500,
    );
  }
  return credentials;
};

// Always 502: passing PhonePe's own 401 through would look like our session expiring.
const toAppError = (err: any, fallback: string): AppError => {
  const data = err?.response?.data;
  return new AppError(data?.message || data?.code || err?.message || fallback, 502);
};

interface CachedToken {
  key: string;
  header: string;
  expiresAtMs: number;
}

const tokens = new Map<Brand, CachedToken>();
const pendingTokens = new Map<Brand, Promise<CachedToken>>();

const requestToken = async (
  credentials: PhonePeCredentials,
  key: string,
): Promise<CachedToken> => {
  const form = new URLSearchParams({
    client_id: credentials.clientId,
    client_version: credentials.clientVersion,
    client_secret: credentials.clientSecret,
    grant_type: "client_credentials",
  });

  let data: { access_token?: string; token_type?: string; expires_at?: number } | undefined;
  try {
    ({ data } = await axios.post(HOSTS[credentials.env].token, form.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 10000,
    }));
  } catch (err) {
    throw toAppError(err, "PhonePe authorization failed");
  }

  if (!data?.access_token || !data.expires_at) {
    throw new AppError("Invalid response from PhonePe - no access token", 502);
  }
  return {
    key,
    header: `${data.token_type || "O-Bearer"} ${data.access_token}`,
    expiresAtMs: Number(data.expires_at) * 1000,
  };
};

const authHeader = async (
  brand: Brand,
  credentials: PhonePeCredentials,
): Promise<string> => {
  // Changing the client or environment must not reuse the old token.
  const key = `${credentials.env}:${credentials.clientId}:${credentials.clientVersion}`;
  const cached = tokens.get(brand);
  if (cached?.key === key && cached.expiresAtMs - REFRESH_MARGIN_MS > Date.now()) {
    return cached.header;
  }

  let pending = pendingTokens.get(brand);
  if (!pending) {
    pending = requestToken(credentials, key)
      .then((token) => {
        tokens.set(brand, token);
        return token;
      })
      .finally(() => pendingTokens.delete(brand));
    pendingTokens.set(brand, pending);
  }
  return (await pending).header;
};

export const phonepeRequest = async <T>(
  brand: Brand,
  method: "get" | "post",
  path: string,
  body?: unknown,
): Promise<T> => {
  const credentials = phonepeCredentials(brand);
  const url = `${HOSTS[credentials.env].api}${path}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: await authHeader(brand, credentials),
    },
    timeout: 10000,
  };

  try {
    const res =
      method === "get"
        ? await axios.get(url, config)
        : await axios.post(url, body ?? {}, config);
    return res.data as T;
  } catch (err: any) {
    if (err?.response?.status === 401) tokens.delete(brand);
    throw toAppError(err, "PhonePe request failed");
  }
};

/** The brand whose webhook credentials produce this Authorization header, if any. */
export const phonepeWebhookBrand = (
  authorization: string | undefined,
): Brand | undefined => {
  const received = authorization?.trim().toLowerCase();
  if (!received) return undefined;

  return BRANDS.find((brand) => {
    const username = readEnv("WEBHOOK_USERNAME", brand);
    const password = readEnv("WEBHOOK_PASSWORD", brand);
    if (!username || !password) return false;
    const expected = crypto
      .createHash("sha256")
      .update(`${username}:${password}`)
      .digest("hex");
    return (
      received.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected))
    );
  });
};

export const resetPhonePeTokens = (): void => {
  tokens.clear();
  pendingTokens.clear();
};
