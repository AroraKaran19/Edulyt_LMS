"use client";
import Container from "@/app/admin/components/ui/Container";
import { EditorHandle } from "@/components/shared/Editor/Editor";
import { FlexBox } from "@/components/ui";
import DropDown from "@/components/ui/dropdown/DropDown";
import TagInput from "@/components/ui/inputs/TagInput";
import { useFormContext } from "react-hook-form";
import { Controller } from "react-hook-form";
import { CourseFormData } from "@/types/courseForm";
import { getTextFromHtml } from "@/utils/courseFormUtils";
import dynamic from "next/dynamic";
import React, { ChangeEvent, useRef, useEffect, useState } from "react";

const RichTextEditor = dynamic(
  () => import("@/components/shared/Editor/Editor"),
  { ssr: false }
);

const Screen2 = () => {
  const [isMounted, setIsMounted] = useState(false);
  const whatYouWillLearnEditorRef = useRef<EditorHandle | null>(null);
  const whoShouldJoinEditorRef = useRef<EditorHandle | null>(null);
  
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
  const whatYouWillLearnValue = watch("whatYouWillLearn");
  const whoShouldJoinValue = watch("whoShouldJoin");

  // Sync editor content with form values
  useEffect(() => {
    if (whatYouWillLearnEditorRef.current && whatYouWillLearnValue) {
      whatYouWillLearnEditorRef.current.setHTML(whatYouWillLearnValue);
    }
  }, [whatYouWillLearnValue]);

  useEffect(() => {
    if (whoShouldJoinEditorRef.current && whoShouldJoinValue) {
      whoShouldJoinEditorRef.current.setHTML(whoShouldJoinValue);
    }
  }, [whoShouldJoinValue]);

  // Handle editor content changes
  const handleWhatYouWillLearnChange = (html: string) => {
    setValue("whatYouWillLearn", html);
  };

  const handleWhoShouldJoinChange = (html: string) => {
    setValue("whoShouldJoin", html);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return (
      <Container
        title="Learning Information (Screen 2)"
        description="Define what students will learn and course requirements"
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
      title="Learning Information (Screen 2)"
      description="Define what students will learn and course requirements"
      className="h-full w-full"
      classNameBody="flex flex-col gap-4"
    >
      <Container
        description="Define what students will achieve after completing this course"
        className="w-full shadow-none border-none pb-0"
        classNameBody="flex flex-col gap-4 overflow-y-visible"
      >
        <div>
          <RichTextEditor
            title="What You Will Learn"
            required
            ref={whatYouWillLearnEditorRef}
            rows={4}
            minLength={25}
            maxLength={1000}
            showWordCount={true}
            className="w-full max-w-full"
            initialHtml={whatYouWillLearnValue || ""}
            error={errors.whatYouWillLearn?.message}
            onChange={handleWhatYouWillLearnChange}
          />
          <input
            type="hidden"
            {...control.register("whatYouWillLearn", {
              required: "What you will learn is required",
              validate: (value) => {
                if (!value) return "What you will learn is required";
                const textContent = getTextFromHtml(value);
                
                if (textContent.length < 25) {
                  return "What you will learn must be at least 25 characters";
                }
                if (textContent.length > 1000) {
                  return "What you will learn must be less than 1000 characters";
                }
                return true;
              },
            })}
          />
        </div>
        <Controller
          name="skills"
          control={control}
          rules={{ required: "At least one skill is required" }}
          render={({ field }) => (
            <TagInput
              label="Skills Students Will Acquire"
              placeholder="Enter skills students will acquire after completing this course"
              tags={field.value || []}
              onChange={field.onChange}
              countLabel="skills"
              required={true}
              error={errors.skills?.message}
            />
          )}
        />
        <Controller
          name="careerPaths"
          control={control}
          rules={{ required: "At least one career path is required" }}
          render={({ field }) => (
            <TagInput
              label="Career Paths"
              placeholder="Add career opportunities (e.g., Frontend Developer, Full Stack Developer, Software Engineer)"
              tags={field.value || []}
              onChange={field.onChange}
              maxTags={5}
              countLabel="career paths"
              required={true}
              error={errors.careerPaths?.message}
            />
          )}
        />
        <FlexBox className="gap-4">
          <Controller
            name="skillLevel"
            control={control}
            rules={{ required: "Skill level is required" }}
            render={({ field }) => (
              <DropDown
                {...field}
                label="Skill Level"
                options={["Beginner", "Intermediate", "Advanced"]}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  field.onChange(e.target.value)
                }
                error={errors.skillLevel?.message}
                required={true}
              />
            )}
          />
          <Controller
            name="duration"
            control={control}
            rules={{ required: "Course duration is required" }}
            render={({ field }) => (
              <DropDown
                {...field}
                label="Course Duration"
                options={["1 Month", "2 Months", "3 Months", "4 Months", "5 Months", "6 Months", "7 Months", "8 Months", "9 Months", "10 Months", "11 Months", "12 Months"]}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  field.onChange(e.target.value)
                }
                error={errors.duration?.message}
                required={true}
              />
            )}
          />
        </FlexBox>
        <div>
          <RichTextEditor
            title="Who Should Join This Course"
            required
            ref={whoShouldJoinEditorRef}
            rows={3}
            minLength={25}
            maxLength={500}
            showWordCount={true}
            className="w-full max-w-full"
            initialHtml={whoShouldJoinValue || ""}
            error={errors.whoShouldJoin?.message}
            onChange={handleWhoShouldJoinChange}
          />
          <input
            type="hidden"
            {...control.register("whoShouldJoin", {
              required: "Who should join this course is required",
              validate: (value) => {
                if (!value) return "Who should join this course is required";
                const textContent = getTextFromHtml(value);
                
                if (textContent.length < 25) {
                  return "Who should join this course must be at least 25 characters";
                }
                if (textContent.length > 500) {
                  return "Who should join this course must be less than 500 characters";
                }
                return true;
              },
            })}
          />
        </div>
        <Controller
          name="prerequisites"
          control={control}
          render={({ field }) => (
            <TagInput
              label="Prerequisites (Optional)"
              placeholder="Enter prerequisites for this course"
              tags={field.value || []}
              onChange={field.onChange}
              countLabel="prerequisites"
              required={false}
              error={errors.prerequisites?.message}
            />
          )}
        />
        <Controller
          name="tags"
          control={control}
          render={({ field }) => (
            <TagInput
              label="Course Tags (Optional)"
              placeholder="Enter course tags"
              tags={field.value || []}
              onChange={field.onChange}
              countLabel="course tags"
              required={false}
              error={errors.tags?.message}
            />
          )}
        />
      </Container>
    </Container>
  );
};

export default Screen2;
