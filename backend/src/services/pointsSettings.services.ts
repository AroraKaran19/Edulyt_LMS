import { PointsSettingsModel } from "../models/pointsSettings.schema";
import { AppError } from "../middlewares/error.middleware";

const GLOBAL_KEY = "global";

export type PointsSettingsPayload = {
  internshipSuccessPointInr: number;
  successPointRedemptionInr: number;
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
  if (!doc) {
    return { internshipSuccessPointInr: 0, successPointRedemptionInr: 0 };
  }
  return {
    internshipSuccessPointInr:
      typeof doc.internshipSuccessPointInr === "number"
        ? doc.internshipSuccessPointInr
        : 0,
    successPointRedemptionInr:
      typeof doc.successPointRedemptionInr === "number"
        ? doc.successPointRedemptionInr
        : 0,
  };
}

export async function updatePointsSettings(
  body: Partial<Record<keyof PointsSettingsPayload, unknown>>,
): Promise<PointsSettingsPayload> {
  const internshipSuccessPointInr =
    body.internshipSuccessPointInr !== undefined
      ? parseNonNegNumber(
          body.internshipSuccessPointInr,
          "internshipSuccessPointInr",
        )
      : undefined;
  const successPointRedemptionInr =
    body.successPointRedemptionInr !== undefined
      ? parseNonNegNumber(
          body.successPointRedemptionInr,
          "successPointRedemptionInr",
        )
      : undefined;

  if (
    internshipSuccessPointInr === undefined &&
    successPointRedemptionInr === undefined
  ) {
    throw new AppError(
      "Provide at least one of internshipSuccessPointInr, successPointRedemptionInr",
      400,
    );
  }

  const current = await getPointsSettings();
  const next: PointsSettingsPayload = {
    internshipSuccessPointInr:
      internshipSuccessPointInr ?? current.internshipSuccessPointInr,
    successPointRedemptionInr:
      successPointRedemptionInr ?? current.successPointRedemptionInr,
  };

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
