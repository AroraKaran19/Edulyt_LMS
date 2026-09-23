import {
  createFieldCipher,
  type FieldCiphertext,
} from "../utils/lib/fieldCrypto";

const cipher = createFieldCipher("CA_PII_ENCRYPTION_KEY");

export const encryptCaText = (value: string): FieldCiphertext =>
  cipher.encrypt(value);

export const decryptCaText = (ct: FieldCiphertext): string => cipher.decrypt(ct);
