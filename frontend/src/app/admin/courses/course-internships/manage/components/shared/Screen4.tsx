"use client";

import Container from "@/app/admin/components/ui/Container";
import { Controller, useFormContext } from "react-hook-form";
import { CourseInternshipFormData } from "@/types/courseInternshipForm";
import { CheckCircle2, EyeIcon } from "lucide-react";

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">
        {value}
      </span>
    </div>
  );
}

const Screen4 = () => {
  const { control, watch } = useFormContext<CourseInternshipFormData>();
  const v = watch();

  const description = stripHtml(v.description || "");

  return (
    <Container
      title="Review & Publish"
      description="Check the programme before saving"
      icon={EyeIcon}
      classNameBody="flex flex-col gap-6"
    >
      <div className="flex gap-4 items-start">
        {v.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={v.thumbnail}
            alt={v.title || "Programme thumbnail"}
            className="h-24 w-40 rounded-lg object-cover border border-gray-200 shrink-0"
          />
        ) : (
          <div className="h-24 w-40 rounded-lg bg-gray-100 border border-gray-200 shrink-0" />
        )}
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-gray-900">
            {v.title || "Untitled programme"}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-3 mt-1">
            {description || "No description yet."}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 px-4">
        <Row label="Perks" value={v.perks?.length ? v.perks.join(", ") : "—"} />
        <Row
          label="What you will do"
          value={v.whatYouWillDo?.length ? v.whatYouWillDo.join(", ") : "—"}
        />
        <Row
          label="Offer letter designation"
          value={v.offerLetterDesignation || "—"}
        />
        <Row
          label="Tasks"
          value={`${v.taskTemplateIds?.length ?? 0} template${
            (v.taskTemplateIds?.length ?? 0) === 1 ? "" : "s"
          }`}
        />
        <Row
          label="Documents"
          value={
            v.documentationRequired
              ? `Required, due day ${v.documentationDueOffsetDays}`
              : "Not required"
          }
        />
        <Row
          label="WhatsApp group"
          value={v.whatsappGroupLink ? "Linked" : "—"}
        />
      </div>

      <Controller
        name="isActive"
        control={control}
        render={({ field }) => (
          <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-gray-200 p-4">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-orange-500 shrink-0"
              checked={!!field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
            <span>
              <span className="flex items-center gap-1.5 font-medium text-black">
                <CheckCircle2 className="size-4 text-orange-500" />
                Active
              </span>
              <span className="block text-sm text-gray-500">
                Inactive programmes stay available to already-enrolled learners
                but can no longer be attached to a course or sold.
              </span>
            </span>
          </label>
        )}
      />
    </Container>
  );
};

export default Screen4;
