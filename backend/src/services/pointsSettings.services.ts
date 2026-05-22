import { PointsSettingsModel } from "../models/pointsSettings.schema";
import { AppError } from "../middlewares/error.middleware";

const GLOBAL_KEY = "global";

export type PointsSettingsPayload = {
  internshipSuccessPointInr: number;
  successPointRedemptionInr: number;
  loginSuccessPoints: number;
  communityReviewSuccessPoints: number;
  internshipRegistrationSuccessPoints: number;
};

const NUMERIC_FIELDS: (keyof PointsSettingsPayload)[] = [
  "internshipSuccessPointInr",
  "successPointRedemptionInr",
  "loginSuccessPoints",
  "communityReviewSuccessPoints",
  "internshipRegistrationSuccessPoints",
];

function parseNonNegNumber(value: unknown, field: string): number {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? parseFloat(value.trim())
        : NaN;
  if (Number.isNaN(n) || !Number.isFinite(n) || n < 0) {
    throw new AppError(`${field} must be a non-negative number`, 400);
  }
  return Math.round(n * 100) / 100;
}

export async function getPointsSettings(): Promise<PointsSettingsPayload> {
  const doc = await PointsSettingsModel.findOne({ key: GLOBAL_KEY }).lean();
  const num = (v: unknown): number => (typeof v === "number" ? v : 0);
  return {
    internshipSuccessPointInr: num(doc?.internshipSuccessPointInr),
    successPointRedemptionInr: num(doc?.successPointRedemptionInr),
    loginSuccessPoints: num(doc?.loginSuccessPoints),
    communityReviewSuccessPoints: num(doc?.communityReviewSuccessPoints),
    internshipRegistrationSuccessPoints: num(
      doc?.internshipRegistrationSuccessPoints,
    ),
  };
}

export async function updatePointsSettings(
  body: Partial<Record<keyof PointsSettingsPayload, unknown>>,
): Promise<PointsSettingsPayload> {
  const current = await getPointsSettings();
  const next: PointsSettingsPayload = { ...current };

  let anyProvided = false;
  for (const field of NUMERIC_FIELDS) {
    if (body[field] !== undefined) {
      next[field] = parseNonNegNumber(body[field], field);
      anyProvided = true;
    }
  }

  if (!anyProvided) {
    throw new AppError(
      `Provide at least one of: ${NUMERIC_FIELDS.join(", ")}`,
      400,
    );
  }

  await PointsSettingsModel.findOneAndUpdate(
    { key: GLOBAL_KEY },
    {
      $set: next,
      $setOnInsert: { key: GLOBAL_KEY },
    },
    { upsert: true, new: true, runValidators: true },
  );

  return next;
}
