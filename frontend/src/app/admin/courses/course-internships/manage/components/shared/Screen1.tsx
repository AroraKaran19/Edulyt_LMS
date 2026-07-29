"use client";

import Container from "@/app/admin/components/ui/Container";
import { EditorHandle } from "@/components/shared/Editor/Editor";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import Input from "@/components/ui/inputs/Input";
import { useUpload } from "@/hooks/useUpload";
import { Controller, useFormContext } from "react-hook-form";
import { CourseInternshipFormData } from "@/types/courseInternshipForm";
import dynamic from "next/dynamic";
import { BookOpenIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const RichTextEditor = dynamic(
  () => import("@/components/shared/Editor/Editor"),
  { ssr: false },
);

const Screen1 = () => {
  const [isMounted, setIsMounted] = useState(false);
  const descriptionEditorRef = useRef<EditorHandle | null>(null);

  const {
    control,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<CourseInternshipFormData>();

  const {
    uploadCourseThumbnail,
    deleteFile,
    isUploading,
    error: uploadError,
  } = useUpload();

  const titleValue = watch("title");
  const descriptionValue = watch("description");
  const thumbnailValue = watch("thumbnail");
  const thumbnailSource = watch("thumbnailSource");
  const thumbnailS3Key = watch("thumbnailS3Key");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Push loaded content into the editor once it exists (edit mode).
  useEffect(() => {
    if (descriptionEditorRef.current && descriptionValue) {
      descriptionEditorRef.current.setHTML(descriptionValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  const folderName =
    (titleValue || "course-internship")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "course-internship";

  const handleThumbnailUpload = async (file: File, folder: string) => {
    try {
      const result = await uploadCourseThumbnail(file, folder);
      if (result.success && result.data) {
        setValue("thumbnail", result.data.url, { shouldDirty: true });
        setValue("thumbnailS3Key", result.data.s3Key, { shouldDirty: true });
        setValue("thumbnailSource", "upload", { shouldDirty: true });
        return result.data.url;
      }
      throw new Error(result.error || "Upload failed");
    } catch (error) {
      console.error("Failed to upload thumbnail:", error);
      setValue("thumbnail", "", { shouldDirty: true });
      setValue("thumbnailS3Key", "", { shouldDirty: true });
      throw error;
    }
  };

  const handleThumbnailUrlChange = async (url: string) => {
    // Replacing an upload with a URL orphans the S3 object otherwise.
    if (thumbnailS3Key && thumbnailSource === "upload") {
      try {
        await deleteFile(thumbnailS3Key);
      } catch (error) {
        console.error("Failed to delete old thumbnail from S3:", error);
      }
    }
    setValue("thumbnail", url, { shouldDirty: true });
    setValue("thumbnailSource", "url", { shouldDirty: true });
    setValue("thumbnailS3Key", "", { shouldDirty: true });
  };

  const handleThumbnailRemove = () => {
    setValue("thumbnail", "", { shouldDirty: true });
    setValue("thumbnailS3Key", "", { shouldDirty: true });
    setValue("thumbnailSource", "url", { shouldDirty: true });
  };

  return (
    <Container
      title="Basic Information"
      description="What the learner sees on their dashboard"
      icon={BookOpenIcon}
      classNameBody="flex flex-col gap-6"
    >
      <Controller
        name="title"
        control={control}
        rules={{ required: "Title is required" }}
        render={({ field }) => (
          <Input
            label="Programme Title"
            required
            value={field.value}
            setChange={field.onChange}
            placeholder="Analytics Internship"
            error={errors.title?.message as string}
          />
        )}
      />

      <div>
        {isMounted && (
          <RichTextEditor
            title="Description"
            ref={descriptionEditorRef}
            rows={5}
            placeholder="What this internship involves"
            onChange={(html: string) =>
              setValue("description", html, { shouldDirty: true })
            }
          />
        )}
      </div>

      <Controller
        name="thumbnail"
        control={control}
        render={() => (
          <UploadMediaContainer
            title="Programme Thumbnail"
            description="Shown on the admin list and the learner's dashboard"
            type="image"
            folderName={folderName}
            mediaUrl={thumbnailValue}
            mediaSource={thumbnailSource}
            s3Key={thumbnailS3Key}
            onFileUpload={handleThumbnailUpload}
            onFileRemove={handleThumbnailRemove}
            onUrlSubmit={handleThumbnailUrlChange}
            allowUrlInput
            maxSize={5}
            acceptedFormats={[".jpg", ".jpeg", ".png", ".webp"]}
            error={(errors.thumbnail?.message as string) || uploadError}
            isUploading={isUploading}
          />
        )}
      />
    </Container>
  );
};

export default Screen1;
