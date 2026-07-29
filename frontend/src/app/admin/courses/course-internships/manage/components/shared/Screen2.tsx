"use client";

import Container from "@/app/admin/components/ui/Container";
import Input from "@/components/ui/inputs/Input";
import { Controller, useFormContext } from "react-hook-form";
import { CourseInternshipFormData } from "@/types/courseInternshipForm";
import { CheckSquareIcon } from "lucide-react";
import TaskTemplatesSelect from "../TaskTemplatesSelect";

const Screen2 = () => {
  const { control, watch } = useFormContext<CourseInternshipFormData>();

  const documentationRequired = watch("documentationRequired");

  return (
    <Container
      title="Tasks & Documents"
      description="What the learner has to complete, and by when"
      icon={CheckSquareIcon}
      classNameBody="flex flex-col gap-6"
    >
      <div>
        <TaskTemplatesSelect />
        <p className="text-sm text-gray-500 mt-2">
          Each template carries its own unlock and due offsets, counted from the
          learner&apos;s purchase date. A task that would fall outside a
          learner&apos;s chosen duration is hidden from them and left out of
          their score.
        </p>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <Controller
          name="documentationRequired"
          control={control}
          render={({ field }) => (
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-orange-500 shrink-0"
                checked={!!field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
              <span>
                <span className="block font-medium text-black">
                  Require document review
                </span>
                <span className="block text-sm text-gray-500">
                  The learner uploads documents for an admin to approve before a
                  certificate can be issued.
                </span>
              </span>
            </label>
          )}
        />

        {documentationRequired && (
          <div className="mt-4 max-w-xs">
            <Controller
              name="documentationDueOffsetDays"
              control={control}
              rules={{
                min: { value: 0, message: "Cannot be negative" },
              }}
              render={({ field, fieldState }) => (
                <Input
                  type="number"
                  label="Documents due (days after purchase)"
                  min={0}
                  step={1}
                  value={field.value}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    field.onChange(Number.isFinite(n) ? n : 0);
                  }}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>
        )}
      </div>
    </Container>
  );
};

export default Screen2;
