"use client";
import Container from "@/app/admin/components/ui/Container";
import Input from "@/components/ui/inputs/Input";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import IconDropdown from "@/components/ui/dropdown/IconDropdown";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { InternshipFormData } from "@/types/internshipForm";
import { validateMediaField } from "@/lib/internshipScreenValidation";
import { useUpload } from "@/hooks/useUpload";
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

const MEDIA_ICONS = [
  { name: "mdi:video-outline", label: "Video" },
  { name: "mdi:image-outline", label: "Image" },
  { name: "mdi:file-document-outline", label: "Document" },
  { name: "mdi:youtube", label: "YouTube" },
  { name: "mdi:link-variant", label: "Link" },
  { name: "mdi:file-pdf-box", label: "PDF" },
  { name: "mdi:presentation", label: "Presentation" },
  { name: "mdi:play-circle-outline", label: "Media" },
  { name: "mdi:camera-outline", label: "Photo" },
  { name: "mdi:movie-outline", label: "Movie" },
  { name: "mdi:album", label: "Gallery" },
  { name: "mdi:file-video-outline", label: "Video File" },
  { name: "mdi:web", label: "Website" },
  { name: "mdi:folder-image", label: "Portfolio" },
  { name: "mdi:monitor-screenshot", label: "Screenshot" },
];

/** Image and video extensions only (no documents — preview and UX are media-focused). */
const MEDIA_UPLOAD_FORMATS = [
  ".mp4",
  ".webm",
  ".mov",
  ".avi",
  ".mkv",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
];

const defaultMedia = () => ({
  icon: "mdi:video-outline",
  title: "",
  content: "",
  contentSource: "url" as const,
  contentS3Key: "",
});

const Screen8 = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [expandedMedia, setExpandedMedia] = useState<Set<number>>(new Set([0]));
  const [mediaBaseFolder, setMediaBaseFolder] = useState(
    "internships/new_internship",
  );

  const {
    control,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<InternshipFormData>();

  const {
    uploadFile,
    deleteFile,
    isUploading,
    error: uploadError,
  } = useUpload();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "media",
  });

  const mediaData = watch("media");
  const titleValue = watch("title");
  const slugValue = watch("slug");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const raw = (slugValue || titleValue || "").trim();
    if (raw) {
      const base = raw.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      setMediaBaseFolder(`internships/${base}`);
    }
  }, [slugValue, titleValue]);

  const toggleExpanded = (index: number) => {
    setExpandedMedia((prev) => {
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
        title="Media (Screen 8)"
        description="Add media content for the internship"
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
      title="Media (Screen 8)"
      description="Add media content for the internship"
      className="h-full w-full"
      classNameBody="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-black">Media Items</p>
        <p className="text-xs text-gray-600">
          Upload videos or images for this internship. Files are stored and the
          public URL is saved on the internship.
        </p>

        <Controller
          name="media"
          control={control}
          rules={{ validate: validateMediaField }}
          render={() => <span className="sr-only" aria-hidden />}
        />
        {typeof errors.media?.message === "string" && (
          <p className="text-red-500 text-sm">{errors.media.message}</p>
        )}

        <div className="flex flex-col gap-3">
          {fields.map((field, index) => {
            const isExpanded = expandedMedia.has(index);
            const mediaItem = mediaData?.[index];
            const selectedIcon = mediaItem?.icon || "mdi:video-outline";
            const iconLabel =
              MEDIA_ICONS.find((i) => i.name === selectedIcon)?.label || "Icon";

            const contentUrl = mediaItem?.content?.trim() ?? "";
            const hasError =
              !!errors.media?.[index] ||
              (mediaItem &&
                (!mediaItem.title?.trim() || !mediaItem.content?.trim()));

            const isComplete =
              mediaItem?.title?.trim() && mediaItem?.content?.trim();

            const folderName = `${mediaBaseFolder}/media_${index}`;

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
                            className="size-5 text-pink-500 shrink-0"
                          />
                          <span className="text-base font-bold text-gray-900">
                            {mediaItem?.title?.trim() || `Media ${index + 1}`}
                          </span>
                          {isComplete && !hasError && (
                            <CheckCircle2Icon className="size-4 text-green-600 shrink-0" />
                          )}
                          {hasError && (
                            <AlertCircleIcon className="size-4 text-red-600 shrink-0" />
                          )}
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-1">
                          {contentUrl ? "File attached" : "No file uploaded"}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 border border-pink-200">
                            {iconLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(index)}
                          className="p-2 rounded-lg text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer"
                          aria-label="Edit media"
                        >
                          <PencilIcon className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          aria-label="Remove media"
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
                        Edit Media {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(index)}
                          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                          aria-label="Collapse media"
                        >
                          <ChevronUp className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          aria-label="Remove media"
                        >
                          <Trash2Icon className="size-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Controller
                        name={`media.${index}.title`}
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
                            placeholder="e.g. Introduction Video"
                            error={
                              errors.media?.[index]?.title?.message as
                                | string
                                | undefined
                            }
                            required
                            className="w-full"
                          />
                        )}
                      />

                      <Controller
                        name={`media.${index}.icon`}
                        control={control}
                        rules={{
                          required: "Icon is required",
                        }}
                        render={({ field: f }) => (
                          <IconDropdown
                            value={f.value || "mdi:video-outline"}
                            onChange={f.onChange}
                            label="Icon"
                            required
                            error={
                              errors.media?.[index]?.icon?.message as
                                | string
                                | undefined
                            }
                            icons={MEDIA_ICONS}
                            iconColor="text-pink-500"
                            hoverColor="hover:bg-pink-50 bg-pink-100 text-pink-700"
                          />
                        )}
                      />
                    </div>

                    <Controller
                      name={`media.${index}.content`}
                      control={control}
                      rules={{
                        validate: (v) =>
                          (typeof v === "string" && v.trim().length > 0) ||
                          "Upload a media file",
                      }}
                      render={({ field }) => {
                        const mediaUrl = field.value || "";
                        const mediaSource =
                          watch(`media.${index}.contentSource`) ?? "url";
                        const s3Key =
                          watch(`media.${index}.contentS3Key`) ?? "";

                        const handleUpload = async (
                          file: File,
                          folder: string,
                        ) => {
                          try {
                            const result = await uploadFile(file, folder);
                            if (result.success && result.data) {
                              setValue(
                                `media.${index}.content`,
                                result.data.url,
                                {
                                  shouldDirty: true,
                                  shouldTouch: true,
                                  shouldValidate: true,
                                },
                              );
                              setValue(
                                `media.${index}.contentS3Key`,
                                result.data.s3Key,
                                {
                                  shouldDirty: true,
                                  shouldTouch: true,
                                },
                              );
                              setValue(
                                `media.${index}.contentSource`,
                                "upload",
                                {
                                  shouldDirty: true,
                                  shouldTouch: true,
                                },
                              );
                              field.onChange(result.data.url);
                              return result.data.url;
                            }
                            throw new Error(result.error || "Upload failed");
                          } catch (err) {
                            console.error("Media upload failed:", err);
                            setValue(`media.${index}.content`, "", {
                              shouldDirty: true,
                              shouldTouch: true,
                            });
                            setValue(`media.${index}.contentS3Key`, "", {
                              shouldDirty: true,
                              shouldTouch: true,
                            });
                            setValue(`media.${index}.contentSource`, "url", {
                              shouldDirty: true,
                              shouldTouch: true,
                            });
                            field.onChange("");
                            throw err;
                          }
                        };

                        const handleRemove = async () => {
                          if (
                            s3Key &&
                            mediaSource === "upload"
                          ) {
                            try {
                              await deleteFile(s3Key);
                            } catch (e) {
                              console.error("Failed to delete media file:", e);
                            }
                          }
                          setValue(`media.${index}.content`, "", {
                            shouldDirty: true,
                            shouldTouch: true,
                          });
                          setValue(`media.${index}.contentS3Key`, "", {
                            shouldDirty: true,
                            shouldTouch: true,
                          });
                          setValue(`media.${index}.contentSource`, "url", {
                            shouldDirty: true,
                            shouldTouch: true,
                          });
                          field.onChange("");
                        };

                        return (
                          <UploadMediaContainer
                            title="Media file"
                            description="Upload a video or image (no URL entry)."
                            type="video"
                            folderName={folderName}
                            mediaUrl={mediaUrl}
                            mediaSource={mediaSource}
                            s3Key={s3Key}
                            onFileUpload={handleUpload}
                            onFileRemove={handleRemove}
                            allowUrlInput={false}
                            showConfirmation={false}
                            maxSize={100}
                            acceptedFormats={MEDIA_UPLOAD_FORMATS}
                            error={
                              (errors.media?.[index]?.content?.message as
                                | string
                                | undefined) || uploadError
                            }
                            isUploading={isUploading}
                            required
                            className="w-full max-w-full"
                          />
                        );
                      }}
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
            append(defaultMedia());
            setExpandedMedia((prev) => new Set(prev).add(newIndex));
          }}
        >
          <PlusIcon className="size-4" />
          Add Media
        </WhiteButton>
      </div>
    </Container>
  );
};

export default Screen8;
