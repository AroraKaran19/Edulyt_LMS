import crypto from "crypto";

/** Excludes 0/O/1/I/L, which are misread when spoken or printed on a poster. */
export const CRM_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const CODE_LENGTH = 8;

/**
 * Largest multiple of the alphabet size that fits in a byte. Bytes at or above
 * it are discarded rather than folded with `%`, which would over-represent the
 * first `256 % 31` characters. `referral.services.ts` carries that bias; this
 * does not.
 */
const REJECT_AT =
  Math.floor(256 / CRM_CODE_ALPHABET.length) * CRM_CODE_ALPHABET.length;

export const generateCrmCode = (): string => {
  let out = "";
  while (out.length < CODE_LENGTH) {
    // Over-draw so the common case costs one syscall, not one per character.
    const bytes = crypto.randomBytes(CODE_LENGTH);
    for (const byte of bytes) {
      if (byte >= REJECT_AT) continue;
      out += CRM_CODE_ALPHABET[byte % CRM_CODE_ALPHABET.length];
      if (out.length === CODE_LENGTH) break;
    }
  }
  return out;
};
