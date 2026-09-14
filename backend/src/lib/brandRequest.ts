import { DEFAULT_BRAND, isBrand, type Brand } from "../constants/brands";

const PRODUCTION_EDULYT_ORIGINS = ["https://edulyt.com", "https://www.edulyt.com"];

const normalizeOrigin = (value: string) =>
  value.trim().toLowerCase().replace(/\/+$/, "");

/** `EDULYT_ORIGINS` adds origins per environment, such as a local Edulyt dev server. */
const edulytOrigins = (): Set<string> =>
  new Set([
    ...PRODUCTION_EDULYT_ORIGINS,
    ...(process.env.EDULYT_ORIGINS ?? "")
      .split(",")
      .map(normalizeOrigin)
      .filter(Boolean),
  ]);

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/**
 * Server-side callers have no `Origin`, so they send `X-Brand`. Neither header
 * is proof of anything: on an authenticated request the signed brand claim in
 * the access token is what decides.
 */
export const brandFromHeaders = (
  headers: Record<string, string | string[] | undefined>,
): Brand => {
  const explicit = firstValue(headers["x-brand"])?.trim().toLowerCase();
  if (isBrand(explicit)) {
    return explicit;
  }
  const origin = firstValue(headers.origin);
  if (origin && edulytOrigins().has(normalizeOrigin(origin))) {
    return "edulyt";
  }
  return DEFAULT_BRAND;
};
