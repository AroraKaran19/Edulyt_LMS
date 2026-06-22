import { LegalSettingsModel } from "../models/legalSettings.schema";

const GLOBAL_KEY = "global";

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

export async function getLegalSettings(): Promise<LegalSettingsPayload> {
  const doc = await LegalSettingsModel.findOne({ key: GLOBAL_KEY }).lean();
  return {
    courseTermsUrl: str(doc?.courseTermsUrl),
    courseTermsS3Key: str(doc?.courseTermsS3Key),
    internshipTermsUrl: str(doc?.internshipTermsUrl),
    internshipTermsS3Key: str(doc?.internshipTermsS3Key),
  };
}

export async function updateLegalSettings(
  body: Partial<Record<keyof LegalSettingsPayload, unknown>>,
): Promise<LegalSettingsPayload> {
  const current = await getLegalSettings();
  const next: LegalSettingsPayload = { ...current };

  for (const field of STRING_FIELDS) {
    if (body[field] !== undefined) {
      next[field] = str(body[field]);
    }
  }

  await LegalSettingsModel.findOneAndUpdate(
    { key: GLOBAL_KEY },
    { $set: next, $setOnInsert: { key: GLOBAL_KEY } },
    { upsert: true, new: true, runValidators: true },
  );

  return next;
}
