import { AppError } from "../middlewares/error.middleware";
import { istWallClockToUtc, ymdIst } from "../utils/ist";
import type { CaAddress } from "../types/caApplication";

export const CA_OPTIONAL_FIELDS = [
  "college",
  "collegeEmail",
  "course",
  "careerStage",
  "languages",
  "payout",
  "address",
  "whatsapp",
] as const;

export type CaOptionalField = (typeof CA_OPTIONAL_FIELDS)[number];

export interface CaFieldConfig {
  enabled: boolean;
  required: boolean;
  label: string;
  help: string;
}

export type CaFieldConfigMap = Record<CaOptionalField, CaFieldConfig>;

export const DEFAULT_CA_FIELDS: CaFieldConfigMap = {
  college: { enabled: true, required: true, label: "College", help: "" },
  collegeEmail: {
    enabled: true,
    required: true,
    label: "College email",
    help: "The email your college gave you.",
  },
  course: { enabled: true, required: true, label: "Course", help: "" },
  careerStage: { enabled: true, required: true, label: "Career stage", help: "" },
  languages: {
    enabled: true,
    required: true,
    label: "Languages you speak",
    help: "",
  },
  payout: {
    enabled: true,
    required: true,
    label: "UPI ID",
    help: "Your fixed stipend and incentives are paid to this ID.",
  },
  address: {
    enabled: true,
    required: true,
    label: "Address",
    help: "Your joining kit is delivered here.",
  },
  whatsapp: { enabled: true, required: true, label: "WhatsApp group", help: "" },
};

export const DEFAULT_CA_LANGUAGES = [
  "English",
  "Hindi",
  "Bengali",
  "Marathi",
  "Telugu",
  "Tamil",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Punjabi",
  "Odia",
];

export const resolveCaFields = (stored: unknown): CaFieldConfigMap => {
  const source = (stored && typeof stored === "object" ? stored : {}) as Record<
    string,
    Partial<CaFieldConfig> | undefined
  >;
  const out = {} as CaFieldConfigMap;
  for (const key of CA_OPTIONAL_FIELDS) {
    const base = DEFAULT_CA_FIELDS[key];
    const s = source[key] ?? {};
    const enabled = typeof s.enabled === "boolean" ? s.enabled : base.enabled;
    out[key] = {
      enabled,
      required:
        enabled && (typeof s.required === "boolean" ? s.required : base.required),
      label:
        typeof s.label === "string" && s.label.trim()
          ? s.label.trim().slice(0, 80)
          : base.label,
      help: typeof s.help === "string" ? s.help.trim().slice(0, 200) : base.help,
    };
  }
  return out;
};

export const isValidDurationMonths = (n: unknown): n is number =>
  typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 6;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The last day of the tenure: the day before the same date `months` later, or the
 * target month's last day when that month is too short (31 Jan + 1 month ends 28 Feb).
 */
export const tenureEndDate = (joiningDate: Date, months: number): Date => {
  const ymd = ymdIst(joiningDate);
  if (!ymd) throw new AppError("Joining date is not set", 500);
  const [y, m, d] = ymd.split("-").map(Number);
  const monthIndex = m - 1 + months;
  const ty = y + Math.floor(monthIndex / 12);
  const tm = (monthIndex % 12) + 1;
  const lastDay = new Date(Date.UTC(ty, tm, 0)).getUTCDate();
  if (d > lastDay) return istWallClockToUtc(ty, tm, lastDay);
  return new Date(istWallClockToUtc(ty, tm, d).getTime() - DAY_MS);
};

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** `normalizePhone` keeps Indian numbers as bare 10 digits and everything else as E.164. */
export const isIndianMobile = (phone: string): boolean => /^[6-9]\d{9}$/.test(phone);

export const UPI_RE = /^[a-z0-9._-]{2,256}@[a-z][a-z0-9.-]{1,63}$/;
/** Max length for free-text payout details, shared with the self-service change. */
export const PAYOUT_DETAILS_MAX = 500;

export type CaAddressInput = CaAddress;

export interface CleanCaApplicationInput {
  name: string;
  collegeId: string | null;
  collegeName: string;
  collegeEmail: string;
  degree: string;
  careerStage: string;
  languages: string[];
  payout: { method: "upi" | "details"; value: string } | null;
  address: CaAddressInput | null;
  whatsappJoined: boolean;
}

const text = (value: unknown, max: number): string =>
  String(value ?? "").trim().slice(0, max);

const fail = (message: string): never => {
  throw new AppError(message, 400, "CA_INVALID_FIELD");
};

/**
 * Applies the admin's field configuration: a disabled field is dropped whatever
 * was sent, an enabled one is validated when present, and a required one must
 * be present.
 */
export const cleanCaApplicationInput = (
  body: Record<string, unknown>,
  fields: CaFieldConfigMap,
  languageOptions: readonly string[],
  phone: string,
): CleanCaApplicationInput => {
  const name = text(body.name, 120);
  if (name.length < 2) fail("Enter your full name");

  const want = (key: CaOptionalField, present: boolean, message: string): boolean => {
    const field = fields[key];
    if (!field.enabled) return false;
    if (!present) {
      if (field.required) fail(message);
      return false;
    }
    return true;
  };

  const collegeName = text(body.collegeName, 200);
  const collegeIdRaw = text(body.collegeId, 24);
  const hasCollege = want("college", collegeName.length > 0, "Select your college");

  const collegeEmail = text(body.collegeEmail, 200).toLowerCase();
  const hasCollegeEmail = want(
    "collegeEmail",
    collegeEmail.length > 0,
    "Enter your college email",
  );
  if (hasCollegeEmail) {
    if (!EMAIL_RE.test(collegeEmail)) fail("Enter a valid college email");
  }

  const degree = text(body.degree, 80);
  const hasDegree = want("course", degree.length > 0, "Select your course");
  const careerStage = text(body.careerStage, 80);
  const hasStage = want(
    "careerStage",
    careerStage.length > 0,
    "Select your career stage",
  );

  const allowed = new Set(languageOptions);
  const languages = Array.isArray(body.languages)
    ? [...new Set(body.languages.map((l) => text(l, 40)).filter((l) => allowed.has(l)))]
    : [];
  const hasLanguages = want(
    "languages",
    languages.length > 0,
    "Pick at least one language",
  );

  const india = isIndianMobile(phone);
  const payoutRaw = text(body.payout, PAYOUT_DETAILS_MAX);
  const hasPayout = want(
    "payout",
    payoutRaw.length > 0,
    india ? "Enter your UPI ID" : "Enter your payout details",
  );
  let payout: CleanCaApplicationInput["payout"] = null;
  if (hasPayout) {
    if (india) {
      const upi = payoutRaw.toLowerCase();
      if (!UPI_RE.test(upi)) fail("Enter a valid UPI ID, like yourname@bank");
      payout = { method: "upi", value: upi };
    } else {
      payout = { method: "details", value: payoutRaw };
    }
  }

  const rawAddress = (
    body.address && typeof body.address === "object" ? body.address : {}
  ) as Record<string, unknown>;
  const address: CaAddressInput = {
    line: text(rawAddress.line, 300),
    city: text(rawAddress.city, 80),
    state: text(rawAddress.state, 80),
    pincode: text(rawAddress.pincode, 12),
    country: text(rawAddress.country, 60) || "India",
  };
  const hasAddress = want(
    "address",
    Boolean(address.line && address.city && address.state && address.pincode),
    "Enter your full address, including city, state and pincode",
  );

  const whatsappJoined = body.whatsappJoined === true;
  want("whatsapp", whatsappJoined, "Join the WhatsApp group and tick the box");

  return {
    name,
    collegeId:
      hasCollege && /^[a-f0-9]{24}$/i.test(collegeIdRaw) ? collegeIdRaw : null,
    collegeName: hasCollege ? collegeName : "",
    collegeEmail: hasCollegeEmail ? collegeEmail : "",
    degree: hasDegree ? degree : "",
    careerStage: hasStage ? careerStage : "",
    languages: hasLanguages ? languages : [],
    payout,
    address: hasAddress ? address : null,
    whatsappJoined: fields.whatsapp.enabled ? whatsappJoined : false,
  };
};
