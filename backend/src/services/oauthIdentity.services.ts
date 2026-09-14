import { createRemoteJWKSet, jwtVerify } from "jose";
import { AppError } from "../middlewares/error.middleware";
import { OAUTH_UNVERIFIED_MESSAGE } from "../constants/authMessages";

export type OAuthProvider = "google" | "linkedin";

export interface VerifiedOAuthIdentity {
  email: string;
  subject: string;
  name?: string;
}

interface ProviderConfig {
  jwksUrl: string;
  issuer: string | string[];
  clientIdEnv: string;
}

const PROVIDERS: Record<OAuthProvider, ProviderConfig> = {
  google: {
    jwksUrl: "https://www.googleapis.com/oauth2/v3/certs",
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    clientIdEnv: "GOOGLE_CLIENT_ID",
  },
  linkedin: {
    jwksUrl: "https://www.linkedin.com/oauth/openid/jwks",
    issuer: "https://www.linkedin.com/oauth",
    clientIdEnv: "LINKEDIN_CLIENT_ID",
  },
};

const keySets = new Map<OAuthProvider, ReturnType<typeof createRemoteJWKSet>>();

const keySetFor = (provider: OAuthProvider) => {
  let keys = keySets.get(provider);
  if (!keys) {
    keys = createRemoteJWKSet(new URL(PROVIDERS[provider].jwksUrl));
    keySets.set(provider, keys);
  }
  return keys;
};

export const verifyOAuthIdToken = async (
  provider: OAuthProvider,
  idToken: unknown,
): Promise<VerifiedOAuthIdentity> => {
  const config = PROVIDERS[provider];
  const audience = process.env[config.clientIdEnv];
  if (!audience) {
    throw new AppError(`${config.clientIdEnv} is not set`, 500);
  }
  if (typeof idToken !== "string" || idToken.length === 0) {
    throw new AppError(OAUTH_UNVERIFIED_MESSAGE, 401);
  }

  let payload: Awaited<ReturnType<typeof jwtVerify>>["payload"];
  try {
    ({ payload } = await jwtVerify(idToken, keySetFor(provider), {
      issuer: config.issuer,
      audience,
      algorithms: ["RS256"],
    }));
  } catch {
    throw new AppError(OAUTH_UNVERIFIED_MESSAGE, 401);
  }

  const emailVerified =
    payload.email_verified === true || payload.email_verified === "true";
  if (
    typeof payload.email !== "string" ||
    payload.email.length === 0 ||
    !emailVerified ||
    typeof payload.sub !== "string" ||
    payload.sub.length === 0
  ) {
    throw new AppError(OAUTH_UNVERIFIED_MESSAGE, 401);
  }

  return {
    email: payload.email.trim().toLowerCase(),
    subject: payload.sub,
    ...(typeof payload.name === "string" && payload.name.length > 0
      ? { name: payload.name }
      : {}),
  };
};
