"use client";
import Container from "@/app/admin/components/ui/Container";
import Input from "@/components/ui/inputs/Input";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import IconDropdown from "@/components/ui/dropdown/IconDropdown";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import { useUpload } from "@/hooks/useUpload";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { InternshipFormData } from "@/types/internshipForm";
import {
  validatePreRequisitesField,
  validateWhoCanJoinField,
} from "@/lib/internshipScreenValidation";
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

const PREREQUISITE_ICONS = [
  { name: "mdi:school-outline", label: "Education" },
  { name: "mdi:laptop", label: "Computer" },
  { name: "mdi:language-python", label: "Programming" },
  { name: "mdi:code-braces", label: "Coding Skills" },
  { name: "mdi:brain", label: "Analytical Skills" },
  { name: "mdi:account-voice", label: "Communication" },
  { name: "mdi:calendar-clock", label: "Time Commitment" },
  { name: "mdi:wifi", label: "Internet Connection" },
  { name: "mdi:translate", label: "Language Skills" },
  { name: "mdi:book-open-variant", label: "Basic Knowledge" },
  { name: "mdi:certificate-outline", label: "Certification" },
  { name: "mdi:account-school", label: "Student Status" },
  { name: "mdi:microsoft-windows", label: "Windows" },
  { name: "mdi:apple", label: "Mac" },
  { name: "mdi:linux", label: "Linux" },
];

const WHO_CAN_JOIN_ICONS = [
  { name: "mdi:account-school", label: "Students" },
  { name: "mdi:account-tie", label: "Professionals" },
  { name: "mdi:school-outline", label: "Graduates" },
  { name: "mdi:briefcase-outline", label: "Job Seekers" },
  { name: "mdi:account-star-outline", label: "Career Switchers" },
  { name: "mdi:run-fast", label: "Go-getters" },
  { name: "mdi:lightbulb-on-outline", label: "Learners" },
  { name: "mdi:rocket-launch-outline", label: "Ambitious" },
  { name: "mdi:school", label: "College Students" },
  { name: "mdi:briefcase-plus-outline", label: "Freshers" },
  { name: "mdi:account-multiple", label: "Team Players" },
  { name: "mdi:trophy-outline", label: "High Achievers" },
  { name: "mdi:book-education-outline", label: "Undergraduates" },
  { name: "mdi:account-convert", label: "Career Changers" },
  { name: "mdi:chart-line", label: "Growth Minded" },
];

const defaultPreRequisite = () => ({
  icon: "mdi:school-outline",
  title: "",
});

const defaultWhoCanJoin = () => ({
  icon: "mdi:account-school",
  title: "",
});

const Screen6 = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [expandedPreReqs, setExpandedPreReqs] = useState<Set<number>>(
    new Set([0]),
  );
  const [expandedWhoCanJoin, setExpandedWhoCanJoin] = useState<Set<number>>(
    new Set([0]),
  );

  const {
    control,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<InternshipFormData>();
  const { uploadCourseThumbnail, deleteFile, isUploading } = useUpload();

  const {
    fields: preReqFields,
    append: appendPreReq,
    remove: removePreReq,
  } = useFieldArray({
    control,
    name: "preRequisites",
  });

  const {
    fields: whoCanJoinFields,
    append: appendWhoCanJoin,
    remove: removeWhoCanJoin,
  } = useFieldArray({
    control,
    name: "whoCanJoin",
  });

  const preRequisitesData = watch("preRequisites");
  const whoCanJoinData = watch("whoCanJoin");
  const titleValue = watch("title");
  const preRequisitesImageValue = watch("preRequisitesImage");
  const preRequisitesImageS3Key = watch("preRequisitesImageS3Key");
  const preRequisitesImageSource = watch("preRequisitesImageSource");
  const preRequisitesImageFolderName = `internships/${
    titleValue
      ? titleValue.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()
      : "new_internship"
  }/pre_requisites_image`;

  const setPreRequisitesImage = (
    url: string,
    s3Key: string,
    source: "upload" | "url",
  ) => {
    const options = { shouldDirty: true, shouldTouch: true };
    setValue("preRequisitesImage", url, options);
    setValue("preRequisitesImageS3Key", s3Key, options);
    setValue("preRequisitesImageSource", source, options);
  };

  const handlePreRequisitesImageUpload = async (
    file: File,
    folderName: string,
  ) => {
    try {
      const result = await uploadCourseThumbnail(file, folderName);
      if (result.success && result.data) {
        setPreRequisitesImage(result.data.url, result.data.s3Key, "upload");
        return result.data.url;
      }
      throw new Error(result.error || "Upload failed");
    } catch (error) {
      console.error("Failed to upload pre-requisites image:", error);
      setPreRequisitesImage("", "", "url");
      throw error;
    }
  };

  const handlePreRequisitesImageUrlChange = async (url: string) => {
    if (preRequisitesImageS3Key && preRequisitesImageSource === "upload") {
      try {
        await deleteFile(preRequisitesImageS3Key);
      } catch (error) {
        console.error("Failed to delete old pre-requisites image from S3:", error);
      }
    }
    setPreRequisitesImage(url, "", "url");
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleExpandedPreReq = (index: number) => {
    setExpandedPreReqs((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleExpandedWhoCanJoin = (index: number) => {
    setExpandedWhoCanJoin((prev) => {
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
        title="Eligibility (Screen 6)"
        description="Define prerequisites and who can join this internship"
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
      title="Eligibility (Screen 6)"
      description="Define prerequisites and who can join this internship"
      className="h-full w-full"
      classNameBody="flex flex-col gap-6"
    >
      <Controller
        name="preRequisites"
        control={control}
        rules={{ validate: validatePreRequisitesField }}
        render={() => <span className="sr-only" aria-hidden />}
      />
      {typeof errors.preRequisites?.message === "string" && (
        <p className="text-red-500 text-sm">{errors.preRequisites.message}</p>
      )}
      <Controller
        name="whoCanJoin"
        control={control}
        rules={{ validate: validateWhoCanJoinField }}
        render={() => <span className="sr-only" aria-hidden />}
      />
      {typeof errors.whoCanJoin?.message === "string" && (
        <p className="text-red-500 text-sm">{errors.whoCanJoin.message}</p>
      )}

      {/* Pre-requisites Section */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-black">Pre-requisites</p>
        <p className="text-xs text-gray-600">
          Add any requirements or skills needed before joining this internship.
        </p>

        <div className="flex flex-col gap-3">
          {preReqFields.map((field, index) => {
            const isExpanded = expandedPreReqs.has(index);
            const preReqData = preRequisitesData?.[index];
            const selectedIcon = preReqData?.icon || "mdi:school-outline";
            const iconLabel =
              PREREQUISITE_ICONS.find((i) => i.name === selectedIcon)?.label ||
              "Icon";

            const hasError =
              !!errors.preRequisites?.[index] ||
              (preReqData && !preReqData.title?.trim());
            const isComplete = preReqData?.title?.trim();

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
                            className="size-5 text-purple-500 shrink-0"
                          />
                          <span className="text-base font-bold text-gray-900">
                            {preReqData?.title?.trim() ||
                              `Prerequisite ${index + 1}`}
                          </span>
                          {isComplete && !hasError && (
                            <CheckCircle2Icon className="size-4 text-green-600 shrink-0" />
                          )}
                          {hasError && (
                            <AlertCircleIcon className="size-4 text-red-600 shrink-0" />
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                            {iconLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleExpandedPreReq(index)}
                          className="p-2 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                          aria-label="Edit prerequisite"
                        >
                          <PencilIcon className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removePreReq(index)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          aria-label="Remove prerequisite"
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
                        Edit Prerequisite {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleExpandedPreReq(index)}
                          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                          aria-label="Collapse prerequisite"
                        >
                          <ChevronUp className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removePreReq(index)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          aria-label="Remove prerequisite"
                        >
                          <Trash2Icon className="size-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Controller
                        name={`preRequisites.${index}.title`}
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
                            placeholder="e.g. Basic Programming Knowledge"
                            error={
                              errors.preRequisites?.[index]?.title?.message as
                                | string
                                | undefined
                            }
                            required
                            className="w-full"
                          />
                        )}
                      />

                      <Controller
                        name={`preRequisites.${index}.icon`}
                        control={control}
                        rules={{
                          required: "Icon is required",
                        }}
                        render={({ field: f }) => (
                          <IconDropdown
                            value={f.value || "mdi:school-outline"}
                            onChange={f.onChange}
                            label="Icon"
                            required
                            error={
                              errors.preRequisites?.[index]?.icon?.message as
                                | string
                                | undefined
                            }
                            icons={PREREQUISITE_ICONS}
                            iconColor="text-purple-500"
                            hoverColor="hover:bg-purple-50 bg-purple-100 text-purple-700"
                          />
                        )}
                      />
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
            const newIndex = preReqFields.length;
            appendPreReq(defaultPreRequisite());
            setExpandedPreReqs((prev) => new Set(prev).add(newIndex));
          }}
        >
          <PlusIcon className="size-4" />
          Add Pre-Requisite
        </WhiteButton>

        <UploadMediaContainer
          title="Pre-Requisites Image (Optional)"
          description="Shown beside the pre-requisites on the internship detail page. Leave empty to use the default image."
          type="image"
          folderName={preRequisitesImageFolderName}
          mediaUrl={preRequisitesImageValue}
          mediaSource={preRequisitesImageSource}
          s3Key={preRequisitesImageS3Key}
          onFileUpload={handlePreRequisitesImageUpload}
          onFileRemove={() => setPreRequisitesImage("", "", "url")}
          onUrlSubmit={handlePreRequisitesImageUrlChange}
          allowUrlInput
          maxSize={5}
          acceptedFormats={[".jpg", ".jpeg", ".png", ".webp"]}
          isUploading={isUploading}
        />
      </div>

      {/* Who Can Join Section */}
      <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
        <p className="text-sm font-medium text-black">Who Can Join</p>
        <p className="text-xs text-gray-600">
          Specify the target audience or types of candidates who are eligible
          for this internship.
        </p>

        <div className="flex flex-col gap-3">
          {whoCanJoinFields.map((field, index) => {
            const isExpanded = expandedWhoCanJoin.has(index);
            const whoData = whoCanJoinData?.[index];
            const selectedIcon = whoData?.icon || "mdi:account-school";
            const iconLabel =
              WHO_CAN_JOIN_ICONS.find((i) => i.name === selectedIcon)?.label ||
              "Icon";

            const hasError =
              !!errors.whoCanJoin?.[index] ||
              (whoData && !whoData.title?.trim());
            const isComplete = whoData?.title?.trim();

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
                            className="size-5 text-indigo-500 shrink-0"
                          />
                          <span className="text-base font-bold text-gray-900">
                            {whoData?.title?.trim() || `Candidate ${index + 1}`}
                          </span>
                          {isComplete && !hasError && (
                            <CheckCircle2Icon className="size-4 text-green-600 shrink-0" />
                          )}
                          {hasError && (
                            <AlertCircleIcon className="size-4 text-red-600 shrink-0" />
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                            {iconLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleExpandedWhoCanJoin(index)}
                          className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          aria-label="Edit candidate type"
                        >
                          <PencilIcon className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeWhoCanJoin(index)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          aria-label="Remove candidate type"
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
                        Edit Candidate Type {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleExpandedWhoCanJoin(index)}
                          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                          aria-label="Collapse candidate type"
                        >
                          <ChevronUp className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeWhoCanJoin(index)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          aria-label="Remove candidate type"
                        >
                          <Trash2Icon className="size-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Controller
                        name={`whoCanJoin.${index}.title`}
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
                            placeholder="e.g. College Students"
                            error={
                              errors.whoCanJoin?.[index]?.title?.message as
                                | string
                                | undefined
                            }
                            required
                            className="w-full"
                          />
                        )}
                      />

                      <Controller
                        name={`whoCanJoin.${index}.icon`}
                        control={control}
                        rules={{
                          required: "Icon is required",
                        }}
                        render={({ field: f }) => (
                          <IconDropdown
                            value={f.value || "mdi:account-school"}
                            onChange={f.onChange}
                            label="Icon"
                            required
                            error={
                              errors.whoCanJoin?.[index]?.icon?.message as
                                | string
                                | undefined
                            }
                            icons={WHO_CAN_JOIN_ICONS}
                            iconColor="text-indigo-500"
                            hoverColor="hover:bg-indigo-50 bg-indigo-100 text-indigo-700"
                          />
                        )}
                      />
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
            const newIndex = whoCanJoinFields.length;
            appendWhoCanJoin(defaultWhoCanJoin());
            setExpandedWhoCanJoin((prev) => new Set(prev).add(newIndex));
          }}
        >
          <PlusIcon className="size-4" />
          Add Candidate Type
        </WhiteButton>
      </div>
    </Container>
  );
};

export default Screen6;
