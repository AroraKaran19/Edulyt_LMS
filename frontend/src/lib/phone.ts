/** Duplicated in Edulyt_Main/src/lib/phone.ts. Behaviour must match: the two sites share a backend. */
import {
  COUNTRY_CODES,
  DEFAULT_COUNTRY_ISO,
  dialFor,
} from "@/constants/countryCodes";

const digitsOf = (value: string) => value.replace(/\D/g, "");

/** E.164 caps the whole number, country code included, at 15 digits. */
const E164_MAX_DIGITS = 15;

/** Shortest national numbers in service are 4 digits. */
const MIN_NATIONAL_DIGITS = 4;

/** What E.164's 15-digit ceiling leaves for the number itself. */
export const maxNationalDigits = (countryIso: string) =>
  E164_MAX_DIGITS - digitsOf(dialFor(countryIso)).length;

/**
 * Digits and the separators numbers are written with, capped at what the
 * country's dial code leaves. Letters never get in, and neither does a 26th
 * digit — rejecting that on submit is too late to be useful.
 */
export const sanitizePhoneInput = (countryIso: string, value: string) => {
  const allowed = value.replace(/[^\d\s()-]/g, "");
  const max = maxNationalDigits(countryIso);

  let digits = 0;
  let out = "";
  for (const char of allowed) {
    if (char >= "0" && char <= "9") {
      if (digits >= max) break;
      digits += 1;
    }
    out += char;
  }
  return out;
};

/**
 * Loose by design: per-country lengths need a metadata table this site has no
 * dependency for, and a fake-strict regex would reject valid foreign numbers.
 * The OTP step is what actually proves a number.
 */
export const isValidPhone = (countryIso: string, national: string): boolean => {
  const dial = digitsOf(dialFor(countryIso));
  const subscriber = digitsOf(national);

  if (subscriber.length < MIN_NATIONAL_DIGITS) return false;
  return dial.length + subscriber.length <= E164_MAX_DIGITS;
};

/** The storage format: "+" then country code then national digits, nothing else. */
export const toE164 = (countryIso: string, national: string): string =>
  `+${digitsOf(dialFor(countryIso))}${digitsOf(national)}`;

/** MSG91's widget wants the same digits with no leading "+". */
export const toMsg91Identifier = (
  countryIso: string,
  national: string,
): string => toE164(countryIso, national).slice(1);

/**
 * Splits a stored number back into a country and the rest.
 *
 * Longest dial code wins, since +1 is a prefix of +1268. A value with no "+"
 * is one of the bare 10-digit Indian numbers already in the database.
 */
export const fromE164 = (
  stored: string,
): { countryIso: string; national: string } => {
  const text = (stored ?? "").trim();
  if (!text.startsWith("+")) {
    return { countryIso: DEFAULT_COUNTRY_ISO, national: digitsOf(text) };
  }

  const digits = digitsOf(text);
  let best: { countryIso: string; national: string } | null = null;

  for (const country of COUNTRY_CODES) {
    const dial = digitsOf(country.dial);
    if (!digits.startsWith(dial)) continue;
    if (best && dial.length <= digitsOf(dialFor(best.countryIso)).length) continue;
    best = { countryIso: country.iso, national: digits.slice(dial.length) };
  }

  return best ?? { countryIso: DEFAULT_COUNTRY_ISO, national: digits };
};

/**
 * A stored number as it should read on screen. E.164 values already carry
 * their country code; the bare 10-digit rows are Indian.
 */
export const formatStoredPhone = (stored: string): string => {
  const text = (stored ?? "").trim();
  if (!text) return "";
  return text.startsWith("+") ? text : `+91 ${text}`;
};
