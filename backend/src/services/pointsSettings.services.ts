import { PointsSettingsModel } from "../models/pointsSettings.schema";
import { AppError } from "../middlewares/error.middleware";

const GLOBAL_KEY = "global";

export type PointsSettingsPayload = {
  successPointInr: number;
  internshipSuccessPointInr: number;
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
    return { successPointInr: 0, internshipSuccessPointInr: 0 };
  }
  return {
    successPointInr:
      typeof doc.successPointInr === "number" ? doc.successPointInr : 0,
    internshipSuccessPointInr:
      typeof doc.internshipSuccessPointInr === "number"
        ? doc.internshipSuccessPointInr
        : 0,
  };
}

export async function updatePointsSettings(
  body: Partial<Record<keyof PointsSettingsPayload, unknown>>,
): Promise<PointsSettingsPayload> {
  const successPointInr =
    body.successPointInr !== undefined
      ? parseNonNegNumber(body.successPointInr, "successPointInr")
      : undefined;
  const internshipSuccessPointInr =
    body.internshipSuccessPointInr !== undefined
      ? parseNonNegNumber(
          body.internshipSuccessPointInr,
          "internshipSuccessPointInr",
        )
      : undefined;

  if (successPointInr === undefined && internshipSuccessPointInr === undefined) {
    throw new AppError(
      "Provide at least one of successPointInr, internshipSuccessPointInr",
      400,
    );
  }

  const current = await getPointsSettings();
  const next: PointsSettingsPayload = {
    successPointInr: successPointInr ?? current.successPointInr,
    internshipSuccessPointInr:
      internshipSuccessPointInr ?? current.internshipSuccessPointInr,
  };

  await PointsSettingsModel.findOneAndUpdate(
    { key: GLOBAL_KEY },
    {
      $set: {
        successPointInr: next.successPointInr,
        internshipSuccessPointInr: next.internshipSuccessPointInr,
      },
      $setOnInsert: { key: GLOBAL_KEY },
    },
    { upsert: true, new: true, runValidators: true },
  );

  return next;
}
