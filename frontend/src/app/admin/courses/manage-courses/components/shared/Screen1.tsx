"use client";
import Container from "@/app/admin/components/ui/Container";
import { EditorHandle } from "@/components/shared/Editor/Editor";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import DropDown from "@/components/ui/dropdown/DropDown";
import CategoryInputWithManagement from "@/components/ui/inputs/CategoryInputWithManagement";
import BrandSelect from "@/components/admin/BrandSelect";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";
import Input from "@/components/ui/inputs/Input";
import { useUpload } from "@/hooks/useUpload";
import { useFormContext } from "react-hook-form";
import { Controller } from "react-hook-form";
import { CourseFormData } from "@/types/courseForm";
import dynamic from "next/dynamic";
import { ChangeEvent, useRef, useEffect, useState } from "react";
import { getTextFromHtml, getCategoryIds } from "@/lib/courseFormUtils";
import {
  AUDIENCE_BY_BRAND,
  AUDIENCE_LABEL,
  BRAND_LABEL,
  audienceMatchesBrand,
  isBrand,
} from "@/constants/brands";

const RichTextEditor = dynamic(
  () => import("@/components/shared/Editor/Editor"),
  { ssr: false }
);

const Screen1 = () => {
  const [isMounted, setIsMounted] = useState(false);
  const descriptionEditorRef = useRef<EditorHandle | null>(null);
  const shortDescriptionEditorRef = useRef<EditorHandle | null>(null);
  const {
    control,
    formState: { errors },
    setValue,
    getValues,
    watch,
  } = useFormContext<CourseFormData>();
  // Ensure component is mounted on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const { uploadFile, deleteFile, isUploading, error: uploadError } = useUpload();

  // Watch form values
  const descriptionValue = watch("description");
  const shortDescriptionValue = watch("shortDescription");
  const categoryNamesValue = watch("categoryNames");
  const curriculumValue = watch("curriculum");
  const curriculumS3Key = watch("curriculumS3Key");
  const curriculumSource = watch("curriculumSource");
  const brochureValue = watch("brochure");
  const brochureS3Key = watch("brochureS3Key");
  const brochureSource = watch("brochureSource");
  const titleValue = watch("title");
  const brandValue = watch("brand");
  const audienceValue = watch("audience");
  const isActiveValue = watch("isActive");

  // A mismatched pair is allowed as a draft, so only an active course warns.
  const liveAudienceWarning =
    isBrand(brandValue) && !audienceMatchesBrand(audienceValue, brandValue)
      ? `A live ${BRAND_LABEL[brandValue]} course must target ${
          AUDIENCE_LABEL[AUDIENCE_BY_BRAND[brandValue]]
        }. Change the audience or leave the course inactive.`
      : null;

  const [curriculumFolderName, setCurriculumFolderName] = useState(
    "courses/new_course/curriculum"
  );
  const [brochureFolderName, setBrochureFolderName] = useState(
    "courses/new_course/brochure"
  );

  useEffect(() => {
    if (titleValue) {
      const baseFolder = titleValue.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      setCurriculumFolderName(`courses/${baseFolder}/curriculum`);
      setBrochureFolderName(`courses/${baseFolder}/brochure`);
    }
  }, [titleValue]);

  // Sync editor content with form values
  useEffect(() => {
    if (descriptionEditorRef.current && descriptionValue) {
      descriptionEditorRef.current.setHTML(descriptionValue);
    }
  }, [descriptionValue]);

  useEffect(() => {
    if (shortDescriptionEditorRef.current && shortDescriptionValue) {
      shortDescriptionEditorRef.current.setHTML(shortDescriptionValue);
    }
  }, [shortDescriptionValue]);

  // Handle editor content changes
  const handleDescriptionChange = (html: string) => {
    setValue("description", html);
  };

  const handleShortDescriptionChange = (html: string) => {
    setValue("shortDescription", html);
  };

  // Handle curriculum upload
  const handleCurriculumUpload = async (file: File, folderName: string) => {
    try {
      const result = await uploadFile(file, folderName);
      if (result.success && result.data) {
        setValue("curriculum", result.data.url, {
          shouldDirty: true,
          shouldTouch: true,
        });
        setValue("curriculumS3Key", result.data.s3Key, {
          shouldDirty: true,
          shouldTouch: true,
        });
        setValue("curriculumSource", "upload", {
          shouldDirty: true,
          shouldTouch: true,
        });
        return result.data.url;
      }
      throw new Error(result.error || "Upload failed");
    } catch (error) {
      console.error("Failed to upload curriculum:", error);
      // Set form error for curriculum field
      setValue("curriculum", "", { shouldDirty: true, shouldTouch: true });
      setValue("curriculumS3Key", "", { shouldDirty: true, shouldTouch: true });
      setValue("curriculumSource", "url", {
        shouldDirty: true,
        shouldTouch: true,
      });
      throw error;
    }
  };

  // Handle brochure upload
  const handleBrochureUpload = async (file: File, folderName: string) => {
    try {
      const result = await uploadFile(file, folderName);
      if (result.success && result.data) {
        setValue("brochure", result.data.url, {
          shouldDirty: true,
          shouldTouch: true,
        });
        setValue("brochureS3Key", result.data.s3Key, {
          shouldDirty: true,
          shouldTouch: true,
        });
        setValue("brochureSource", "upload", {
          shouldDirty: true,
          shouldTouch: true,
        });
        return result.data.url;
      }
      throw new Error(result.error || "Upload failed");
    } catch (error) {
      console.error("Failed to upload brochure:", error);
      // Set form error for brochure field
      setValue("brochure", "", { shouldDirty: true, shouldTouch: true });
      setValue("brochureS3Key", "", { shouldDirty: true, shouldTouch: true });
      setValue("brochureSource", "url", {
        shouldDirty: true,
        shouldTouch: true,
      });
      throw error;
    }
  };

  // Handle URL input changes
  const handleCurriculumUrlChange = async (url: string) => {
    // If there's an existing uploaded file (s3Key exists and source is upload), delete it from S3
    if (curriculumS3Key && curriculumSource === "upload") {
      try {
        await deleteFile(curriculumS3Key);
      } catch (error) {
        console.error("Failed to delete old curriculum file from S3:", error);
      }
    }
    
    setValue("curriculum", url, { shouldDirty: true, shouldTouch: true });
    setValue("curriculumSource", "url", {
      shouldDirty: true,
      shouldTouch: true,
    });
    setValue("curriculumS3Key", "", { shouldDirty: true, shouldTouch: true });
  };

  const handleBrochureUrlChange = async (url: string) => {
    // If there's an existing uploaded file (s3Key exists and source is upload), delete it from S3
    if (brochureS3Key && brochureSource === "upload") {
      try {
        await deleteFile(brochureS3Key);
      } catch (error) {
        console.error("Failed to delete old brochure file from S3:", error);
      }
    }
    
    setValue("brochure", url, { shouldDirty: true, shouldTouch: true });
    setValue("brochureSource", "url", { shouldDirty: true, shouldTouch: true });
    setValue("brochureS3Key", "", { shouldDirty: true, shouldTouch: true });
  };

  // Handle file removal
  const handleCurriculumRemove = () => {
    setValue("curriculum", "", { shouldDirty: true, shouldTouch: true });
    setValue("curriculumS3Key", "", { shouldDirty: true, shouldTouch: true });
    setValue("curriculumSource", "url", {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleBrochureRemove = () => {
    setValue("brochure", "", { shouldDirty: true, shouldTouch: true });
    setValue("brochureS3Key", "", { shouldDirty: true, shouldTouch: true });
    setValue("brochureSource", "url", { shouldDirty: true, shouldTouch: true });
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return (
      <Container
        title="Basic Information (Screen 1)"
        description="Define the core details of your course"
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
      title="Basic Information (Screen 1)"
      description="Define the core details of your course"
      className="h-full w-full"
      classNameBody="flex flex-col gap-4"
    >
      <Container
        description="Configure course visibility and features"
        className="w-full shadow-none border-none pb-0"
        classNameBody="flex gap-4 justify-between h-fit overflow-y-visible"
      >
        <Controller
          name="isActive"
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <CheckBoxContainer
              label="Course Active"
              checked={field.value || false}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          name="isFeatured"
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <CheckBoxContainer
              label="Featured Course"
              checked={field.value || false}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          name="isCertified"
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <CheckBoxContainer
              label="Certified Course"
              checked={field.value || false}
              onChange={field.onChange}
            />
          )}
        />
      </Container>
      {liveAudienceWarning && (
        <p
          className={`text-sm px-6 ${
            isActiveValue ? "text-red-500" : "text-amber-600"
          }`}
        >
          {liveAudienceWarning}
        </p>
      )}
      <Container
        description="Define the core details of your course"
        className="w-full shadow-none border-none pt-0"
        classNameBody="flex flex-col gap-6 pb-4 overflow-y-visible"
      >
        <Controller
          name="title"
          control={control}
          rules={{
            required: "Course title is required",
            minLength: {
              value: 5,
              message: "Title must be at least 5 characters",
            },
            maxLength: {
              value: 100,
              message: "Title must be less than 100 characters",
            },
          }}
          render={({ field }) => (
            <Input
              {...field}
              label="Course Name"
              placeholder="Enter the name of your course"
              error={errors.title?.message}
              required={true}
            />
          )}
        />
        <Controller
          name="brand"
          control={control}
          rules={{ required: "Choose the brand this course is sold on" }}
          render={({ field }) => (
            <BrandSelect
              label="Brand"
              required
              placeholder="Choose a brand"
              value={field.value ?? ""}
              onChange={(next) => {
                if (next === "all" || next === field.value) return;
                field.onChange(next);
                // Categories belong to one brand, so a switch clears them.
                setValue("category", [], { shouldValidate: true });
                setValue("categoryNames", {});
              }}
            />
          )}
        />
        {errors.brand?.message && (
          <p className="text-red-500 text-sm mt-1">{errors.brand.message}</p>
        )}
        <div className="flex gap-4">
          <Controller
            name="category"
            control={control}
            rules={{
              required: "At least one category is required",
              validate: (value) => {
                if (!Array.isArray(value) || value.length === 0) {
                  return "At least one category is required";
                }
                return true;
              },
            }}
            render={({ field }) => (
              <CategoryInputWithManagement
                value={getCategoryIds(field.value)}
                label="Course Category"
                name="courseCategory"
                className="w-full max-w-full"
                setChange={field.onChange}
                required={true}
                brand={brandValue}
                initialCategoryNames={categoryNamesValue}
                onCategoryNameAdded={(id, name) => {
                  const current = getValues("categoryNames") || {};
                  setValue("categoryNames", { ...current, [id]: name });
                }}
              />
            )}
          />
          {errors.category?.message && (
            <p className="text-red-500 text-sm mt-1">
              {errors.category.message}
            </p>
          )}
          <Controller
            name="audience"
            control={control}
            rules={{ required: "Target audience is required" }}
            render={({ field }) => (
              <DropDown
                {...field}
                label="Target Audience"
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  field.onChange(e.target.value)
                }
                options={["college-students", "professionals"]}
                optionLabels={{
                  "college-students": "College Students",
                  professionals: "Working Professionals",
                }}
                error={errors.audience?.message}
                required={true}
              />
            )}
          />
          <Controller
            name="language"
            control={control}
            rules={{ required: "Language is required" }}
            render={({ field }) => (
              <DropDown
                {...field}
                label="Course Language"
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  field.onChange(e.target.value)
                }
                options={["English", "Hindi"]}
                error={errors.language?.message}
                required={true}
              />
            )}
          />
        </div>
        <div>
          <RichTextEditor
            title="Course Description"
            required
            ref={descriptionEditorRef}
            rows={6}
            showWordCount={true}
            className="w-full max-w-full"
            initialHtml={descriptionValue || ""}
            error={errors.description?.message}
            onChange={handleDescriptionChange}
          />
          <input
            type="hidden"
            {...control.register("description", {
              required: "Course description is required",
            })}
          />
        </div>
        <div>
          <RichTextEditor
            title="Short Description (Required)"
            ref={shortDescriptionEditorRef}
            rows={2}
            showWordCount={true}
            className="w-full max-w-full"
            initialHtml={shortDescriptionValue || ""}
            error={errors.shortDescription?.message}
            onChange={handleShortDescriptionChange}
            required={true}
          />
          <input
            type="hidden"
            {...control.register("shortDescription", {
              required: "Short description is required",
            })}
          />
        </div>
        <Controller
          name="curriculum"
          control={control}
          defaultValue=""
          rules={{
            validate: (value) => {
              if (
                value &&
                typeof value === "string" &&
                value.startsWith("http")
              ) {
                try {
                  new URL(value);
                  return true;
                } catch {
                  return "Please enter a valid URL";
                }
              }
              return true;
            },
          }}
          render={() => (
            <UploadMediaContainer
              title="Course Curriculum (Optional)"
              description="Upload the curriculum of your course (optional)"
              type="document"
              folderName={curriculumFolderName}
              mediaUrl={curriculumValue}
              mediaSource={curriculumSource}
              s3Key={curriculumS3Key}
              onFileUpload={handleCurriculumUpload}
              onFileRemove={handleCurriculumRemove}
              onUrlSubmit={handleCurriculumUrlChange}
              allowUrlInput
              maxSize={15} // 15MB
              acceptedFormats={[".pdf", ".doc", ".docx"]}
              error={errors.curriculum?.message || uploadError}
              isUploading={isUploading}
            />
          )}
        />
        <Controller
          name="brochure"
          control={control}
          defaultValue=""
          rules={{
            validate: (value) => {
              if (
                value &&
                typeof value === "string" &&
                value.startsWith("http")
              ) {
                try {
                  new URL(value);
                  return true;
                } catch {
                  return "Please enter a valid URL";
                }
              }
              return true;
            },
          }}
          render={() => (
            <UploadMediaContainer
              title="Course Brochure (Optional)"
              description="Upload the brochure of your course (optional)"
              type="document"
              folderName={brochureFolderName}
              mediaUrl={brochureValue}
              mediaSource={brochureSource}
              s3Key={brochureS3Key}
              onFileUpload={handleBrochureUpload}
              onFileRemove={handleBrochureRemove}
              onUrlSubmit={handleBrochureUrlChange}
              allowUrlInput
              maxSize={15} // 15MB
              acceptedFormats={[".pdf", ".doc", ".docx"]}
              error={errors.brochure?.message || uploadError}
              isUploading={isUploading}
            />
          )}
        />
      </Container>
    </Container>
  );
};

export default Screen1;
