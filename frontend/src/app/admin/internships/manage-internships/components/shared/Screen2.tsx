"use client";
import Container from "@/app/admin/components/ui/Container";
import DropDown from "@/components/ui/dropdown/DropDown";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";
import Input from "@/components/ui/inputs/Input";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import {
  InternshipFormData,
  createDefaultInternshipBatchPlan,
  createDefaultInternshipDiscount,
} from "@/types/internshipForm";
import InternshipBatchPlanFields from "../InternshipBatchPlanFields";
import BatchExamTemplatesSelect from "../BatchExamTemplatesSelect";
import { useEffect, useState, ChangeEvent } from "react";
import {
  PlusIcon,
  Trash2Icon,
  ChevronUpIcon,
  CalendarIcon,
  PencilIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  Percent,
} from "lucide-react";

const defaultBatch = () => ({
  name: "",
  applicationLastDate: "",
  internshipStartDate: "",
  status: "active" as const,
  isActive: true,
  plan: createDefaultInternshipBatchPlan(),
  entranceExamTemplateId: null as string | null,
  certificationExamTemplateId: null as string | null,
  taskTemplateIds: [] as string[],
});

const discountTypeOptions = ["Percentage", "Fixed Amount"];

const validateTime = (time: string | undefined) => {
  if (!time) return "Time is required";
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    return "Time must be in HH:mm format (e.g., 12:00 for 12 AM, 23:00 for 11 PM)";
  }
  return true;
};

const validateTimeRange = (
  startTime: string | undefined,
  endTime: string | undefined,
) => {
  if (!startTime || !endTime) return true;
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  if (endTotalMinutes <= startTotalMinutes) {
    return "End time must be after start time";
  }
  return true;
};

const Screen2 = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [expandedBatches, setExpandedBatches] = useState<Set<number>>(
    new Set([0]),
  );

  const {
    control,
    formState: { errors },
    getValues,
    watch,
    setValue,
  } = useFormContext<InternshipFormData>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "batches",
  });

  const batchesData = watch("batches");
  const discountState = watch("discount");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleExpanded = (index: number) => {
    setExpandedBatches((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Not set";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (!isMounted) {
    return (
      <Container
        title="Batches & Pricing (Screen 2)"
        description="Add batches with dates and pricing, plus optional internship-wide discount"
        className="h-full w-full"
        classNameBody="flex flex-col gap-4"
      >
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </Container>
    );
  }

  const batchesRootError =
    typeof errors.batches?.message === "string"
      ? errors.batches.message
      : undefined;

  return (
    <Container
      title="Batches & Pricing (Screen 2)"
      description="Add batches with dates and pricing, plus optional internship-wide discount"
      className="h-full w-full"
      classNameBody="flex flex-col gap-6 min-h-0 pb-2"
    >
      <div className="w-full shadow-none border-none pb-0">
        <Controller
          name="batches"
          control={control}
          rules={{
            validate: (v) => {
              if (!v?.length) return "Add at least one batch";
              for (const b of v) {
                if (!b.name?.trim()) {
                  return "Each batch needs a name";
                }
                if (!b.applicationLastDate || !b.internshipStartDate) {
                  return "Each batch needs application last date and internship start date";
                }
                if (b.applicationLastDate > b.internshipStartDate) {
                  return "Application deadline must be on or before the internship start date in each batch";
                }
                const pl = b.plan;
                if (typeof pl?.price !== "number" || pl.price <= 0) {
                  return "Each batch needs a price greater than zero";
                }
              }
              return true;
            },
          }}
          render={() => <span className="sr-only" aria-hidden />}
        />

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-black">
            Batches <span className="text-red-500">*</span>
          </p>
          <p className="text-xs text-gray-600">
            Batches are saved on this internship. Give each batch a name,
            application deadline, and internship start date. Set exam window,
            results publication time, and optional per-attempt duration on each
            linked exam template.
          </p>
          {batchesRootError && (
            <p className="text-red-500 text-sm">{batchesRootError}</p>
          )}

          <div className="flex flex-col gap-3">
            {fields.map((field, index) => {
              const isExpanded = expandedBatches.has(index);
              const batchData = batchesData?.[index];
              const hasError =
                !!errors.batches?.[index] ||
                (batchData &&
                  (!batchData.name?.trim() ||
                    !batchData.applicationLastDate ||
                    !batchData.internshipStartDate));

              const isComplete =
                batchData?.name?.trim() &&
                batchData?.applicationLastDate &&
                batchData?.internshipStartDate;

              return (
                <div
                  key={field.id}
                  className={`rounded-xl border transition-all overflow-hidden min-w-0 ${
                    hasError
                      ? "border-red-200 bg-red-50/30"
                      : isComplete
                        ? "border-green-200 bg-green-50/20"
                        : "border-gray-200 bg-white"
                  }`}
                >
                  {!isExpanded ? (
                    <div className="p-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-base font-bold text-gray-900">
                              {batchData?.name?.trim() ||
                                `Untitled Batch ${index + 1}`}
                            </span>
                            {isComplete && !hasError && (
                              <CheckCircle2Icon className="size-4 text-green-600 shrink-0" />
                            )}
                            {hasError && (
                              <AlertCircleIcon className="size-4 text-red-600 shrink-0" />
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-medium text-gray-500 uppercase">
                                Application Deadline
                              </span>
                              <div className="flex items-center gap-1.5">
                                <CalendarIcon className="size-3.5 text-orange-500 shrink-0" />
                                <span className="text-sm font-semibold text-gray-900">
                                  {formatDate(
                                    batchData?.applicationLastDate || "",
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-medium text-gray-500 uppercase">
                                Start Date
                              </span>
                              <div className="flex items-center gap-1.5">
                                <CalendarIcon className="size-3.5 text-green-500 shrink-0" />
                                <span className="text-sm font-semibold text-gray-900">
                                  {formatDate(
                                    batchData?.internshipStartDate || "",
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mt-3">
                            {batchData?.status && (
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                  batchData.status === "active"
                                    ? "bg-green-100 text-green-700 border border-green-200"
                                    : batchData.status === "completed"
                                      ? "bg-gray-100 text-gray-700 border border-gray-200"
                                      : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                }`}
                              >
                                {batchData.status.charAt(0).toUpperCase() +
                                  batchData.status.slice(1)}
                              </span>
                            )}
                            {batchData?.isActive && (
                              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-100 text-blue-700 border border-blue-200">
                                Accepting Enrollments
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleExpanded(index)}
                            className="p-2 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors group cursor-pointer"
                            aria-label="Edit batch"
                            title="Edit batch"
                          >
                            <PencilIcon className="size-4 group-hover:scale-110 transition-transform" />
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors group cursor-pointer"
                            aria-label="Remove batch"
                            title="Delete batch"
                          >
                            <Trash2Icon className="size-4 group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 flex flex-col gap-4 bg-white">
                      <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
                        <span className="text-sm font-bold text-gray-900">
                          Edit Batch {index + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleExpanded(index)}
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                            aria-label="Collapse batch"
                            title="Collapse"
                          >
                            <ChevronUpIcon className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            aria-label="Remove batch"
                            title="Delete batch"
                          >
                            <Trash2Icon className="size-4" />
                          </button>
                        </div>
                      </div>

                      <Controller
                        name={`batches.${index}.name`}
                        control={control}
                        rules={{
                          required: "Batch name is required",
                          validate: (v) =>
                            (typeof v === "string" && v.trim().length > 0) ||
                            "Batch name is required",
                        }}
                        render={({ field: f }) => (
                          <Input
                            {...f}
                            label="Batch name"
                            placeholder="e.g. Summer 2026 Cohort"
                            error={
                              errors.batches?.[index]?.name?.message as
                                | string
                                | undefined
                            }
                            required
                            className="w-full"
                          />
                        )}
                      />

                      <div className="flex gap-4 flex-col md:flex-row">
                        <div className="flex-1 min-w-0">
                          <Controller
                            name={`batches.${index}.applicationLastDate`}
                            control={control}
                            rules={{
                              required: "Application last date is required",
                              validate: (value) => {
                                if (!value) return true;
                                const start = getValues(
                                  `batches.${index}.internshipStartDate`,
                                );
                                if (start && value > start) {
                                  return "Application deadline must be on or before the internship start date";
                                }
                                return true;
                              },
                            }}
                            render={({ field: f }) => (
                              <Input
                                {...f}
                                label="Application last date"
                                type="date"
                                value={f.value || ""}
                                onChange={(e) => f.onChange(e.target.value)}
                                error={
                                  errors.batches?.[index]?.applicationLastDate
                                    ?.message as string | undefined
                                }
                                required
                                className="w-full"
                              />
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Controller
                            name={`batches.${index}.internshipStartDate`}
                            control={control}
                            rules={{
                              required: "Internship start date is required",
                              validate: (value) => {
                                if (!value) return true;
                                const app = getValues(
                                  `batches.${index}.applicationLastDate`,
                                );
                                if (app && value < app) {
                                  return "Start date must be on or after the application deadline";
                                }
                                return true;
                              },
                            }}
                            render={({ field: f }) => (
                              <Input
                                {...f}
                                label="Internship start date"
                                type="date"
                                value={f.value || ""}
                                onChange={(e) => f.onChange(e.target.value)}
                                error={
                                  errors.batches?.[index]?.internshipStartDate
                                    ?.message as string | undefined
                                }
                                required
                                className="w-full"
                              />
                            )}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                        <Controller
                          name={`batches.${index}.status`}
                          control={control}
                          render={({ field: f }) => (
                            <DropDown
                              label="Lifecycle status"
                              value={f.value ?? "active"}
                              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                f.onChange(e.target.value);
                              }}
                              onBlur={f.onBlur}
                              name={f.name}
                              options={["active", "inactive", "completed"]}
                              optionLabels={{
                                active: "Active",
                                inactive: "Inactive",
                                completed: "Completed",
                              }}
                              className="min-w-0 w-full"
                            />
                          )}
                        />
                        <Controller
                          name={`batches.${index}.isActive`}
                          control={control}
                          render={({ field: f }) => (
                            <div className="min-w-0 w-full pt-0 sm:pt-6">
                              <CheckBoxContainer
                                label="Accepting enrollments"
                                checked={f.value ?? true}
                                onChange={f.onChange}
                              />
                            </div>
                          )}
                        />
                      </div>

                      <InternshipBatchPlanFields batchIndex={index} />

                      <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-4">
                        <BatchExamTemplatesSelect batchIndex={index} examType="entrance" />
                        <BatchExamTemplatesSelect batchIndex={index} examType="certification" />
                        <p className="text-xs text-gray-500">
                          One entrance and one certification exam template per batch.
                          Already-linked templates appear first after save.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <WhiteButton
            type="button"
            glow={false}
            className="w-fit flex items-center gap-2 text-sm"
            onClick={() => {
              const newIndex = fields.length;
              append(defaultBatch());
              setExpandedBatches((prev) => new Set(prev).add(newIndex));
            }}
          >
            <PlusIcon className="size-4" />
            Add batch
          </WhiteButton>
        </div>
      </div>

      {/* Discount section */}
      <div className="w-full shadow-none border-none pb-0">
        <p className="text-sm text-gray-600 mb-4">
          Per-batch prices are set above. Use this section only if you want an
          additional percentage or fixed discount during specific hours each
          day.
        </p>

        <div className="bg-linear-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Percent className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Discount Settings
                </h3>
                <p className="text-sm text-gray-600">
                  Optional discount configuration for this internship
                </p>
              </div>
            </div>
            <CheckBoxContainer
              label="Enable Discount"
              checked={discountState?.isActive || false}
              onChange={(checked) => {
                if (checked) {
                  setValue("discount.isActive", true, {
                    shouldDirty: true,
                    shouldTouch: true,
                  });
                } else {
                  setValue("discount", createDefaultInternshipDiscount(), {
                    shouldDirty: true,
                    shouldTouch: true,
                  });
                }
              }}
            />
          </div>

          {discountState?.isActive && (
            <div className="bg-white p-6 rounded-xl border border-green-100 shadow-sm">
              <div className="flex gap-6 flex-col md:flex-row mb-6">
                <div className="flex-1">
                  <Controller
                    name="discount.discount"
                    control={control}
                    rules={{ required: "Discount type is required" }}
                    render={({ field }) => (
                      <DropDown
                        label="Discount Type"
                        value={
                          field.value === "fixed"
                            ? "Fixed Amount"
                            : "Percentage"
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          field.onChange(
                            v === "Fixed Amount" ? "fixed" : "percentage",
                          );
                        }}
                        options={discountTypeOptions}
                        className="w-full"
                        required
                      />
                    )}
                  />
                </div>
                <div className="flex-1">
                  <Controller
                    name="discount.value"
                    control={control}
                    rules={{
                      required: "Discount value is required",
                      min: { value: 0, message: "Must be 0 or greater" },
                    }}
                    render={({ field }) => (
                      <Input
                        label={`Discount Value ${
                          discountState?.discount === "percentage"
                            ? "(%) *"
                            : "(₹) *"
                        }`}
                        type="number"
                        value={field.value?.toString() ?? ""}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                        placeholder="0"
                        className="w-full"
                        required
                        min={0}
                        max={
                          discountState?.discount === "percentage"
                            ? 100
                            : undefined
                        }
                        error={
                          errors.discount?.value?.message as string | undefined
                        }
                      />
                    )}
                  />
                </div>
              </div>

              <div className="flex gap-6 flex-col md:flex-row">
                <div className="flex-1">
                  <Controller
                    name="discount.startTime"
                    control={control}
                    rules={{
                      required: "Start time is required",
                      validate: validateTime,
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Start Time"
                        type="time"
                        value={
                          field.value || discountState?.startTime || "00:00"
                        }
                        onChange={(e) => {
                          field.onChange(e.target.value);
                        }}
                        className="w-full"
                        required
                        error={
                          errors.discount?.startTime?.message as
                            | string
                            | undefined
                        }
                      />
                    )}
                  />
                </div>
                <div className="flex-1">
                  <Controller
                    name="discount.endTime"
                    control={control}
                    rules={{
                      required: "End time is required",
                      validate: (value) => {
                        const t = validateTime(value);
                        if (t !== true) return t;
                        return validateTimeRange(
                          discountState?.startTime,
                          value,
                        );
                      },
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="End Time"
                        type="time"
                        value={field.value || discountState?.endTime || "23:00"}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                        }}
                        className="w-full"
                        required
                        error={
                          errors.discount?.endTime?.message as
                            | string
                            | undefined
                        }
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
};

export default Screen2;
