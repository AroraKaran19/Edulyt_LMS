"use client";
import Container from "@/app/admin/components/ui/Container";
import Input from "@/components/ui/inputs/Input";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { InternshipFormData } from "@/types/internshipForm";
import { validateInternshipJourneyField } from "@/lib/internshipScreenValidation";
import { useEffect, useState } from "react";
import {
  PlusIcon,
  Trash2Icon,
  ChevronUp,
  PencilIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  ListIcon,
} from "lucide-react";

const defaultJourneySection = () => ({
  title: "",
  items: [""],
});

const Screen7 = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set([0]),
  );

  const {
    control,
    formState: { errors },
    watch,
  } = useFormContext<InternshipFormData>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "internshipJourney",
  });

  const journeyData = watch("internshipJourney");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleExpanded = (index: number) => {
    setExpandedSections((prev) => {
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
        title="Internship Journey (Screen 7)"
        description="Define the journey and milestones during the internship"
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
      title="Internship Journey (Screen 7)"
      description="Define the journey and milestones during the internship"
      className="h-full w-full"
      classNameBody="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-black">Journey Sections</p>
        <p className="text-xs text-gray-600">
          Break down the internship journey into sections with key milestones or
          activities in each phase.
        </p>

        <Controller
          name="internshipJourney"
          control={control}
          rules={{ validate: validateInternshipJourneyField }}
          render={() => <span className="sr-only" aria-hidden />}
        />
        {typeof errors.internshipJourney?.message === "string" && (
          <p className="text-red-500 text-sm">
            {errors.internshipJourney.message}
          </p>
        )}

        <div className="flex flex-col gap-3">
          {fields.map((field, index) => {
            const isExpanded = expandedSections.has(index);
            const sectionData = journeyData?.[index];

            const hasError =
              !!errors.internshipJourney?.[index] ||
              (sectionData &&
                (!sectionData.title?.trim() ||
                  !sectionData.items?.length ||
                  sectionData.items.some((item: string) => !item?.trim())));

            const isComplete =
              sectionData?.title?.trim() &&
              sectionData?.items?.length > 0 &&
              sectionData.items.every((item: string) => item?.trim());
            const itemCount = sectionData?.items?.length || 0;

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
                          <ListIcon className="size-5 text-teal-500 shrink-0" />
                          <span className="text-base font-bold text-gray-900">
                            {sectionData?.title?.trim() ||
                              `Section ${index + 1}`}
                          </span>
                          {isComplete && !hasError && (
                            <CheckCircle2Icon className="size-4 text-green-600 shrink-0" />
                          )}
                          {hasError && (
                            <AlertCircleIcon className="size-4 text-red-600 shrink-0" />
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 border border-teal-200">
                            {itemCount} {itemCount === 1 ? "item" : "items"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(index)}
                          className="p-2 rounded-lg text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                          aria-label="Edit section"
                        >
                          <PencilIcon className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          aria-label="Remove section"
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
                        Edit Section {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(index)}
                          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                          aria-label="Collapse section"
                        >
                          <ChevronUp className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          aria-label="Remove section"
                        >
                          <Trash2Icon className="size-4" />
                        </button>
                      </div>
                    </div>

                    <Controller
                      name={`internshipJourney.${index}.title`}
                      control={control}
                      rules={{
                        required: "Section title is required",
                        validate: (v) =>
                          (typeof v === "string" && v.trim().length > 0) ||
                          "Section title is required",
                      }}
                      render={({ field: f }) => (
                        <Input
                          {...f}
                          label="Section title"
                          placeholder="e.g. Week 1-2: Orientation & Training"
                          error={
                            errors.internshipJourney?.[index]?.title
                              ?.message as string | undefined
                          }
                          required
                          className="w-full"
                        />
                      )}
                    />

                    <JourneyItemsField
                      sectionIndex={index}
                      control={control}
                      errors={errors}
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
            append(defaultJourneySection());
            setExpandedSections((prev) => new Set(prev).add(newIndex));
          }}
        >
          <PlusIcon className="size-4" />
          Add Journey Section
        </WhiteButton>
      </div>
    </Container>
  );
};

// Nested component for managing items within each journey section
const JourneyItemsField = ({ sectionIndex, control, errors }: any) => {
  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control,
    name: `internshipJourney.${sectionIndex}.items`,
  });

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-gray-700">
        Journey Items <span className="text-red-500">*</span>
      </label>
      <p className="text-xs text-gray-600">
        Add key activities, milestones, or learning objectives for this phase.
      </p>

      <div className="flex flex-col gap-2">
        {itemFields.map((itemField, itemIndex) => (
          <div key={itemField.id} className="flex items-start gap-2">
            <div className="flex-1">
              <Controller
                name={`internshipJourney.${sectionIndex}.items.${itemIndex}`}
                control={control}
                rules={{
                  required: "Item is required",
                  validate: (v) =>
                    (typeof v === "string" && v.trim().length > 0) ||
                    "Item is required",
                }}
                render={({ field: f }) => (
                  <div className="flex flex-col gap-1">
                    <input
                      {...f}
                      type="text"
                      placeholder={`Item ${itemIndex + 1}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                    {errors.internshipJourney?.[sectionIndex]?.items?.[
                      itemIndex
                    ] && (
                      <p className="text-red-500 text-xs">
                        {
                          errors.internshipJourney[sectionIndex]?.items[
                            itemIndex
                          ]?.message as string
                        }
                      </p>
                    )}
                  </div>
                )}
              />
            </div>
            <button
              type="button"
              onClick={() => removeItem(itemIndex)}
              className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
              aria-label="Remove item"
              disabled={itemFields.length === 1}
            >
              <Trash2Icon className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <WhiteButton
        type="button"
        glow={false}
        className="w-fit flex items-center gap-2 text-xs"
        onClick={() => appendItem("")}
      >
        <PlusIcon className="size-3" />
        Add Item
      </WhiteButton>
    </div>
  );
};

export default Screen7;
