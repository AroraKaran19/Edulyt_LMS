"use client";

import Input from "@/components/ui/inputs/Input";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";
import { useFormContext, Controller } from "react-hook-form";
import { InternshipFormData } from "@/types/internshipForm";
import { DollarSign } from "lucide-react";

type Props = { batchIndex: number };

/** Per-batch pricing block (embedded under Screen 2 batch accordion). */
const InternshipBatchPlanFields = ({ batchIndex }: Props) => {
  const {
    control,
    formState: { errors },
  } = useFormContext<InternshipFormData>();

  const base = `batches.${batchIndex}.plan` as const;
  const batchErrors = errors.batches?.[batchIndex]?.plan;

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-5 flex flex-col gap-5 mt-4">
      <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm">
        <DollarSign className="size-5 text-orange-500 shrink-0" />
        Plan for this batch
      </div>

      <Controller
        name={`${base}.price`}
        control={control}
        rules={{
          required: "Price is required",
          min: { value: 0, message: "Price cannot be negative" },
          validate: (v) =>
            typeof v === "number" && v > 0
              ? true
              : "Enter a price greater than zero",
        }}
        render={({ field }) => (
          <Input
            label="Price (₹)"
            type="number"
            min={0}
            placeholder="0"
            value={
              field.value === undefined || field.value === null
                ? ""
                : String(field.value)
            }
            setChange={(v) => {
              const n = parseFloat(v);
              field.onChange(v === "" || Number.isNaN(n) ? 0 : n);
            }}
            onBlur={field.onBlur}
            name={field.name}
            ref={field.ref}
            error={batchErrors?.price?.message as string | undefined}
            required
          />
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Controller
          name={`${base}.isActive`}
          control={control}
          render={({ field }) => (
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
              <CheckBoxContainer
                label="Plan active"
                checked={field.value !== false}
                onChange={field.onChange}
              />
            </div>
          )}
        />
      </div>
    </div>
  );
};

export default InternshipBatchPlanFields;
