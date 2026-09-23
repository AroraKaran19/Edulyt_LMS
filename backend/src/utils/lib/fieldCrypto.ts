import crypto from "crypto";
import { AppError } from "../../middlewares/error.middleware";

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;
const HEX_64 = /^[0-9a-f]{64}$/i;

export interface FieldCiphertext {
  enc: string;
  iv: string;
  tag: string;
}

/**
 * AES-256-GCM for one class of confidential field. Each class reads its own env
 * key, so leaking or rotating one never touches another class's data.
 */
export function createFieldCipher(envName: string) {
  let cachedKey: Buffer | null = null;

  const key = (): Buffer => {
    if (cachedKey) return cachedKey;
    const raw = process.env[envName]?.trim();
    if (!raw) {
      throw new AppError(`${envName} is not configured`, 500, "FIELD_KEY_MISSING");
    }
    if (!HEX_64.test(raw)) {
      throw new AppError(
        `${envName} must be 64 hex characters (32 bytes)`,
        500,
        "FIELD_KEY_INVALID",
      );
    }
    cachedKey = Buffer.from(raw, "hex");
    return cachedKey;
  };

  return {
    encrypt(plaintext: string): FieldCiphertext {
      const iv = crypto.randomBytes(IV_BYTES);
      const cipher = crypto.createCipheriv(ALGO, key(), iv);
      const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
      return {
        enc: enc.toString("base64"),
        iv: iv.toString("base64"),
        tag: cipher.getAuthTag().toString("base64"),
      };
    },
    decrypt(ct: FieldCiphertext): string {
      const decipher = crypto.createDecipheriv(
        ALGO,
        key(),
        Buffer.from(ct.iv, "base64"),
      );
      decipher.setAuthTag(Buffer.from(ct.tag, "base64"));
      return Buffer.concat([
        decipher.update(Buffer.from(ct.enc, "base64")),
        decipher.final(),
      ]).toString("utf8");
    },
  };
}
