"use client";

import { useCallback } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { InfiniteScrollSelect } from "@/components/ui/dropdown/InfiniteScrollSelect";
import { InternshipFormData } from "@/types/internshipForm";
import type { InternshipExam } from "@/types/internship-exam";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";

type Props = { batchIndex: number };

/**
 * Multi-select of exam templates for one batch row (Screen 2).
 * Passes `internshipId` + batch `_id` so the API can surface templates already
 * linked on that batch first, then paginate the rest with search + infinite scroll.
 */
export default function BatchExamTemplatesSelect({ batchIndex }: Props) {
  const { control } = useFormContext<InternshipFormData>();
  const internshipId = useWatch({ name: "internshipId" });
  const batchId = useWatch({ name: `batches.${batchIndex}._id` as const });

  const fetchOptions = useCallback(
    async (page: number, search: string) => {
      const res = await apiClient.get(ENDPOINTS.internshipExams.adminList, {
        params: {
          page,
          limit: 15,
          search: search.trim() || undefined,
          ...(internshipId ? { internshipId: String(internshipId) } : {}),
          ...(batchId ? { batchId: String(batchId) } : {}),
        },
      });
      const payload = res.data?.data as
        | {
            exams?: InternshipExam[];
            totalPages?: number;
          }
        | undefined;
      const exams = payload?.exams ?? [];
      const totalPages =
        typeof payload?.totalPages === "number" && payload.totalPages >= 1
          ? payload.totalPages
          : 1;
      return {
        items: exams,
        totalPages,
      };
    },
    [internshipId, batchId],
  );

  return (
    <Controller
      name={`batches.${batchIndex}.examTemplateIds`}
      control={control}
      render={({ field }) => (
        <InfiniteScrollSelect<Pick<InternshipExam, "_id" | "title" | "totalScore">>
          key={`exam-templates-${batchIndex}-${batchId ?? "new"}-${internshipId ?? "none"}`}
          label="Exam templates for this batch"
          placeholder="Search exam templates…"
          multi
          value={field.value ?? []}
          onChange={(v) => field.onChange(Array.isArray(v) ? v : [])}
          fetchOptions={fetchOptions}
          getOptionLabel={(e) => {
            const ex = e as InternshipExam;
            const pts =
              typeof ex.totalScore === "number" ? ` · ${ex.totalScore} pts` : "";
            return `${ex.title ?? "Untitled"}${pts}`;
          }}
          getOptionValue={(e) => String((e as InternshipExam)._id ?? "")}
          searchPlaceholder="Search by title…"
          emptyMessage="No exam templates yet. Create templates in the exam bank first."
          dropdownPortal
        />
      )}
    />
  );
}
