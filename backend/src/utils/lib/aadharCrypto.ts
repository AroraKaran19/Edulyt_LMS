import crypto from "crypto";
import { AppError } from "../../middlewares/error.middleware";

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const raw = process.env.AADHAR_ENCRYPTION_KEY;
  if (!raw || !raw.trim()) {
    throw new AppError(
      "AADHAR_ENCRYPTION_KEY is not configured",
      500,
      "AADHAR_KEY_MISSING",
    );
  }
  let key: Buffer;
  try {
    key = Buffer.from(raw.trim(), "hex");
  } catch {
    throw new AppError(
      "AADHAR_ENCRYPTION_KEY must be 32-byte hex",
      500,
      "AADHAR_KEY_INVALID",
    );
  }
  if (key.length !== 32) {
    throw new AppError(
      "AADHAR_ENCRYPTION_KEY must be 32 bytes (64 hex chars)",
      500,
      "AADHAR_KEY_INVALID",
    );
  }
  cachedKey = key;
  return key;
}

export interface AadharCiphertext {
  aadharCardNumberEnc: string;
  aadharCardNumberIv: string;
  aadharCardNumberTag: string;
}

export function encryptAadhar(plaintext: string): AadharCiphertext {
  const key = getKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encBuf = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    aadharCardNumberEnc: encBuf.toString("base64"),
    aadharCardNumberIv: iv.toString("base64"),
    aadharCardNumberTag: tag.toString("base64"),
  };
}

export function decryptAadhar(ct: AadharCiphertext): string {
  const key = getKey();
  const iv = Buffer.from(ct.aadharCardNumberIv, "base64");
  const tag = Buffer.from(ct.aadharCardNumberTag, "base64");
  const enc = Buffer.from(ct.aadharCardNumberEnc, "base64");
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const out = Buffer.concat([decipher.update(enc), decipher.final()]);
  return out.toString("utf8");
}

/** UIDAI: 12 digits, first digit must be 2-9 (0/1 reserved). */
const AADHAR_RE = /^[2-9]\d{11}$/;

export function isValidAadharFormat(value: string): boolean {
  return AADHAR_RE.test(value);
}
