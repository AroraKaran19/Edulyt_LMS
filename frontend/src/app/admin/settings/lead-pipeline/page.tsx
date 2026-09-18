"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import apiClient from "@/configs/apiConfig";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Input from "@/components/ui/inputs/Input";
import { clearLeadPipelineCache } from "@/hooks/useLeadPipeline";
import type { LeadPipeline, PipelineStage } from "@/lib/leadPipeline";

/** A row the admin has added but not saved carries no key yet. */
type DraftSubStatus = {
  key?: string;
  label: string;
  active: boolean;
  isConversion: boolean;
};

type DraftStage = {
  key?: string;
  label: string;
  active: boolean;
  isDefault: boolean;
  subStatuses: DraftSubStatus[];
};

const toDraft = (stages: PipelineStage[]): DraftStage[] =>
  stages.map((stage) => ({
    key: stage.key,
    label: stage.label,
    active: stage.active,
    isDefault: stage.isDefault,
    subStatuses: stage.subStatuses.map((sub) => ({
      key: sub.key,
      label: sub.label,
      active: sub.active,
      isConversion: sub.isConversion,
    })),
  }));

const move = <T,>(list: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

export default function AdminLeadPipelinePage() {
  const [stages, setStages] = useState<DraftStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/leads/pipeline");
      const data: LeadPipeline = res.data?.data ?? { stages: [] };
      setStages(toDraft(data.stages ?? []));
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      toast.error(message || "Could not load the pipeline");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patchStage = (index: number, patch: Partial<DraftStage>) =>
    setStages((prev) =>
      prev.map((stage, i) => (i === index ? { ...stage, ...patch } : stage)),
    );

  const patchSub = (
    stageIndex: number,
    subIndex: number,
    patch: Partial<DraftSubStatus>,
  ) =>
    setStages((prev) =>
      prev.map((stage, i) =>
        i !== stageIndex
          ? stage
          : {
              ...stage,
              subStatuses: stage.subStatuses.map((sub, j) =>
                j === subIndex ? { ...sub, ...patch } : sub,
              ),
            },
      ),
    );

  /** Exactly one stage is where new leads land, so setting one clears the rest. */
  const makeDefault = (index: number) =>
    setStages((prev) =>
      prev.map((stage, i) => ({ ...stage, isDefault: i === index })),
    );

  /** Exactly one sub-status counts as a conversion, anywhere in the pipeline. */
  const makeConversion = (stageIndex: number, subIndex: number) =>
    setStages((prev) =>
      prev.map((stage, i) => ({
        ...stage,
        subStatuses: stage.subStatuses.map((sub, j) => ({
          ...sub,
          isConversion: i === stageIndex && j === subIndex,
        })),
      })),
    );

  const save = async () => {
    setSaving(true);
    try {
      const res = await apiClient.put("/leads/admin/pipeline", { stages });
      const data: LeadPipeline = res.data?.data ?? { stages: [] };
      setStages(toDraft(data.stages ?? []));
      // Every other screen reads the pipeline through a shared cache.
      clearLeadPipelineCache();
      toast.success("Pipeline saved");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      toast.error(message || "Could not save the pipeline");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex w-full justify-center p-12">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead pipeline</h1>
          <p className="max-w-2xl text-sm text-gray-600">
            The stages of the funnel and the sub-statuses inside each one, as
            they appear on the lead screens. Renaming is always safe: leads
            store a hidden key, not the name you type here.
          </p>
        </div>
        <div className="flex gap-2">
          <WhiteButton type="button" glow={false} onClick={() => void load()}>
            <RotateCcw className="size-4" />
            Discard changes
          </WhiteButton>
          <OrangeButton
            type="button"
            glow={false}
            disabled={saving}
            onClick={() => void save()}
          >
            <Save className="size-4" />
            {saving ? "Saving…" : "Save pipeline"}
          </OrangeButton>
        </div>
      </div>

      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Removing is only for a row no lead has ever been on. To take a live one
        out of circulation, untick <b>In use</b>: it disappears from the pickers
        agents change a lead with, while the leads already on it keep their
        label and stay filterable.
      </p>

      <div className="space-y-4">
        {stages.map((stage, stageIndex) => (
          <div
            key={stage.key ?? `new-${stageIndex}`}
            className={`rounded-2xl border bg-white p-4 ${
              stage.active ? "border-gray-200" : "border-gray-200 bg-gray-50"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-sm font-bold text-gray-400">
                {stageIndex + 1}
              </span>
              <Input
                value={stage.label}
                onChange={(e) => patchStage(stageIndex, { label: e.target.value })}
                placeholder="Stage name"
                className="min-w-[180px] flex-1"
              />
              <button
                type="button"
                onClick={() => setStages((prev) => move(prev, stageIndex, stageIndex - 1))}
                className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
                aria-label="Move stage up"
              >
                <ArrowUp className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setStages((prev) => move(prev, stageIndex, stageIndex + 1))}
                className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
                aria-label="Move stage down"
              >
                <ArrowDown className="size-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setStages((prev) => prev.filter((_, i) => i !== stageIndex))
                }
                className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                aria-label="Remove stage"
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={stage.active}
                  onChange={(e) =>
                    patchStage(stageIndex, { active: e.target.checked })
                  }
                  className="size-4 rounded border-gray-300 text-orange-600"
                />
                <span className="text-gray-700">In use</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="default-stage"
                  checked={stage.isDefault}
                  onChange={() => makeDefault(stageIndex)}
                  className="size-4 border-gray-300 text-orange-600"
                />
                <span className="text-gray-700">New leads land here</span>
              </label>
            </div>

            <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
              {stage.subStatuses.map((sub, subIndex) => (
                <div
                  key={sub.key ?? `new-${subIndex}`}
                  className="flex flex-wrap items-center gap-2.5"
                >
                  <Input
                    value={sub.label}
                    onChange={(e) =>
                      patchSub(stageIndex, subIndex, { label: e.target.value })
                    }
                    placeholder="Sub-status name"
                    className="min-w-[180px] flex-1"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-gray-700">
                    <input
                      type="checkbox"
                      checked={sub.active}
                      onChange={(e) =>
                        patchSub(stageIndex, subIndex, {
                          active: e.target.checked,
                        })
                      }
                      className="size-4 rounded border-gray-300 text-orange-600"
                    />
                    In use
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-gray-700">
                    <input
                      type="radio"
                      name="conversion-sub-status"
                      checked={sub.isConversion}
                      onChange={() => makeConversion(stageIndex, subIndex)}
                      className="size-4 border-gray-300 text-orange-600"
                    />
                    Counts as a conversion
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setStages((prev) =>
                        prev.map((s, i) =>
                          i !== stageIndex
                            ? s
                            : {
                                ...s,
                                subStatuses: move(
                                  s.subStatuses,
                                  subIndex,
                                  subIndex - 1,
                                ),
                              },
                        ),
                      )
                    }
                    className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50"
                    aria-label="Move sub-status up"
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setStages((prev) =>
                        prev.map((s, i) =>
                          i !== stageIndex
                            ? s
                            : {
                                ...s,
                                subStatuses: move(
                                  s.subStatuses,
                                  subIndex,
                                  subIndex + 1,
                                ),
                              },
                        ),
                      )
                    }
                    className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50"
                    aria-label="Move sub-status down"
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setStages((prev) =>
                        prev.map((s, i) =>
                          i !== stageIndex
                            ? s
                            : {
                                ...s,
                                subStatuses: s.subStatuses.filter(
                                  (_, j) => j !== subIndex,
                                ),
                              },
                        ),
                      )
                    }
                    className="rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
                    aria-label="Remove sub-status"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  setStages((prev) =>
                    prev.map((s, i) =>
                      i !== stageIndex
                        ? s
                        : {
                            ...s,
                            subStatuses: [
                              ...s.subStatuses,
                              { label: "", active: true, isConversion: false },
                            ],
                          },
                    ),
                  )
                }
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700"
              >
                <Plus className="size-4" />
                Add sub-status
              </button>
            </div>
          </div>
        ))}
      </div>

      <WhiteButton
        type="button"
        glow={false}
        onClick={() =>
          setStages((prev) => [
            ...prev,
            {
              label: "",
              active: true,
              isDefault: false,
              subStatuses: [{ label: "", active: true, isConversion: false }],
            },
          ])
        }
      >
        <Plus className="size-4" />
        Add stage
      </WhiteButton>
    </div>
  );
}
