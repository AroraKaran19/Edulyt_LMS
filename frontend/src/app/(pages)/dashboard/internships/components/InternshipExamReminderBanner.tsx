"use client";

import { CalendarClock } from "lucide-react";
import type { InternshipEnrollmentListRow } from "@/types";
import { entranceAttentionLabel } from "@/lib/internshipEntranceFlow";
import ExamCountdownButton from "./ExamCountdownButton";

type Props = {
  enrollment: InternshipEnrollmentListRow;
};

export default function InternshipExamReminderBanner({ enrollment }: Props) {
  const title =
    enrollment.internshipSnapshot?.title ||
    enrollment.internship?.title ||
    "Program";

  return (
    <div
      className="mb-6 rounded-2xl border border-amber-200 bg-linear-to-r from-amber-50/95 to-orange-50/80 p-4 sm:p-5 shadow-sm"
      role="status"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-3 min-w-0">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-100 border border-amber-200/80 flex items-center justify-center">
            <CalendarClock className="w-5 h-5 text-amber-800" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-amber-950">
              Entrance exam — {entranceAttentionLabel(enrollment.status)}
            </p>
            <p className="text-sm text-amber-950/90 mt-0.5 line-clamp-2 font-medium">
              {title}
              {enrollment.batchSnapshot?.name && (
                <span className="font-normal text-amber-900/75">
                  {" "}· {enrollment.batchSnapshot.name}
                </span>
              )}
            </p>
          </div>
        </div>

        <ExamCountdownButton
          enrollmentId={enrollment._id}
          examStartAt={enrollment.examStartAt}
          examEndAt={enrollment.examEndAt}
          examResultAt={enrollment.examResultAt}
          size="banner"
        />
      </div>
    </div>
  );
}
