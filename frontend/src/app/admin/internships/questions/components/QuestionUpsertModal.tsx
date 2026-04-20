"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/inputs/Input";
import TextArea from "@/components/ui/inputs/TextArea";
import Select from "@/components/ui/inputs/Select";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { useUpload } from "@/hooks/useUpload";
import type {
  InternshipQuestionDetail,
  QuestionType,
  QuestionUsage,
} from "../types";

type McqOption = { text: string; isCorrect: boolean };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "create" | "edit";
  /** Required when mode is `edit` */
  questionId?: string | null;
};

const defaultOptions = (): McqOption[] => [
  { text: "", isCorrect: true },
  { text: "", isCorrect: false },
];

const REFERENCE_FOLDER = "internship-questions/references";

export default function QuestionUpsertModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  questionId,
}: Props) {
  const {
    uploadFile,
    deleteFile,
    isUploading,
    error: uploadError,
  } = useUpload();
  const [questionText, setQuestionText] = useState("");
  const [type, setType] = useState<QuestionType>("mcq");
  const [usageType, setUsageType] = useState<QuestionUsage>("both");
  const [score, setScore] = useState("1");
  const [isActive, setIsActive] = useState(true);
  const [referenceFile, setReferenceFile] = useState("");
  const [referenceMediaSource, setReferenceMediaSource] = useState<
    "upload" | "url" | undefined
  >(undefined);
  const [referenceS3Key, setReferenceS3Key] = useState("");
  const [options, setOptions] = useState<McqOption[]>(defaultOptions);
  const [submitting, setSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const resetCreate = () => {
    setQuestionText("");
    setType("mcq");
    setUsageType("both");
    setScore("1");
    setIsActive(true);
    setReferenceFile("");
    setReferenceMediaSource(undefined);
    setReferenceS3Key("");
    setOptions(defaultOptions());
    setSubmitting(false);
    setLoadingDetail(false);
  };

  const handleReferenceUpload = useCallback(
    async (file: File, folderName: string) => {
      const result = await uploadFile(file, folderName);
      if (result.success && result.data) {
        setReferenceFile(result.data.url);
        setReferenceS3Key(result.data.s3Key);
        setReferenceMediaSource("upload");
        return result.data.url;
      }
      throw new Error(result.error || "Upload failed");
    },
    [uploadFile],
  );

  const handleReferenceUrlSubmit = useCallback(
    async (url: string) => {
      if (referenceS3Key && referenceMediaSource === "upload") {
        try {
          await deleteFile(referenceS3Key);
        } catch (e) {
          console.error("Failed to remove previous upload from storage:", e);
        }
      }
      setReferenceFile(url);
      setReferenceMediaSource("url");
      setReferenceS3Key("");
    },
    [referenceS3Key, referenceMediaSource, deleteFile],
  );

  const handleReferenceRemove = useCallback(() => {
    setReferenceFile("");
    setReferenceS3Key("");
    setReferenceMediaSource(undefined);
  }, []);

  useEffect(() => {
    if (type !== "file_upload") {
      setReferenceFile("");
      setReferenceS3Key("");
      setReferenceMediaSource(undefined);
    }
  }, [type]);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "create") {
      resetCreate();
      return;
    }

    if (!questionId) return;

    let cancelled = false;
    (async () => {
      setLoadingDetail(true);
      try {
        const res = await apiClient.get(
          ENDPOINTS.internshipQuestions.adminById(questionId),
        );
        const d = res.data?.data as InternshipQuestionDetail | undefined;
        if (cancelled || !d) return;
        setQuestionText(d.questionText ?? "");
        setType((d.type as QuestionType) || "mcq");
        setUsageType((d.usageType as QuestionUsage) || "both");
        setScore(String(d.score ?? 0));
        setIsActive(d.isActive !== false);
        const ref = (d.referenceFile ?? "").trim();
        setReferenceFile(ref);
        setReferenceS3Key("");
        setReferenceMediaSource(ref ? "url" : undefined);
        if (d.type === "mcq" && d.options?.length) {
          setOptions(
            d.options.map((o) => ({
              text: o.text ?? "",
              isCorrect: !!o.isCorrect,
            })),
          );
        } else {
          setOptions(defaultOptions());
        }
      } catch {
        if (!cancelled) {
          toast.error("Could not load question");
          onClose();
        }
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, mode, questionId]); // omit onClose in catch path

  const setOptionText = (index: number, text: string) => {
    setOptions((prev) =>
      prev.map((o, i) => (i === index ? { ...o, text } : o)),
    );
  };

  const setOptionCorrect = (index: number, isCorrect: boolean) => {
    setOptions((prev) =>
      prev.map((o, i) => (i === index ? { ...o, isCorrect } : o)),
    );
  };

  const addOption = () => {
    setOptions((prev) => [...prev, { text: "", isCorrect: false }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const trimmed = questionText.trim();
    if (!trimmed) {
      toast.error("Question text is required");
      return;
    }
    const scoreNum = parseFloat(score);
    if (Number.isNaN(scoreNum) || scoreNum < 0) {
      toast.error("Score must be a non-negative number");
      return;
    }

    const payload: Record<string, unknown> = {
      questionText: trimmed,
      type,
      usageType,
      score: scoreNum,
      isActive,
    };

    if (type === "mcq") {
      const cleaned = options.map((o) => ({
        text: o.text.trim(),
        isCorrect: o.isCorrect,
      }));
      if (cleaned.length < 2) {
        toast.error("Add at least two answer options");
        return;
      }
      if (cleaned.some((o) => !o.text)) {
        toast.error("Each option needs text");
        return;
      }
      if (!cleaned.some((o) => o.isCorrect)) {
        toast.error("Mark at least one option as correct");
        return;
      }
      payload.options = cleaned;
    } else {
      payload.referenceFile = referenceFile.trim();
    }

    setSubmitting(true);
    try {
      if (mode === "create") {
        await apiClient.post(ENDPOINTS.internshipQuestions.create, payload);
        toast.success("Question created");
      } else {
        if (!questionId) {
          toast.error("Missing question id");
          return;
        }
        await apiClient.patch(
          ENDPOINTS.internshipQuestions.adminById(questionId),
          payload,
        );
        toast.success("Question updated");
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Could not save question";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === "create" ? "New question" : "Edit question";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      className="max-w-xl w-full mx-4 max-h-[90vh]"
    >
      {mode === "edit" && loadingDetail ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          <p className="text-sm text-gray-500">Loading question…</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <TextArea
            label="Question text"
            required
            placeholder="Enter the question…"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={4}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Question type"
              required
              options={[
                { value: "mcq", label: "Multiple choice (MCQ)" },
                { value: "file_upload", label: "File upload" },
              ]}
              value={type}
              onChange={(v) => setType(v as QuestionType)}
              placeholder="Type"
            />
            <Select
              label="Usage"
              required
              options={[
                { value: "exam", label: "Exams only" },
                { value: "task", label: "Tasks only" },
                { value: "both", label: "Exams and tasks" },
              ]}
              value={usageType}
              onChange={(v) => setUsageType(v as QuestionUsage)}
              placeholder="Usage"
            />
          </div>

          <Input
            label="Score (marks)"
            type="number"
            min={0}
            step={0.5}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            required
          />

          <CheckBoxContainer
            label="Question is active"
            checked={isActive}
            onChange={setIsActive}
          />

          {type === "mcq" ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-800">
                Answer options
              </p>
              {options.map((opt, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row gap-2 sm:items-center border border-gray-100 rounded-lg p-3"
                >
                  <div className="flex-1 min-w-0">
                    <Input
                      label=""
                      placeholder={`Option ${index + 1}`}
                      value={opt.text}
                      onChange={(e) => setOptionText(index, e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <CheckBoxContainer
                      label="Correct"
                      checked={opt.isCorrect}
                      onChange={(checked) => setOptionCorrect(index, checked)}
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      disabled={options.length <= 2}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Remove option"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addOption}
                className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                <Plus className="w-4 h-4" />
                Add option
              </button>
            </div>
          ) : (
            <UploadMediaContainer
              type="document"
              title="Reference file (optional)"
              description="Upload instructions or a template (PDF, Word, or text), or paste a direct file URL."
              folderName={REFERENCE_FOLDER}
              mediaUrl={referenceFile || undefined}
              mediaSource={referenceMediaSource}
              s3Key={referenceS3Key || undefined}
              onFileUpload={handleReferenceUpload}
              onFileRemove={handleReferenceRemove}
              onUrlSubmit={(url) => void handleReferenceUrlSubmit(url)}
              allowUrlInput
              showConfirmation={false}
              maxSize={50}
              acceptedFormats={[".pdf", ".doc", ".docx", ".txt"]}
              isUploading={isUploading}
              error={uploadError}
              required={false}
            />
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <WhiteButton type="button" glow={false} onClick={onClose}>
              Cancel
            </WhiteButton>
            <OrangeButton
              type="button"
              glow={false}
              onClick={() => void handleSubmit()}
              disabled={
                submitting || isUploading || (mode === "edit" && loadingDetail)
              }
            >
              {submitting
                ? "Saving…"
                : mode === "create"
                  ? "Create question"
                  : "Save changes"}
            </OrangeButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
