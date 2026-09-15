import { LegalSettingsModel } from "../models/legalSettings.schema";
import { BRANDS, type Brand } from "../constants/brands";

export type LegalSettingsPayload = {
  courseTermsUrl: string;
  courseTermsS3Key: string;
  internshipTermsUrl: string;
  internshipTermsS3Key: string;
};

const STRING_FIELDS: (keyof LegalSettingsPayload)[] = [
  "courseTermsUrl",
  "courseTermsS3Key",
  "internshipTermsUrl",
  "internshipTermsS3Key",
];

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

const toPayload = (
  doc: Partial<Record<keyof LegalSettingsPayload, unknown>> | null | undefined,
): LegalSettingsPayload => ({
  courseTermsUrl: str(doc?.courseTermsUrl),
  courseTermsS3Key: str(doc?.courseTermsS3Key),
  internshipTermsUrl: str(doc?.internshipTermsUrl),
  internshipTermsS3Key: str(doc?.internshipTermsS3Key),
});

/** The documents one brand's site shows. A brand without a row has none yet. */
export async function getLegalSettings(brand: Brand): Promise<LegalSettingsPayload> {
  const doc = await LegalSettingsModel.findOne({ key: brand }).lean();
  return toPayload(doc);
}

export async function getAllLegalSettings(): Promise<Record<Brand, LegalSettingsPayload>> {
  const docs = await LegalSettingsModel.find({ key: { $in: BRANDS } }).lean();
  return Object.fromEntries(
    BRANDS.map((brand) => [brand, toPayload(docs.find((doc) => doc.key === brand))]),
  ) as Record<Brand, LegalSettingsPayload>;
}

/** Sets only the fields the body carries, so two admins saving different fields keep both. */
export async function updateLegalSettings(
  brand: Brand,
  body: Partial<Record<keyof LegalSettingsPayload, unknown>>,
): Promise<LegalSettingsPayload> {
  const set: Partial<LegalSettingsPayload> = {};
  for (const field of STRING_FIELDS) {
    if (body[field] !== undefined) {
      set[field] = str(body[field]);
    }
  }

  const doc = await LegalSettingsModel.findOneAndUpdate(
    { key: brand },
    {
      ...(Object.keys(set).length > 0 ? { $set: set } : {}),
      $setOnInsert: { key: brand },
    },
    { upsert: true, new: true, runValidators: true },
  ).lean();

  return toPayload(doc);
}
