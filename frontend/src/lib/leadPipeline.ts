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

export const EMPTY_PIPELINE: LeadPipeline = { stages: [] };

export interface Option {
  value: string;
  label: string;
}

export const findStage = (
  pipeline: LeadPipeline,
  key: unknown,
): PipelineStage | undefined => pipeline.stages.find((s) => s.key === key);

/**
 * Retired rows are kept out of the pickers an agent changes a lead with, and
 * kept in the filters: leads are still sitting on them, and they have to stay
 * findable.
 */
export const stageOptions = (
  pipeline: LeadPipeline,
  includeRetired = false,
): Option[] =>
  pipeline.stages
    .filter((s) => includeRetired || s.active)
    .map((s, i) => ({
      value: s.key,
      label: `${i + 1}. ${s.label}${s.active ? "" : " (retired)"}`,
    }));

export const subStatusOptions = (
  pipeline: LeadPipeline,
  stageKey: unknown,
  includeRetired = false,
): Option[] =>
  (findStage(pipeline, stageKey)?.subStatuses ?? [])
    .filter((s) => includeRetired || s.active)
    .map((s) => ({
      value: s.key,
      label: `${s.label}${s.active ? "" : " (retired)"}`,
    }));

/**
 * Labels fall back to the stored key rather than to an empty string, so a lead
 * holding something the pipeline no longer describes still reads as something.
 */
export const stageLabel = (pipeline: LeadPipeline, key: unknown): string =>
  findStage(pipeline, key)?.label ?? (typeof key === "string" ? key : "");

export const subStatusLabel = (
  pipeline: LeadPipeline,
  stageKey: unknown,
  subKey: unknown,
): string =>
  findStage(pipeline, stageKey)?.subStatuses.find((s) => s.key === subKey)
    ?.label ?? (typeof subKey === "string" ? subKey : "");

/** The sub-status a stage lands on when the stage changes. */
export const defaultSubStatusFor = (
  pipeline: LeadPipeline,
  stageKey: unknown,
): string => {
  const subs = findStage(pipeline, stageKey)?.subStatuses ?? [];
  return (subs.find((s) => s.active) ?? subs[0])?.key ?? "";
};

/** True when a stage has exactly one live sub-status, so it needs no second pick. */
export const onlySubStatusFor = (
  pipeline: LeadPipeline,
  stageKey: unknown,
): string | null => {
  const live = (findStage(pipeline, stageKey)?.subStatuses ?? []).filter(
    (s) => s.active,
  );
  return live.length === 1 ? live[0].key : null;
};

/** "Connected / Interested", for a row that shows the pair in one cell. */
export const pipelineLabel = (
  pipeline: LeadPipeline,
  stageKey: unknown,
  subKey: unknown,
): string => {
  const stage = stageLabel(pipeline, stageKey);
  const sub = subStatusLabel(pipeline, stageKey, subKey);
  return sub ? `${stage} / ${sub}` : stage;
};

/**
 * Colour comes from the stage's position in the funnel rather than its key,
 * because the admin can rename, add and reorder stages and a lookup table keyed
 * by name would go blank the moment they did.
 */
const STAGE_PALETTE = [
  "bg-blue-50 text-blue-700 ring-blue-600/20",
  "bg-amber-50 text-amber-700 ring-amber-600/20",
  "bg-purple-50 text-purple-700 ring-purple-600/20",
  "bg-orange-50 text-orange-700 ring-orange-600/20",
  "bg-green-50 text-green-700 ring-green-600/20",
  "bg-teal-50 text-teal-700 ring-teal-600/20",
  "bg-pink-50 text-pink-700 ring-pink-600/20",
];

const RETIRED_STYLE = "bg-gray-100 text-gray-600 ring-gray-500/20";

export const stageStyle = (pipeline: LeadPipeline, key: unknown): string => {
  const index = pipeline.stages.findIndex((s) => s.key === key);
  if (index < 0) return RETIRED_STYLE;
  if (!pipeline.stages[index].active) return RETIRED_STYLE;
  return STAGE_PALETTE[index % STAGE_PALETTE.length];
};
