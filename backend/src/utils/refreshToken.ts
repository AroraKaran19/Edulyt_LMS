import crypto from "crypto";
import { REFRESH_ABSOLUTE_MS, REFRESH_IDLE_MS } from "../constants/tokens";
import type { DeviceInfo, RefreshTokenEntry } from "../types";

export const generateRefreshTokenString = (): string =>
  crypto.randomBytes(32).toString("hex");

export const hashRefreshToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

/**
 * Brand-new refresh token starting a fresh family. Used on login/register/oauth.
 * Returns the plaintext (hand to the client once) and the entry (store in DB).
 */
export const createRefreshToken = (
  deviceInfo?: DeviceInfo,
): { plaintext: string; entry: RefreshTokenEntry } => {
  const plaintext = generateRefreshTokenString();
  const now = new Date();
  return {
    plaintext,
    entry: {
      tokenHash: hashRefreshToken(plaintext),
      family: crypto.randomUUID(),
      deviceInfo,
      createdAt: now,
      lastUsed: now,
      rotatedAt: null,
      isActive: true,
      idleExpiresAt: new Date(now.getTime() + REFRESH_IDLE_MS),
      absoluteExpiresAt: new Date(now.getTime() + REFRESH_ABSOLUTE_MS),
    },
  };
};

/**
 * Rotated refresh token continuing an existing family. Slides the idle window
 * forward but never past the family's absolute cap.
 */
export const rotateRefreshToken = (
  family: string,
  absoluteExpiresAt: Date,
  deviceInfo?: DeviceInfo,
): { plaintext: string; entry: RefreshTokenEntry } => {
  const plaintext = generateRefreshTokenString();
  const now = new Date();
  const absolute = new Date(absoluteExpiresAt);
  const idle = new Date(now.getTime() + REFRESH_IDLE_MS);
  return {
    plaintext,
    entry: {
      tokenHash: hashRefreshToken(plaintext),
      family,
      deviceInfo,
      createdAt: now,
      lastUsed: now,
      rotatedAt: null,
      isActive: true,
      idleExpiresAt: idle < absolute ? idle : absolute,
      absoluteExpiresAt: absolute,
    },
  };
};
