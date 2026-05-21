"use client";

import { useCallback } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { Check, FileText, HelpCircle, Star } from "lucide-react";
import { InfiniteScrollSelect } from "@/components/ui/dropdown/InfiniteScrollSelect";
import { InternshipFormData } from "@/types/internshipForm";
import type { InternshipTask } from "@/types/internship-task";

/** Row returned by GET /internship-tasks/admin (list includes questionCount). */
type TaskTemplateListRow = Pick<
  InternshipTask,
  "_id" | "title" | "totalScore" | "scoreThreshold"
> & {
  questionCount?: number;
};
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";

type Props = { batchIndex: number };

/**
 * Multi-select of task templates for one batch row (Screen 13).
 * Passes `internshipId` + batch `_id` so the API can surface templates already
 * linked on that batch first, then paginate the rest with search + infinite scroll.
 */
export default function BatchTaskTemplatesSelect({ batchIndex }: Props) {
  const { control } = useFormContext<InternshipFormData>();
  const internshipId = useWatch({ name: "internshipId" });
  const batchId = useWatch({ name: `batches.${batchIndex}._id` as const });

  const fetchOptions = useCallback(
    async (page: number, search: string) => {
      const res = await apiClient.get(ENDPOINTS.internshipTasks.adminList, {
        params: {
          page,
          limit: 15,
          search: search.trim() || undefined,
          status: "active",
          ...(internshipId ? { internshipId: String(internshipId) } : {}),
          ...(batchId ? { batchId: String(batchId) } : {}),
        },
      });
      const payload = res.data?.data as
        | {
            tasks?: InternshipTask[];
            totalPages?: number;
          }
        | undefined;
      const tasks = (payload?.tasks ?? []) as TaskTemplateListRow[];
      const totalPages =
        typeof payload?.totalPages === "number" && payload.totalPages >= 1
          ? payload.totalPages
          : 1;
      return {
        items: tasks,
        totalPages,
      };
    },
    [internshipId, batchId],
  );

  return (
    <Controller
      name={`batches.${batchIndex}.taskTemplateIds`}
      control={control}
      render={({ field }) => (
        <InfiniteScrollSelect<TaskTemplateListRow>
          key={`task-templates-${batchIndex}-${batchId ?? "new"}-${internshipId ?? "none"}`}
          label="Task templates for this batch"
          placeholder="Search task templates…"
          multi
          value={field.value ?? []}
          onChange={(v) => field.onChange(Array.isArray(v) ? v : [])}
          fetchOptions={fetchOptions}
          getOptionLabel={(t) => {
            const task = t as TaskTemplateListRow;
            const pts =
              typeof task.totalScore === "number"
                ? ` · ${task.totalScore} pts`
                : "";
            const qc =
              typeof task.questionCount === "number"
                ? ` · ${task.questionCount} Q`
                : "";
            return `${task.title ?? "Untitled"}${pts}${qc}`;
          }}
          getOptionValue={(t) => String((t as TaskTemplateListRow)._id ?? "")}
          renderOption={(t, { selected }) => {
            const task = t as TaskTemplateListRow;
            const pts =
              typeof task.totalScore === "number" ? task.totalScore : null;
            const qc =
              typeof task.questionCount === "number"
                ? task.questionCount
                : null;
            const threshold =
              typeof task.scoreThreshold === "number"
                ? task.scoreThreshold
                : null;
            return (
              <div className="flex items-start gap-3 w-full">
                <span
                  className={
                    selected
                      ? "shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-md bg-[#F77124] text-white"
                      : "shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border border-gray-300 bg-white"
                  }
                  aria-hidden
                >
                  {selected ? <Check className="w-3.5 h-3.5" /> : null}
                </span>
                <span className="shrink-0 mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-[#F77124]">
                  <FileText className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={
                      selected
                        ? "text-sm font-semibold text-[#F77124] truncate"
                        : "text-sm font-semibold text-gray-900 truncate"
                    }
                  >
                    {task.title || "Untitled"}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
                    {pts != null ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 border border-amber-100 px-1.5 py-0.5 tabular-nums">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {pts} pts
                      </span>
                    ) : null}
                    {qc != null ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 tabular-nums">
                        <HelpCircle className="w-3 h-3" />
                        {qc} {qc === 1 ? "question" : "questions"}
                      </span>
                    ) : null}
                    {threshold != null && pts != null && threshold > 0 ? (
                      <span className="text-gray-400">
                        pass ≥ {threshold}/{pts}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          }}
          searchPlaceholder="Search by title…"
          emptyMessage="No task templates yet. Create templates in the task bank first."
          dropdownPortal
        />
      )}
    />
  );
}
