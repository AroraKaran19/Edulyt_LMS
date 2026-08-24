/**
 * Canonical states and union territories, used as the `state` enum on College.
 *
 * Deliberately NOT shared with the frontend's `STATE_OPTIONS` (student profile
 * addresses): that list spells Delhi "Delhi (National Capital Territory)" and
 * ends in an "Other" escape hatch. Every Delhi college row says plain "Delhi",
 * so reusing it would mean migrating the directory to match a picker.
 */
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

export type IndianState = (typeof INDIAN_STATES)[number];

const BY_LOWER = new Map<string, IndianState>(
  INDIAN_STATES.map((s) => [s.toLowerCase(), s]),
);

/** Non-canonical spellings that appear in the existing college directory. */
const STATE_ALIASES: Record<string, IndianState> = {
  "new delhi": "Delhi",
  "nct of delhi": "Delhi",
  "delhi (national capital territory)": "Delhi",
  "jammu & kashmir": "Jammu and Kashmir",
  "andaman & nicobar islands": "Andaman and Nicobar Islands",
  pondicherry: "Puducherry",
  orissa: "Odisha",
  uttaranchal: "Uttarakhand",
};

export const normalizeState = (raw: unknown): IndianState | null => {
  if (typeof raw !== "string") return null;
  const key = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!key) return null;
  return BY_LOWER.get(key) ?? STATE_ALIASES[key] ?? null;
};

/**
 * Pulls a state out of a free-text `location`.
 *
 * The importer writes "{State}, India", but hand-added rows also come as
 * "{City}, {State}", a bare state, and a bare city. Dropping a trailing "India"
 * and taking the last comma segment resolves every shape except a bare city,
 * which no rule can recover; the backfill script maps those by hand.
 */
export const deriveStateFromLocation = (
  location: unknown,
): IndianState | null => {
  if (typeof location !== "string") return null;
  const parts = location
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts[parts.length - 1]?.toLowerCase() === "india") parts.pop();
  if (parts.length === 0) return null;
  return normalizeState(parts[parts.length - 1]);
};
