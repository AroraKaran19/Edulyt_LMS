"use client";
import Container from "@/app/admin/components/ui/Container";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import { ImageIcon, VideoIcon } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { Controller } from "react-hook-form";
import {
  useScreenNavigation,
} from "@/contexts/CourseFormContext";
import { CourseFormData } from "@/types/courseForm";
import { useUpload } from "@/hooks/useUpload";
import React, { useEffect, useState } from "react";

const Screen3 = () => {
  const [isMounted, setIsMounted] = useState(false);
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

  const {
    uploadCourseThumbnail,
    uploadFile,
    isUploading,
    error: uploadError,
  } = useUpload();

  // Watch form values
  const thumbnailValue = watch("thumbnail");
  const thumbnailS3Key = watch("thumbnailS3Key");
  const thumbnailSource = watch("thumbnailSource");
  const previewVideoValue = watch("previewVideoUrl");
  const previewVideoS3Key = watch("previewVideoS3Key");
  const previewVideoSource = watch("previewVideoSource");
  const titleValue = watch("title");

  const [thumbnailFolderName, setThumbnailFolderName] = useState(
    "courses/new_course/thumbnail"
  );
  const [previewVideoFolderName, setPreviewVideoFolderName] = useState(
    "courses/new_course/preview_video"
  );

  useEffect(() => {
    if (titleValue) {
      const baseFolder = titleValue.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      setThumbnailFolderName(`courses/${baseFolder}/thumbnail`);
      setPreviewVideoFolderName(`courses/${baseFolder}/preview_video`);
    }
  }, [titleValue]);

  // Handle thumbnail upload
  const handleThumbnailUpload = async (file: File, folderName: string) => {
    try {
      const result = await uploadCourseThumbnail(file, folderName);
      if (result.success && result.data) {
        setValue("thumbnail", result.data.url);
        setValue("thumbnailS3Key", result.data.s3Key);
        setValue("thumbnailSource", "upload");
        return result.data.url;
      }
      throw new Error(result.error || "Upload failed");
    } catch (error) {
      console.error("Failed to upload thumbnail:", error);
      // Set form error for thumbnail field
      setValue("thumbnail", "");
      setValue("thumbnailS3Key", "");
      setValue("thumbnailSource", "url");
      throw error;
    }
  };

  // Handle preview video upload
  const handlePreviewVideoUpload = async (file: File, folderName: string) => {
    try {
      const result = await uploadFile(file, folderName);
      if (result.success && result.data) {
        setValue("previewVideoUrl", result.data.url);
        setValue("previewVideoS3Key", result.data.s3Key);
        setValue("previewVideoSource", "upload");
        return result.data.url;
      }
      throw new Error(result.error || "Upload failed");
    } catch (error) {
      console.error("Failed to upload preview video:", error);
      // Set form error for preview video field
      setValue("previewVideoUrl", "");
      setValue("previewVideoS3Key", "");
      setValue("previewVideoSource", "url");
      throw error;
    }
  };

  // Handle URL input changes
  const handleThumbnailUrlChange = (url: string) => {
    setValue("thumbnail", url);
    setValue("thumbnailSource", "url");
    setValue("thumbnailS3Key", "");
  };

  const handlePreviewVideoUrlChange = (url: string) => {
    setValue("previewVideoUrl", url);
    setValue("previewVideoSource", "url");
    setValue("previewVideoS3Key", "");
  };

  // Handle file removal
  const handleThumbnailRemove = () => {
    setValue("thumbnail", "");
    setValue("thumbnailS3Key", "");
    setValue("thumbnailSource", "url");
  };

  const handlePreviewVideoRemove = () => {
    setValue("previewVideoUrl", "");
    setValue("previewVideoS3Key", "");
    setValue("previewVideoSource", "url");
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return (
      <Container
        title="Course Media"
        description="Upload visual content to showcase your course"
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
      title="Course Media"
      description="Upload visual content to showcase your course"
      className="h-full w-full"
      classNameBody="flex flex-col gap-4"
    >
      <Container
        title="Course Thumbnail"
        description="Upload an attractive thumbnail image for your course"
        icon={ImageIcon}
        className="w-full h-fit border-none shadow-none pb-0"
      >
        <Controller
          name="thumbnail"
          control={control}
          rules={{
            required: "Course thumbnail is required",
            validate: (value) => {
              if (!value) return "Course thumbnail is required";
              if (typeof value === "string" && value.startsWith("http")) {
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
              type="image"
              folderName={thumbnailFolderName}
              mediaUrl={thumbnailValue}
              mediaSource={thumbnailSource}
              s3Key={thumbnailS3Key}
              onFileUpload={handleThumbnailUpload}
              onFileRemove={handleThumbnailRemove}
              onUrlSubmit={handleThumbnailUrlChange}
              allowUrlInput
              maxSize={5} // 5MB
              acceptedFormats={[".jpg", ".jpeg", ".png", ".webp"]}
              error={errors.thumbnail?.message || uploadError}
              isUploading={isUploading}
              required={true}
            />
          )}
        />
      </Container>
      <Container
        title="Preview Video (Optional)"
        description="Upload a preview video to give students a taste of your course content"
        icon={VideoIcon}
        className="w-full h-fit border-none shadow-none pb-0"
      >
        <Controller
          name="previewVideoUrl"
          control={control}
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
              type="video"
              folderName={previewVideoFolderName}
              mediaUrl={previewVideoValue}
              mediaSource={previewVideoSource}
              s3Key={previewVideoS3Key}
              onFileUpload={handlePreviewVideoUpload}
              onFileRemove={handlePreviewVideoRemove}
              onUrlSubmit={handlePreviewVideoUrlChange}
              allowUrlInput
              maxSize={100} // 100MB
              acceptedFormats={[".mp4", ".mov", ".avi", ".webm"]}
              error={errors.previewVideoUrl?.message || uploadError}
              isUploading={isUploading}
              required={false}
            />
          )}
        />
      </Container>
    </Container>
  );
};

export default Screen3;
