"use client";

import { useCallback } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { CalendarClock, Check, FileText, Star } from "lucide-react";
import { InfiniteScrollSelect } from "@/components/ui/dropdown/InfiniteScrollSelect";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { CourseInternshipFormData } from "@/types/courseInternshipForm";

/** Row returned by GET /internship-tasks/admin. */
type TaskTemplateListRow = {
  _id: string;
  title: string;
  totalScore?: number;
  unlockAfterDays?: number;
  dueDays?: number;
  questionCount?: number;
};

/**
 * Multi-select of task templates for a programme, paginated with search and
 * infinite scroll. Reads the shared library under Internships → Task templates;
 * programmes reference it rather than authoring their own.
 */
export default function TaskTemplatesSelect() {
  const { control } = useFormContext<CourseInternshipFormData>();

  const fetchOptions = useCallback(async (page: number, search: string) => {
    const res = await apiClient.get(ENDPOINTS.internshipTasks.adminList, {
      params: {
        page,
        limit: 15,
        search: search.trim() || undefined,
        status: "active",
      },
    });
    const payload = res.data?.data as
      | { tasks?: TaskTemplateListRow[]; totalPages?: number }
      | undefined;

    return {
      items: (payload?.tasks ?? []) as TaskTemplateListRow[],
      totalPages:
        typeof payload?.totalPages === "number" && payload.totalPages >= 1
          ? payload.totalPages
          : 1,
    };
  }, []);

  return (
    <Controller
      name="taskTemplateIds"
      control={control}
      render={({ field }) => (
        <InfiniteScrollSelect<TaskTemplateListRow>
          label="Task Templates"
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
            return `${task.title ?? "Untitled"}${pts}`;
          }}
          getOptionValue={(t) => String((t as TaskTemplateListRow)._id ?? "")}
          renderOption={(t, { selected }) => {
            const task = t as TaskTemplateListRow;
            const pts =
              typeof task.totalScore === "number" ? task.totalScore : null;
            const unlock =
              typeof task.unlockAfterDays === "number"
                ? task.unlockAfterDays
                : null;
            const due = typeof task.dueDays === "number" ? task.dueDays : null;

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
                    {unlock != null && due != null ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 tabular-nums">
                        <CalendarClock className="w-3 h-3" />
                        day {unlock} → due +{due}d
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          }}
          searchPlaceholder="Search by title…"
          emptyMessage="No task templates yet. Create them under Internships → Task templates."
          dropdownPortal
        />
      )}
    />
  );
}
