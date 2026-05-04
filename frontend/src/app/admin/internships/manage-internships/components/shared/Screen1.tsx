"use client";
import Container from "@/app/admin/components/ui/Container";
import { EditorHandle } from "@/components/shared/Editor/Editor";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import DropDown from "@/components/ui/dropdown/DropDown";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";
import Input from "@/components/ui/inputs/Input";
import { useUpload } from "@/hooks/useUpload";
import { useFormContext } from "react-hook-form";
import { Controller } from "react-hook-form";
import { InternshipFormData } from "@/types/internshipForm";
import { stripHtmlForValidation, isValidHttpUrl } from "@/lib/internshipScreenValidation";
import dynamic from "next/dynamic";
import { ChangeEvent, useRef, useEffect, useState, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import WhiteButton from "@/components/ui/buttons/WhiteButton";

const RichTextEditor = dynamic(
  () => import("@/components/shared/Editor/Editor"),
  { ssr: false },
);

/**
 * IST (UTC+5:30) helpers for the documentation window pickers.
 * The HTML `datetime-local` input is timezone-naive — we treat it as IST.
 */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function istLocalToIso(istLocal: string): string {
  if (!istLocal?.trim()) return "";
  const [d, t] = istLocal.split("T");
  if (!d || !t) return "";
  const [y, mo, da] = d.split("-").map(Number);
  const [h, mi] = t.split(":").map(Number);
  if ([y, mo, da, h, mi].some((n) => Number.isNaN(n))) return "";
  const utcMs = Date.UTC(y, mo - 1, da, h, mi, 0, 0) - IST_OFFSET_MS;
  return new Date(utcMs).toISOString();
}

function isoToIstLocal(iso: string | undefined): string {
  const v = (iso ?? "").trim();
  if (!v) return "";
  const t = new Date(v);
  if (Number.isNaN(t.getTime())) return "";
  const ist = new Date(t.getTime() + IST_OFFSET_MS);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${ist.getUTCFullYear()}-${p(ist.getUTCMonth() + 1)}-${p(ist.getUTCDate())}T${p(ist.getUTCHours())}:${p(ist.getUTCMinutes())}`;
}

const Screen1 = () => {
  const [isMounted, setIsMounted] = useState(false);
  const descriptionEditorRef = useRef<EditorHandle | null>(null);
  const {
    control,
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<InternshipFormData>();
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const {
    uploadCourseThumbnail,
    uploadFile,
    deleteFile,
    isUploading,
    error: uploadError,
  } = useUpload();

  const descriptionValue = watch("description");
  const thumbnailValue = watch("thumbnail");
  const thumbnailS3Key = watch("thumbnailS3Key");
  const thumbnailSource = watch("thumbnailSource");
  const brochureValue = watch("brochure");
  const brochureS3Key = watch("brochureS3Key");
  const brochureSource = watch("brochureSource");
  const jobDescriptionValue = watch("jobDescription");
  const jobDescriptionS3Key = watch("jobDescriptionS3Key");
  const jobDescriptionSource = watch("jobDescriptionSource");
  const titleValue = watch("title");
  const headerList = watch("headerList") ?? [];

  const addHeaderLine = useCallback(() => {
    setValue("headerList", [...headerList, ""], {
      shouldDirty: true,
      shouldTouch: true,
    });
  }, [headerList, setValue]);

  const removeHeaderLine = useCallback(
    (index: number) => {
      setValue(
        "headerList",
        headerList.filter((_, i) => i !== index),
        { shouldDirty: true, shouldTouch: true },
      );
    },
    [headerList, setValue],
  );

  const [thumbnailFolderName, setThumbnailFolderName] = useState(
    "internships/new_internship/thumbnail",
  );
  const [brochureFolderName, setBrochureFolderName] = useState(
    "internships/new_internship/brochure",
  );
  const [jobDescriptionFolderName, setJobDescriptionFolderName] = useState(
    "internships/new_internship/job_description",
  );

  useEffect(() => {
    if (titleValue) {
      const baseFolder = titleValue.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      setThumbnailFolderName(`internships/${baseFolder}/thumbnail`);
      setBrochureFolderName(`internships/${baseFolder}/brochure`);
      setJobDescriptionFolderName(`internships/${baseFolder}/job_description`);
    }
  }, [titleValue]);

  useEffect(() => {
    if (descriptionEditorRef.current && descriptionValue) {
      descriptionEditorRef.current.setHTML(descriptionValue);
    }
  }, [descriptionValue]);

  const handleThumbnailUpload = async (file: File, folderName: string) => {
    try {
      const result = await uploadCourseThumbnail(file, folderName);
      if (result.success && result.data) {
        setValue("thumbnail", result.data.url, {
          shouldDirty: true,
          shouldTouch: true,
        });
        setValue("thumbnailS3Key", result.data.s3Key, {
          shouldDirty: true,
          shouldTouch: true,
        });
        setValue("thumbnailSource", "upload", {
          shouldDirty: true,
          shouldTouch: true,
        });
        return result.data.url;
      }
      throw new Error(result.error || "Upload failed");
    } catch (error) {
      console.error("Failed to upload thumbnail:", error);
      setValue("thumbnail", "", { shouldDirty: true, shouldTouch: true });
      setValue("thumbnailS3Key", "", { shouldDirty: true, shouldTouch: true });
      setValue("thumbnailSource", "url", {
        shouldDirty: true,
        shouldTouch: true,
      });
      throw error;
    }
  };

  const handleThumbnailUrlChange = async (url: string) => {
    if (thumbnailS3Key && thumbnailSource === "upload") {
      try {
        await deleteFile(thumbnailS3Key);
      } catch (error) {
        console.error("Failed to delete old thumbnail from S3:", error);
      }
    }

    setValue("thumbnail", url, { shouldDirty: true, shouldTouch: true });
    setValue("thumbnailSource", "url", {
      shouldDirty: true,
      shouldTouch: true,
    });
    setValue("thumbnailS3Key", "", { shouldDirty: true, shouldTouch: true });
  };

  const handleThumbnailRemove = () => {
    setValue("thumbnail", "", { shouldDirty: true, shouldTouch: true });
    setValue("thumbnailS3Key", "", { shouldDirty: true, shouldTouch: true });
    setValue("thumbnailSource", "url", {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

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
      setValue("brochure", "", { shouldDirty: true, shouldTouch: true });
      setValue("brochureS3Key", "", { shouldDirty: true, shouldTouch: true });
      setValue("brochureSource", "url", {
        shouldDirty: true,
        shouldTouch: true,
      });
      throw error;
    }
  };

  const handleBrochureUrlChange = async (url: string) => {
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

  const handleBrochureRemove = () => {
    setValue("brochure", "", { shouldDirty: true, shouldTouch: true });
    setValue("brochureS3Key", "", { shouldDirty: true, shouldTouch: true });
    setValue("brochureSource", "url", { shouldDirty: true, shouldTouch: true });
  };

  const handleJobDescriptionUpload = async (file: File, folderName: string) => {
    try {
      const result = await uploadFile(file, folderName);
      if (result.success && result.data) {
        setValue("jobDescription", result.data.url, {
          shouldDirty: true,
          shouldTouch: true,
        });
        setValue("jobDescriptionS3Key", result.data.s3Key, {
          shouldDirty: true,
          shouldTouch: true,
        });
        setValue("jobDescriptionSource", "upload", {
          shouldDirty: true,
          shouldTouch: true,
        });
        return result.data.url;
      }
      throw new Error(result.error || "Upload failed");
    } catch (error) {
      console.error("Failed to upload job description:", error);
      setValue("jobDescription", "", { shouldDirty: true, shouldTouch: true });
      setValue("jobDescriptionS3Key", "", { shouldDirty: true, shouldTouch: true });
      setValue("jobDescriptionSource", "url", {
        shouldDirty: true,
        shouldTouch: true,
      });
      throw error;
    }
  };

  const handleJobDescriptionUrlChange = async (url: string) => {
    if (jobDescriptionS3Key && jobDescriptionSource === "upload") {
      try {
        await deleteFile(jobDescriptionS3Key);
      } catch (error) {
        console.error("Failed to delete old job description file from S3:", error);
      }
    }

    setValue("jobDescription", url, { shouldDirty: true, shouldTouch: true });
    setValue("jobDescriptionSource", "url", { shouldDirty: true, shouldTouch: true });
    setValue("jobDescriptionS3Key", "", { shouldDirty: true, shouldTouch: true });
  };

  const handleJobDescriptionRemove = () => {
    setValue("jobDescription", "", { shouldDirty: true, shouldTouch: true });
    setValue("jobDescriptionS3Key", "", { shouldDirty: true, shouldTouch: true });
    setValue("jobDescriptionSource", "url", { shouldDirty: true, shouldTouch: true });
  };

  if (!isMounted) {
    return (
      <Container
        title="Basic Information (Screen 1)"
        description="Define the core details of your internship"
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
      description="Define the core details of your internship"
      className="h-full w-full"
      classNameBody="flex flex-col gap-4"
    >
      <Container
        description="Configure internship visibility and features"
        className="w-full shadow-none border-none pb-0"
        classNameBody="flex gap-4 justify-between h-fit overflow-y-visible"
      >
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <CheckBoxContainer
              label="Internship Active"
              checked={field.value || false}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          name="certification"
          control={control}
          render={({ field }) => (
            <CheckBoxContainer
              label="Offers certification"
              checked={field.value || false}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          name="featured"
          control={control}
          render={({ field }) => (
            <CheckBoxContainer
              label="Featured internship"
              checked={field.value || false}
              onChange={field.onChange}
            />
          )}
        />
        <div className="flex-1 min-w-px" aria-hidden />
        <input
          type="hidden"
          {...register("slug", {
            validate: (value) => {
              const s = String(value ?? "").trim();
              if (!s) return true;
              if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) {
                return "Use lowercase letters, numbers, and hyphens only";
              }
              return true;
            },
          })}
        />
      </Container>
      {watch("certification") && (
        <Container
          description="Certification exam — success points gate"
          className="w-full shadow-none border-none pb-0"
          classNameBody="flex flex-col gap-2 max-w-lg"
        >
          <Controller
            name="certificationThreshold"
            control={control}
            rules={{
              validate: (v) => {
                const n = typeof v === "number" ? v : Number(v);
                if (Number.isNaN(n) || n < 0)
                  return "Must be 0 or greater";
                return true;
              },
            }}
            render={({ field }) => (
              <Input
                {...field}
                type="number"
                min={0}
                step={1}
                label="Minimum internship success points"
                placeholder="0"
                value={
                  field.value === undefined || field.value === null
                    ? ""
                    : String(field.value)
                }
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    field.onChange(0);
                    return;
                  }
                  const n = parseInt(raw, 10);
                  field.onChange(Number.isNaN(n) ? 0 : n);
                }}
                error={errors.certificationThreshold?.message as string | undefined}
              />
            )}
          />
          <p className="text-xs text-gray-600">
            Total internship success points required before a learner can attempt the
            certification exam. Use 0 for no minimum. Below threshold, learners may top
            up points using your admin success-points price (e.g. ₹1 per point).
          </p>
          <p className="text-xs text-amber-950/85 bg-amber-50/90 border border-amber-200/90 rounded-lg px-3 py-2 mt-2 leading-relaxed">
            Plan certification before marking learners{" "}
            <span className="font-medium">Completed</span>: there is no automatic program close
            date—the cohort stays open until you finish it. After completion, nothing further is
            available on that enrollment.
          </p>
        </Container>
      )}
      <Container
        description="Documentation submission window (post-result Aadhar + photo)"
        className="w-full shadow-none border-none pb-0"
        classNameBody="flex flex-col gap-2 max-w-2xl"
      >
        <p className="text-xs text-gray-600">
          After result announcement, all enrolled learners (merit-approved or
          paid) submit Aadhar &amp; photo within this window. Until they do,
          tasks and the certification exam stay locked. Late submissions are
          accepted and flagged. Both fields use <strong>IST</strong> and are
          required for every internship.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-1">
          <Controller
            name="documentationStartAt"
            control={control}
            rules={{
              validate: (v) => {
                const start = String(v ?? "").trim();
                if (!start) return "Documentation window start is required";
                const end = String(watch("documentationEndAt") ?? "").trim();
                if (end && start && new Date(end) <= new Date(start)) {
                  return "End must be after start";
                }
                return true;
              },
            }}
            render={({ field }) => (
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-sm font-medium text-black">
                  Documentation submission opens (IST)
                </label>
                <input
                  type="datetime-local"
                  value={isoToIstLocal(field.value)}
                  onChange={(e) =>
                    field.onChange(istLocalToIso(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                {errors.documentationStartAt?.message && (
                  <p className="text-xs text-red-600">
                    {errors.documentationStartAt.message as string}
                  </p>
                )}
              </div>
            )}
          />
          <Controller
            name="documentationEndAt"
            control={control}
            rules={{
              validate: (v) => {
                const end = String(v ?? "").trim();
                if (!end) return "Documentation window end is required";
                const start = String(
                  watch("documentationStartAt") ?? "",
                ).trim();
                if (start && new Date(end) <= new Date(start)) {
                  return "End must be after start";
                }
                return true;
              },
            }}
            render={({ field }) => (
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-sm font-medium text-black">
                  Documentation submission closes (IST)
                </label>
                <input
                  type="datetime-local"
                  value={isoToIstLocal(field.value)}
                  onChange={(e) =>
                    field.onChange(istLocalToIso(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                {errors.documentationEndAt?.message && (
                  <p className="text-xs text-red-600">
                    {errors.documentationEndAt.message as string}
                  </p>
                )}
              </div>
            )}
          />
        </div>
      </Container>
      <Container
        description="Define the core details of your internship"
        className="w-full shadow-none border-none pt-0"
        classNameBody="flex flex-col gap-6 pb-4 overflow-y-visible"
      >
        <Controller
          name="title"
          control={control}
          rules={{
            required: "Internship title is required",
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
              label="Internship Name"
              placeholder="Enter the name of your internship"
              error={errors.title?.message}
              required={true}
            />
          )}
        />
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-black">
            Hero highlight lines{" "}
            <span className="font-normal text-gray-500">(optional)</span>
          </p>
          <p className="text-xs text-gray-600">
            Short bullets shown on the public internship hero (e.g. mentor-led
            sessions, industry projects). Up to 200 characters each.
          </p>
          <div className="flex flex-col gap-2">
            {headerList.map((_, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  {...register(`headerList.${index}`, {
                    maxLength: {
                      value: 200,
                      message: "Max 200 characters per line",
                    },
                  })}
                  placeholder="e.g. Mentor-Led Live Sessions"
                  className="flex-1 min-w-0"
                  error={
                    Array.isArray(errors.headerList)
                      ? errors.headerList[index]?.message
                      : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => removeHeaderLine(index)}
                  className="shrink-0 rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 hover:text-red-600 cursor-pointer"
                  aria-label={`Remove highlight line ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <WhiteButton
              type="button"
              onClick={addHeaderLine}
              glow={false}
              className="w-fit flex items-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              Add highlight line
            </WhiteButton>
          </div>
        </div>
        <div className="flex gap-4">
          <Controller
            name="mode"
            control={control}
            rules={{ required: "Mode is required" }}
            render={({ field }) => (
              <DropDown
                {...field}
                label="Mode"
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  field.onChange(e.target.value)
                }
                options={["online", "offline", "hybrid"]}
                optionLabels={{
                  online: "Online",
                  offline: "Offline",
                  hybrid: "Hybrid",
                }}
                error={errors.mode?.message}
                required={true}
                className="w-full max-w-full"
              />
            )}
          />
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
          <div className="w-full max-w-full flex-1 min-w-0" aria-hidden />
        </div>
        <div>
          <Controller
            name="description"
            control={control}
            rules={{
              validate: (value) => {
                const text = stripHtmlForValidation(value || "");
                if (!text) return "Internship description is required";
                if (text.length < 10) {
                  return "Description must be at least 10 characters (plain text)";
                }
                if (text.length > 20000) {
                  return "Description is too long";
                }
                return true;
              },
            }}
            render={({ field }) => (
              <RichTextEditor
                title="Internship Description"
                required
                ref={descriptionEditorRef}
                rows={6}
                showWordCount={true}
                className="w-full max-w-full"
                initialHtml={field.value || ""}
                error={errors.description?.message}
                onChange={(html) => field.onChange(html)}
              />
            )}
          />
        </div>
        <div>
          <Controller
            name="thumbnail"
            control={control}
            defaultValue=""
            rules={{
              required: "Thumbnail is required",
              validate: (value) => {
                if (!value) return "Thumbnail is required";
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
                title="Internship Thumbnail (Required)"
                description="Upload a thumbnail image for your internship listing"
                type="image"
                folderName={thumbnailFolderName}
                mediaUrl={thumbnailValue}
                mediaSource={thumbnailSource}
                s3Key={thumbnailS3Key}
                onFileUpload={handleThumbnailUpload}
                onFileRemove={handleThumbnailRemove}
                onUrlSubmit={handleThumbnailUrlChange}
                allowUrlInput
                maxSize={5}
                acceptedFormats={[".jpg", ".jpeg", ".png", ".webp"]}
                error={errors.thumbnail?.message || uploadError}
                isUploading={isUploading}
                required={true}
              />
            )}
          />
        </div>
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
              title="Internship Brochure (Optional)"
              description="Upload the brochure for your internship (optional)"
              type="document"
              folderName={brochureFolderName}
              mediaUrl={brochureValue}
              mediaSource={brochureSource}
              s3Key={brochureS3Key}
              onFileUpload={handleBrochureUpload}
              onFileRemove={handleBrochureRemove}
              onUrlSubmit={handleBrochureUrlChange}
              allowUrlInput
              maxSize={15}
              acceptedFormats={[".pdf", ".doc", ".docx"]}
              error={errors.brochure?.message || uploadError}
              isUploading={isUploading}
            />
          )}
        />
        <Controller
          name="jobDescription"
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
              title="Job Description (Optional)"
              description="Upload the job description document for your internship (optional)"
              type="document"
              folderName={jobDescriptionFolderName}
              mediaUrl={jobDescriptionValue}
              mediaSource={jobDescriptionSource}
              s3Key={jobDescriptionS3Key}
              onFileUpload={handleJobDescriptionUpload}
              onFileRemove={handleJobDescriptionRemove}
              onUrlSubmit={handleJobDescriptionUrlChange}
              allowUrlInput
              maxSize={15}
              acceptedFormats={[".pdf", ".doc", ".docx"]}
              error={errors.jobDescription?.message || uploadError}
              isUploading={isUploading}
            />
          )}
        />
        <Input
          {...register("whatsappGroupLink", {
            validate: (value) => {
              const s = String(value ?? "").trim();
              if (!s) return true;
              if (!isValidHttpUrl(s)) {
                return "Enter a valid http(s) URL (e.g. chat.whatsapp.com invite link)";
              }
              return true;
            },
          })}
          label="WhatsApp group link (optional)"
          placeholder="https://chat.whatsapp.com/..."
          error={errors.whatsappGroupLink?.message}
        />
      </Container>
    </Container>
  );
};

export default Screen1;
