import { PointsSettingsModel } from "../models/pointsSettings.schema";
import { AppError } from "../middlewares/error.middleware";

const GLOBAL_KEY = "global";

export type PointsSettingsPayload = {
  internshipSuccessPointInr: number;
  successPointRedemptionInr: number;
  successPointsMaxUtilizationPercent: number;
  loginSuccessPoints: number;
  communityReviewSuccessPoints: number;
  internshipRegistrationSuccessPoints: number;
};

const NUMERIC_FIELDS: (keyof PointsSettingsPayload)[] = [
  "internshipSuccessPointInr",
  "successPointRedemptionInr",
  "successPointsMaxUtilizationPercent",
  "loginSuccessPoints",
  "communityReviewSuccessPoints",
  "internshipRegistrationSuccessPoints",
];

/** Fields capped at an upper bound after the generic non-negative parse. */
const MAX_BY_FIELD: Partial<Record<keyof PointsSettingsPayload, number>> = {
  successPointsMaxUtilizationPercent: 100,
};

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
    successPointsMaxUtilizationPercent: Math.min(
      100,
      Math.max(0, num(doc?.successPointsMaxUtilizationPercent)),
    ),
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
      let val = parseNonNegNumber(body[field], field);
      const max = MAX_BY_FIELD[field];
      if (max !== undefined && val > max) val = max;
      next[field] = val;
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
