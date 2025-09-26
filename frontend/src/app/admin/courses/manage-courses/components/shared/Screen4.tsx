"use client";
import Container from "@/app/admin/components/ui/Container";
import { FlexBox, OrangeButton } from "@/components/ui";
import Input from "@/components/ui/inputs/Input";
import TagInput from "@/components/ui/inputs/TagInput";
import { Course } from "@/types";
import { StarIcon, PlusIcon, TrashIcon } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Controller } from "react-hook-form";
import { CourseFormData } from "@/types/courseForm";

const Screen4 = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [highlights, setHighlights] = useState<Course["highlights"]>([]);
  
  const {
    control,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<CourseFormData>();

  // Ensure component is mounted on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Watch form values
  const highlightsValue = watch("highlights") || [];
  const featuresValue = watch("features") || [];

  // Sync highlights with form data
  useEffect(() => {
    if (isMounted && highlightsValue.length > 0) {
      setHighlights(highlightsValue);
    }
  }, [highlightsValue, isMounted]);

  // Add a new highlight
  const addHighlight = () => {
    const newHighlights = [...highlights, { title: "", description: "" }];
    setHighlights(newHighlights);
    setValue("highlights", newHighlights, { shouldDirty: true, shouldTouch: true });
  };

  // Update a highlight
  const updateHighlight = (
    index: number,
    field: "title" | "description",
    value: string
  ) => {
    const updatedHighlights = highlights.map((highlight, i) =>
      i === index ? { ...highlight, [field]: value } : highlight
    );
    setHighlights(updatedHighlights);
    setValue("highlights", updatedHighlights, { shouldDirty: true, shouldTouch: true });
  };

  // Remove a highlight
  const removeHighlight = (index: number) => {
    const updatedHighlights = highlights.filter((_, i) => i !== index);
    setHighlights(updatedHighlights);
    setValue("highlights", updatedHighlights, { shouldDirty: true, shouldTouch: true });
  };

  if (!isMounted) {
    return (
      <Container
        title="Highlights & Features"
        description="Define key selling points and features that make your course stand out"
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
      title="Highlights & Features"
      description="Define key selling points and features that make your course stand out"
      className="h-full w-full"
      classNameBody="flex flex-col gap-4"
    >
      <Container
        description="Add compelling highlights that showcase the value of your course"
        className="h-full w-full border-none shadow-none pb-0 relative"
      >
        <div className="absolute right-0 top-0 z-[9999]">
          <button
            onClick={addHighlight}
            className="w-fit p-3 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition-all duration-200 cursor-pointer"
            title="Add highlight"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
        <FlexBox className="w-full h-full flex-col gap-4 max-h-[350px] overflow-y-auto">
          {highlights.length > 0 ? (
            <FlexBox className="w-full flex-col gap-6">
              {highlights.map((highlight, index) => (
                <FlexBox
                  key={index}
                  className="w-full flex-col gap-4 p-6 border border-gray-200 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md transition-all duration-200 group"
                >
                  <FlexBox className="w-full justify-between items-start">
                    <FlexBox className="items-center gap-3">
                      <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <h4 className="text-base font-semibold text-gray-800">
                        Highlight {index + 1}
                      </h4>
                    </FlexBox>
                    <button
                      onClick={() => removeHighlight(index)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                      title="Remove highlight"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </FlexBox>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Input
                        label="Title"
                        placeholder="Enter highlight title..."
                        value={highlight.title}
                        setChange={(value) =>
                          updateHighlight(index, "title", value)
                        }
                        maxLength={100}
                        showCharacterCount
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Input
                        label="Description"
                        placeholder="Enter highlight description..."
                        value={highlight.description}
                        setChange={(value) =>
                          updateHighlight(index, "description", value)
                        }
                        maxLength={200}
                        showCharacterCount
                        className="bg-white"
                      />
                    </div>
                  </div>
                </FlexBox>
              ))}
            </FlexBox>
          ) : (
            <FlexBox className="w-full flex-col items-center justify-center py-16 px-4 text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center shadow-lg">
                  <StarIcon className="w-10 h-10 text-orange-500" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                  <PlusIcon className="w-3 h-3 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                No highlights added yet
              </h3>
              <p className="text-gray-600 text-base mb-8 max-w-lg leading-relaxed">
                Add compelling highlights and features that showcase the unique
                value of your course to attract more students.
              </p>
              <OrangeButton
                onClick={addHighlight}
                className="flex items-center gap-3 px-8 py-4 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <PlusIcon className="w-5 h-5" />
                Add First Highlight
              </OrangeButton>
            </FlexBox>
          )}
        </FlexBox>
      </Container>
      <Container
        description="List the key features and benefits that come with your course"
        className="h-full w-full border-none shadow-none pb-0 relative"
      >
        <Controller
          name="features"
          control={control}
          rules={{ required: "At least one feature is required" }}
          render={({ field }) => (
            <TagInput
              label="Course Features"
              placeholder="Add features (e.g., Lifetime Access, Certificate of Completion, Mobile App Access, 24/7 Support)"
              tags={field.value || []}
              onChange={field.onChange}
              countLabel="features"
              required={true}
              error={errors.features?.message}
            />
          )}
        />
      </Container>
    </Container>
  );
};

export default Screen4;
