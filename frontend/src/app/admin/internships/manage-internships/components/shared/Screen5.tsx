"use client";
import Container from "@/app/admin/components/ui/Container";
import Input from "@/components/ui/inputs/Input";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import IconDropdown from "@/components/ui/dropdown/IconDropdown";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { InternshipFormData } from "@/types/internshipForm";
import { validateWhyJoinField } from "@/lib/internshipScreenValidation";
import { useEffect, useState } from "react";
import {
  PlusIcon,
  Trash2Icon,
  ChevronUp,
  PencilIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
} from "lucide-react";
import { Icon } from "@iconify/react";
import { WHY_JOIN_ICONS } from "@/constants/internshipIcons";

const defaultWhyJoin = () => ({
  title: "",
  description: "",
  icon: "mdi:rocket-launch-outline",
});

const Screen5 = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [expandedReasons, setExpandedReasons] = useState<Set<number>>(
    new Set([0]),
  );

  const {
    control,
    formState: { errors },
    watch,
  } = useFormContext<InternshipFormData>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "whyJoin",
  });

  const whyJoinData = watch("whyJoin");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleExpanded = (index: number) => {
    setExpandedReasons((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (!isMounted) {
    return (
      <Container
        title="Why Join (Screen 5)"
        description="Explain why students should join this internship"
        className="h-full w-full"
        classNameBody="flex flex-col gap-4"
      >
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </Container>
    );
  }

  return (
    <Container
      title="Why Join (Screen 5)"
      description="Explain why students should join this internship"
      className="h-full w-full"
      classNameBody="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-black">
          Why Join This Internship
        </p>
        <p className="text-xs text-gray-600">
          Add compelling reasons why students should join this internship. Each
          reason should have a title, description, and icon.
        </p>

        <Controller
          name="whyJoin"
          control={control}
          rules={{ validate: validateWhyJoinField }}
          render={() => <span className="sr-only" aria-hidden />}
        />
        {typeof errors.whyJoin?.message === "string" && (
          <p className="text-red-500 text-sm">{errors.whyJoin.message}</p>
        )}

        <div className="flex flex-col gap-3">
          {fields.map((field, index) => {
            const isExpanded = expandedReasons.has(index);
            const reasonData = whyJoinData?.[index];
            const selectedIcon =
              reasonData?.icon || "mdi:rocket-launch-outline";
            const iconLabel =
              WHY_JOIN_ICONS.find((i) => i.name === selectedIcon)?.label ||
              "Icon";

            const hasError =
              !!errors.whyJoin?.[index] ||
              (reasonData &&
                (!reasonData.title?.trim() || !reasonData.description?.trim()));

            const isComplete =
              reasonData?.title?.trim() && reasonData?.description?.trim();

            return (
              <div
                key={field.id}
                className={`rounded-xl border overflow-hidden transition-all ${
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
                        <div className="flex items-center gap-2 mb-2">
                          <Icon
                            icon={selectedIcon}
                            className="size-5 text-green-500 shrink-0"
                          />
                          <span className="text-base font-bold text-gray-900">
                            {reasonData?.title?.trim() || `Reason ${index + 1}`}
                          </span>
                          {isComplete && !hasError && (
                            <CheckCircle2Icon className="size-4 text-green-600 shrink-0" />
                          )}
                          {hasError && (
                            <AlertCircleIcon className="size-4 text-red-600 shrink-0" />
                          )}
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-2">
                          {reasonData?.description?.trim() || "No description"}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                            {iconLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(index)}
                          className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors cursor-pointer"
                          aria-label="Edit reason"
                        >
                          <PencilIcon className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          aria-label="Remove reason"
                        >
                          <Trash2Icon className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 flex flex-col gap-4 bg-white">
                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
                      <span className="text-sm font-bold text-gray-900">
                        Edit Reason {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(index)}
                          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                          aria-label="Collapse reason"
                        >
                          <ChevronUp className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          aria-label="Remove reason"
                        >
                          <Trash2Icon className="size-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Controller
                        name={`whyJoin.${index}.title`}
                        control={control}
                        rules={{
                          required: "Title is required",
                          validate: (v) =>
                            (typeof v === "string" && v.trim().length > 0) ||
                            "Title is required",
                        }}
                        render={({ field: f }) => (
                          <Input
                            {...f}
                            label="Title"
                            placeholder="e.g. Launch Your Career"
                            error={
                              errors.whyJoin?.[index]?.title?.message as
                                | string
                                | undefined
                            }
                            required
                            className="w-full"
                          />
                        )}
                      />

                      <Controller
                        name={`whyJoin.${index}.icon`}
                        control={control}
                        rules={{
                          required: "Icon is required",
                        }}
                        render={({ field: f }) => (
                          <IconDropdown
                            value={f.value || "mdi:rocket-launch-outline"}
                            onChange={f.onChange}
                            label="Icon"
                            required
                            error={
                              errors.whyJoin?.[index]?.icon?.message as
                                | string
                                | undefined
                            }
                            icons={WHY_JOIN_ICONS}
                            iconColor="text-green-500"
                            hoverColor="hover:bg-green-50 bg-green-100 text-green-700"
                          />
                        )}
                      />
                    </div>

                    <Controller
                      name={`whyJoin.${index}.description`}
                      control={control}
                      rules={{
                        required: "Description is required",
                        validate: (v) =>
                          (typeof v === "string" && v.trim().length > 0) ||
                          "Description is required",
                      }}
                      render={({ field: f }) => (
                        <div className="flex flex-col gap-1.5 w-full">
                          <label className="text-sm font-medium text-gray-700">
                            Description <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            {...f}
                            placeholder="Describe this reason in detail..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-sm"
                          />
                          {errors.whyJoin?.[index]?.description && (
                            <p className="text-red-500 text-xs">
                              {
                                errors.whyJoin[index]?.description
                                  ?.message as string
                              }
                            </p>
                          )}
                        </div>
                      )}
                    />
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
            append(defaultWhyJoin());
            setExpandedReasons((prev) => new Set(prev).add(newIndex));
          }}
        >
          <PlusIcon className="size-4" />
          Add reason
        </WhiteButton>
      </div>
    </Container>
  );
};

export default Screen5;
