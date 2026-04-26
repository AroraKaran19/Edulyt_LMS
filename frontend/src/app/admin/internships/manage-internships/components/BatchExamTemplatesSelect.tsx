"use client";

import { useCallback } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { InfiniteScrollSelect } from "@/components/ui/dropdown/InfiniteScrollSelect";
import { InternshipFormData } from "@/types/internshipForm";
import type { InternshipExam } from "@/types/internship-exam";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";

type ExamType = "entrance" | "certification";

type Props = {
  batchIndex: number;
  examType: ExamType;
};

const LABELS: Record<ExamType, string> = {
  entrance: "Entrance exam template",
  certification: "Certification exam template",
};

/**
 * Single-select of one exam template (filtered by examType) for one batch row.
 * Pins the already-selected template to the top via internshipId + batchId.
 */
export default function BatchExamTemplatesSelect({
  batchIndex,
  examType,
}: Props) {
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
          examType,
          ...(internshipId ? { internshipId: String(internshipId) } : {}),
          ...(batchId ? { batchId: String(batchId) } : {}),
        },
      });
      const payload = res.data?.data as
        | { exams?: InternshipExam[]; totalPages?: number }
        | undefined;
      const exams = payload?.exams ?? [];
      const totalPages =
        typeof payload?.totalPages === "number" && payload.totalPages >= 1
          ? payload.totalPages
          : 1;
      return { items: exams, totalPages };
    },
    [internshipId, batchId, examType],
  );

  const fieldName =
    examType === "certification"
      ? (`batches.${batchIndex}.certificationExamTemplateId` as const)
      : (`batches.${batchIndex}.entranceExamTemplateId` as const);

  return (
    <Controller
      name={fieldName}
      control={control}
      render={({ field }) => (
        <InfiniteScrollSelect<
          Pick<InternshipExam, "_id" | "title" | "totalScore">
        >
          key={`exam-${examType}-${batchIndex}-${batchId ?? "new"}-${internshipId ?? "none"}`}
          label={LABELS[examType]}
          placeholder={`Search ${examType} exam template…`}
          multi={false}
          value={field.value ?? ""}
          onChange={(v) => field.onChange(v || null)}
          fetchOptions={fetchOptions}
          getOptionLabel={(e) => {
            const ex = e as InternshipExam;
            const pts =
              typeof ex.totalScore === "number"
                ? ` · ${ex.totalScore} pts`
                : "";
            return `${ex.title ?? "Untitled"}${pts}`;
          }}
          getOptionValue={(e) => String((e as InternshipExam)._id ?? "")}
          searchPlaceholder="Search by title…"
          emptyMessage={`No ${examType} exam templates yet. Create them in the exam bank first.`}
          dropdownPortal
        />
      )}
    />
  );
}
