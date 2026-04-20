"use client";

import { useEffect, useState } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { ClipboardList, Info } from "lucide-react";
import Container from "@/app/admin/components/ui/Container";
import { InternshipFormData } from "@/types/internshipForm";
import BatchTaskTemplatesSelect from "../BatchTaskTemplatesSelect";

/**
 * Optional wizard step (Screen 13 of 14): link reusable task templates to each
 * batch — same pattern as exam templates on Screen 2 (search + infinite scroll).
 */
const Screen13 = () => {
  const { control, watch } = useFormContext<InternshipFormData>();
  const { fields } = useFieldArray({ control, name: "batches" });
  const batches = watch("batches");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <Container
        title="Task templates (Screen 13) — optional"
        description="Link task templates to each batch, or skip and configure later"
        className="h-full w-full max-h-full overflow-hidden flex flex-col"
        classNameBody="flex flex-col gap-4"
      >
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-violet-500 rounded-full animate-spin" />
            Loading…
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container
      title="Task templates (Screen 13) — optional"
      description="Choose which reusable task templates belong to each batch. You can change this later when editing the internship."
      className="h-full w-full max-h-full overflow-hidden flex flex-col"
      classNameBody="flex flex-col gap-4 min-h-0"
    >
      <div className="bg-linear-to-r from-violet-50 to-indigo-50 rounded-2xl p-6 border border-violet-100 shrink-0">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-violet-500 rounded-lg shrink-0">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Assign tasks per batch
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Same experience as picking exam templates on Batches & Pricing
              (Screen 2): search the task bank, multi-select templates, and
              batch-linked items appear first when this internship is already
              saved.
            </p>
            <div className="mt-3 flex items-start gap-2 text-sm text-violet-900 bg-violet-100/60 rounded-lg p-3 border border-violet-200">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                This step is optional. Click <strong>Next</strong> to continue
                even if no tasks are selected.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex-1 min-h-0 overflow-y-auto space-y-6 pr-2"
        style={{ scrollbarWidth: "thin" }}
      >
        {fields.map((field, index) => {
          const batch = batches?.[index];
          const name = batch?.name?.trim() || `Batch ${index + 1}`;
          const selected = batch?.taskTemplateIds?.length ?? 0;
          return (
            <div
              key={field.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                <h4 className="text-base font-semibold text-gray-900">{name}</h4>
                <span className="text-xs text-gray-500">
                  {selected} task template{selected === 1 ? "" : "s"} selected
                </span>
              </div>
              <BatchTaskTemplatesSelect batchIndex={index} />
            </div>
          );
        })}
      </div>
    </Container>
  );
};

export default Screen13;
