"use client";

import Input from "@/components/ui/inputs/Input";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { useFormContext, Controller, useFieldArray } from "react-hook-form";
import { InternshipFormData } from "@/types/internshipForm";
import { DollarSign, PlusIcon, Trash2Icon } from "lucide-react";

type Props = { batchIndex: number };

/** Per-batch pricing block (embedded under Screen 2 batch accordion). */
const InternshipBatchPlanFields = ({ batchIndex }: Props) => {
  const {
    control,
    formState: { errors },
  } = useFormContext<InternshipFormData>();

  const base = `batches.${batchIndex}.plan` as const;

  const { fields, append, remove } = useFieldArray({
    control,
    name: `${base}.features`,
  });

  const batchErrors = errors.batches?.[batchIndex]?.plan;

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-5 flex flex-col gap-5 mt-4">
      <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm">
        <DollarSign className="size-5 text-orange-500 shrink-0" />
        Plan for this batch
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name={`${base}.title`}
          control={control}
          rules={{ required: "Plan title is required" }}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              label="Plan title"
              placeholder="e.g. Batch Jan 2026 — Standard"
              error={batchErrors?.title?.message as string | undefined}
              required
            />
          )}
        />
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Controller
          name={`${base}.isPopular`}
          control={control}
          render={({ field }) => (
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
              <CheckBoxContainer
                label="Mark as popular"
                checked={field.value || false}
                onChange={field.onChange}
              />
            </div>
          )}
        />
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

      <div className="rounded-xl border border-orange-100 bg-linear-to-r from-orange-50/80 to-amber-50/50 p-5 flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Plan features <span className="text-red-500">*</span>
          </p>
          <p className="text-xs text-gray-600 mt-0.5">
            Title, optional hover text, and included flag (shown on the public
            page for this batch).
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {fields.map((row, fi) => (
            <div
              key={row.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col gap-3">
                <div>
                  <label
                    className="font-medium text-black mb-2 block text-sm"
                    htmlFor={`${base}-feature-${fi}-title`}
                  >
                    Feature {fi + 1} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-row gap-3 items-center">
                    <div className="flex-1 min-w-0">
                      <Controller
                        name={`${base}.features.${fi}.title`}
                        control={control}
                        rules={{ required: "Feature title required" }}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id={`${base}-feature-${fi}-title`}
                            value={field.value ?? ""}
                            label={undefined}
                            placeholder="e.g. Certificate of completion"
                            className="w-full"
                            maxLength={1000}
                            showCharacterCount
                            error={
                              batchErrors?.features?.[fi]?.title?.message as
                                | string
                                | undefined
                            }
                            required
                          />
                        )}
                      />
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Controller
                        name={`${base}.features.${fi}.provided`}
                        control={control}
                        render={({ field }) => (
                          <CheckBoxContainer
                            label="Included"
                            checked={field.value !== false}
                            onChange={field.onChange}
                            className="text-xs cursor-pointer"
                          />
                        )}
                      />
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(fi)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-all self-center"
                          title="Remove feature"
                          aria-label="Remove feature"
                        >
                          <Trash2Icon className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <Controller
                  name={`${base}.features.${fi}.showHover`}
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Show Hover Text (Optional)
                      </label>
                      <textarea
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Text shown on hover (max 1000 characters)"
                        rows={3}
                        maxLength={1000}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 ease-in-out shadow-sm hover:shadow-md text-sm outline-none"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        {field.value?.length ?? 0}/1000 characters
                      </p>
                    </div>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
        <WhiteButton
          type="button"
          glow={false}
          className="w-fit flex items-center gap-2 text-sm"
          onClick={() => append({ title: "", provided: true, showHover: "" })}
        >
          <PlusIcon className="size-4" />
          Add feature
        </WhiteButton>
      </div>
    </div>
  );
};

export default InternshipBatchPlanFields;
