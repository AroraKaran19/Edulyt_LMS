"use client";

import { useCallback } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
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
          searchPlaceholder="Search by title…"
          emptyMessage="No task templates yet. Create templates in the task bank first."
          dropdownPortal
        />
      )}
    />
  );
}
