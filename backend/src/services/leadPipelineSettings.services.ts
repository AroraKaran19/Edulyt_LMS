import mongoose from "mongoose";
import { LeadPipelineSettingsModel } from "../models/leadPipelineSettings.schema";
import { LeadModel } from "../models/lead.schema";
import { AppError } from "../middlewares/error.middleware";
import { SEED_LEAD_PIPELINE } from "../constants/leadPipeline";

export interface PipelineSubStatus {
  key: string;
  label: string;
  order: number;
  active: boolean;
  isConversion: boolean;
}

export interface PipelineStage {
  key: string;
  label: string;
  order: number;
  active: boolean;
  isDefault: boolean;
  subStatuses: PipelineSubStatus[];
}

export interface LeadPipeline {
  stages: PipelineStage[];
}

/**
 * Every lead write validates against the pipeline, and the pipeline changes
 * about never, so it is held in process and dropped on update. Each API process
 * refreshes on its own next read; a stale reader can only be one edit behind,
 * and the worst it does is reject a brand new sub-status for a few seconds.
 */
let cached: LeadPipeline | null = null;

export const clearLeadPipelineCache = (): void => {
  cached = null;
};

const sortPipeline = (stages: PipelineStage[]): PipelineStage[] =>
  [...stages]
    .sort((a, b) => a.order - b.order)
    .map((stage) => ({
      ...stage,
      subStatuses: [...stage.subStatuses].sort((a, b) => a.order - b.order),
    }));

/**
 * Reads the pipeline, writing the shipped default the first time so a fresh
 * environment is never left with an empty funnel that rejects every lead.
 */
export const getLeadPipeline = async (): Promise<LeadPipeline> => {
  if (cached) return cached;

  const existing = await LeadPipelineSettingsModel.findOne({ key: "global" })
    .lean<{ stages: PipelineStage[] } | null>();

  if (existing && existing.stages.length > 0) {
    cached = { stages: sortPipeline(existing.stages) };
    return cached;
  }

  // `upsert` rather than `create`: two processes booting together must not
  // race into a duplicate key.
  const seeded = await LeadPipelineSettingsModel.findOneAndUpdate(
    { key: "global" },
    { $setOnInsert: { stages: SEED_LEAD_PIPELINE } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean<{ stages: PipelineStage[] }>();

  const stages = seeded.stages.length > 0 ? seeded.stages : SEED_LEAD_PIPELINE;
  cached = { stages: sortPipeline(stages as PipelineStage[]) };
  return cached;
};

export const findStage = (
  pipeline: LeadPipeline,
  key: unknown,
): PipelineStage | undefined => pipeline.stages.find((s) => s.key === key);

export const findSubStatus = (
  pipeline: LeadPipeline,
  stageKey: unknown,
  subKey: unknown,
): PipelineSubStatus | undefined =>
  findStage(pipeline, stageKey)?.subStatuses.find((s) => s.key === subKey);

/** Where a captured lead lands, and where a reset-on-reassign sends it. */
export const defaultPair = (
  pipeline: LeadPipeline,
): { status: string; subStatus: string } => {
  const stage =
    pipeline.stages.find((s) => s.isDefault && s.active) ??
    pipeline.stages.find((s) => s.active) ??
    pipeline.stages[0];
  if (!stage) {
    throw new AppError("The lead pipeline has no stages", 500);
  }
  const sub =
    stage.subStatuses.find((s) => s.active) ?? stage.subStatuses[0];
  return { status: stage.key, subStatus: sub?.key ?? "" };
};

export const conversionPair = (
  pipeline: LeadPipeline,
): { status: string; subStatus: string } | null => {
  for (const stage of pipeline.stages) {
    const sub = stage.subStatuses.find((s) => s.isConversion);
    if (sub) return { status: stage.key, subStatus: sub.key };
  }
  return null;
};

const slugify = (label: string): string =>
  label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * A key for a newly added row. Derived from the label once and then frozen,
 * because a lead stores the key: regenerating it on a rename would strand every
 * lead sitting on the old one.
 */
export const keyFor = (label: string, taken: Set<string>): string => {
  const base = slugify(label) || "option";
  let key = base;
  let n = 2;
  while (taken.has(key)) {
    key = `${base}-${n}`;
    n += 1;
  }
  taken.add(key);
  return key;
};

interface IncomingSubStatus {
  key?: unknown;
  label?: unknown;
  active?: unknown;
  isConversion?: unknown;
}

interface IncomingStage {
  key?: unknown;
  label?: unknown;
  active?: unknown;
  isDefault?: unknown;
  subStatuses?: unknown;
}

/**
 * Normalises what the admin screen sends into what is stored: order comes from
 * array position, keys are kept for rows that already had one and minted for
 * rows that did not, and the invariants the rest of the code relies on are
 * enforced here rather than trusted.
 */
export const normalisePipelineInput = (
  input: unknown,
  current: LeadPipeline,
): PipelineStage[] => {
  if (!Array.isArray(input) || input.length === 0) {
    throw new AppError("The pipeline needs at least one stage", 400);
  }

  const knownStageKeys = new Set(current.stages.map((s) => s.key));
  const usedStageKeys = new Set<string>();
  const stages: PipelineStage[] = [];

  input.forEach((raw: IncomingStage, index) => {
    const label = String(raw?.label ?? "").trim();
    if (!label) {
      throw new AppError("Every stage needs a name", 400);
    }

    const existingKey =
      typeof raw.key === "string" && knownStageKeys.has(raw.key)
        ? raw.key
        : null;
    if (existingKey && usedStageKeys.has(existingKey)) {
      throw new AppError("A stage was sent twice", 400);
    }
    const key = existingKey ?? keyFor(label, new Set([...knownStageKeys, ...usedStageKeys]));
    usedStageKeys.add(key);

    const rawSubs = Array.isArray(raw.subStatuses) ? raw.subStatuses : [];
    if (rawSubs.length === 0) {
      throw new AppError(`"${label}" needs at least one sub-status`, 400);
    }

    const knownSubKeys = new Set(
      current.stages.find((s) => s.key === key)?.subStatuses.map((s) => s.key) ??
        [],
    );
    const usedSubKeys = new Set<string>();

    const subStatuses = rawSubs.map((rawSub: IncomingSubStatus, subIndex) => {
      const subLabel = String(rawSub?.label ?? "").trim();
      if (!subLabel) {
        throw new AppError(`Every sub-status under "${label}" needs a name`, 400);
      }
      const existingSubKey =
        typeof rawSub.key === "string" && knownSubKeys.has(rawSub.key)
          ? rawSub.key
          : null;
      if (existingSubKey && usedSubKeys.has(existingSubKey)) {
        throw new AppError(`A sub-status under "${label}" was sent twice`, 400);
      }
      const subKey =
        existingSubKey ??
        keyFor(subLabel, new Set([...knownSubKeys, ...usedSubKeys]));
      usedSubKeys.add(subKey);

      return {
        key: subKey,
        label: subLabel,
        order: subIndex,
        active: rawSub.active !== false,
        isConversion: rawSub.isConversion === true,
      };
    });

    stages.push({
      key,
      label,
      order: index,
      active: raw.active !== false,
      isDefault: raw.isDefault === true,
      subStatuses,
    });
  });

  const defaults = stages.filter((s) => s.isDefault);
  if (defaults.length !== 1) {
    throw new AppError("Mark exactly one stage as where new leads land", 400);
  }
  if (!defaults[0].active) {
    throw new AppError("The stage new leads land on cannot be retired", 400);
  }
  if (!defaults[0].subStatuses.some((s) => s.active)) {
    throw new AppError(
      "The stage new leads land on needs one live sub-status",
      400,
    );
  }

  const conversions = stages.flatMap((s) =>
    s.subStatuses.filter((sub) => sub.isConversion),
  );
  if (conversions.length !== 1) {
    throw new AppError(
      "Mark exactly one sub-status as the one that counts as a conversion",
      400,
    );
  }

  return stages;
};

/**
 * Keys a lead is still sitting on. Used to refuse a save that would drop a row
 * out of the pipeline entirely, which is what would leave those leads showing a
 * blank status and missing from every filter. Retiring such a row is fine.
 */
export const assertNothingInUseWasDropped = async (
  next: PipelineStage[],
  current: LeadPipeline,
): Promise<void> => {
  const nextStages = new Set(next.map((s) => s.key));
  const nextPairs = new Set(
    next.flatMap((s) => s.subStatuses.map((sub) => `${s.key}::${sub.key}`)),
  );

  const droppedStages = current.stages
    .map((s) => s.key)
    .filter((key) => !nextStages.has(key));
  const droppedPairs = current.stages.flatMap((stage) =>
    stage.subStatuses
      .filter((sub) => !nextPairs.has(`${stage.key}::${sub.key}`))
      .map((sub) => ({ stage, sub })),
  );

  if (droppedStages.length === 0 && droppedPairs.length === 0) return;

  const [stageHit, pairHit] = await Promise.all([
    droppedStages.length > 0
      ? LeadModel.findOne({ status: { $in: droppedStages } }, { status: 1 }).lean()
      : null,
    droppedPairs.length > 0
      ? LeadModel.findOne(
          {
            $or: droppedPairs.map(({ stage, sub }) => ({
              status: stage.key,
              subStatus: sub.key,
            })),
          },
          { status: 1, subStatus: 1 },
        ).lean()
      : null,
  ]);

  if (stageHit) {
    const stage = current.stages.find((s) => s.key === stageHit.status);
    throw new AppError(
      `Leads are still on "${stage?.label ?? stageHit.status}". Retire it instead of removing it, so those leads keep their label and stay filterable.`,
      409,
    );
  }
  if (pairHit) {
    const stage = current.stages.find((s) => s.key === pairHit.status);
    const sub = stage?.subStatuses.find((s) => s.key === pairHit.subStatus);
    throw new AppError(
      `Leads are still on "${sub?.label ?? pairHit.subStatus}". Retire it instead of removing it, so those leads keep their label and stay filterable.`,
      409,
    );
  }
};

export const updateLeadPipeline = async (
  input: unknown,
  updatedBy: mongoose.Types.ObjectId | null,
): Promise<LeadPipeline> => {
  const current = await getLeadPipeline();
  const stages = normalisePipelineInput(input, current);
  await assertNothingInUseWasDropped(stages, current);

  const saved = await LeadPipelineSettingsModel.findOneAndUpdate(
    { key: "global" },
    { $set: { stages, updatedBy } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean<{ stages: PipelineStage[] }>();

  clearLeadPipelineCache();
  cached = { stages: sortPipeline(saved.stages) };
  return cached;
};
