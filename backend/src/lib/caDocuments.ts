import { ymdIst } from "../utils/ist";
import type { AmbassadorKind } from "../types/crm";

export const CA_PROGRAMME_NAME = "Campus Ambassador Programme";

export const DEFAULT_CA_DESIGNATIONS: Record<AmbassadorKind, string> = {
  marketing: "Campus Ambassador (Marketing Intern)",
  "social-media": "Campus Ambassador (Social Media Marketing Intern)",
};

export const caDesignation = (
  designations: Record<AmbassadorKind, string>,
  kind: AmbassadorKind,
): string => designations[kind]?.trim() || DEFAULT_CA_DESIGNATIONS[kind];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const istParts = (d: Date): { day: string; month: string; year: string } => {
  const [year, month, day] = (ymdIst(d) ?? "").split("-");
  return { day, month: MONTHS[Number(month) - 1] ?? "", year };
};

/** Offer letter format, "01-Oct-2026". */
export const formatLetterDate = (d: Date): string => {
  const p = istParts(d);
  return `${p.day}-${p.month}-${p.year}`;
};

/** Internship certificate period format, "01 - Oct - 2026". */
export const formatPeriodDate = (d: Date): string => {
  const p = istParts(d);
  return `${p.day} - ${p.month} - ${p.year}`;
};

/** "sahil kharb" and "NANDAN BHAIRODGI" both print as "Sahil Kharb" / "Nandan Bhairodgi". */
export const toNameCase = (name: string): string =>
  name
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|[\s\-'.])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase());
