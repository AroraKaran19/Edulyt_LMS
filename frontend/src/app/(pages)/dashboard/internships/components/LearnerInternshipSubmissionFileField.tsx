"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Paperclip } from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { useUpload } from "@/hooks/useUpload";
import {
  INTERNSHIP_SUBMISSION_MAX_COMMENT_CHARS,
  INTERNSHIP_SUBMISSION_MAX_FILE_BYTES,
  INTERNSHIP_SUBMISSION_UPLOAD_FOLDER,
} from "@/constants/internshipSubmissionUpload";

type Props = {
  submissionId: string;
  questionId: string;
  disabled: boolean;
  currentFileUrl?: string;
  learnerComment?: string;
  onUploaded: (url: string) => void;
  onLearnerCommentSaved?: (comment: string) => void;
};

export default function LearnerInternshipSubmissionFileField({
  submissionId,
  questionId,
  disabled,
  currentFileUrl,
  learnerComment = "",
  onUploaded,
  onLearnerCommentSaved,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useUpload();
  const [commentDraft, setCommentDraft] = useState(learnerComment);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedComment = useRef(learnerComment);

  const maxMb = INTERNSHIP_SUBMISSION_MAX_FILE_BYTES / (1024 * 1024);

  useEffect(() => {
    setCommentDraft(learnerComment);
    lastSavedComment.current = learnerComment;
  }, [learnerComment]);

  const saveComment = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (trimmed === lastSavedComment.current.trim()) return;
      if (text.length > INTERNSHIP_SUBMISSION_MAX_COMMENT_CHARS) {
        toast.error(
          `Note is too long (max ${INTERNSHIP_SUBMISSION_MAX_COMMENT_CHARS} characters)`,
        );
        return;
      }
      try {
        await apiClient.patch(ENDPOINTS.internshipSubmissions.saveFile(submissionId), {
          question: questionId,
          learnerComment: trimmed,
        });
        lastSavedComment.current = trimmed;
        onLearnerCommentSaved?.(trimmed);
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { error?: { message?: string } } } })
            ?.response?.data?.error?.message ?? "Could not save your note";
        toast.error(msg);
      }
    },
    [submissionId, questionId, onLearnerCommentSaved],
  );

  useEffect(() => {
    if (disabled) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveComment(commentDraft);
    }, 700);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [commentDraft, disabled, saveComment]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || disabled) return;
    if (file.size > INTERNSHIP_SUBMISSION_MAX_FILE_BYTES) {
      toast.error(`Maximum file size is ${maxMb} MB`);
      return;
    }
    const up = await uploadFile(file, INTERNSHIP_SUBMISSION_UPLOAD_FOLDER);
    if (!up.success || !up.data?.url) {
      toast.error(up.error || "Upload failed");
      return;
    }
    try {
      await apiClient.patch(ENDPOINTS.internshipSubmissions.saveFile(submissionId), {
        question: questionId,
        fileUrl: up.data.url,
        learnerComment: commentDraft.trim(),
      });
      toast.success("File saved");
      lastSavedComment.current = commentDraft.trim();
      onLearnerCommentSaved?.(commentDraft.trim());
      onUploaded(up.data.url);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Could not attach file to answer";
      toast.error(msg);
    }
  };

  return (
    <div className="ml-6 space-y-2">
      {currentFileUrl ? (
        <a
          href={currentFileUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-amber-800 underline underline-offset-2"
        >
          View uploaded file
        </a>
      ) : null}
      <div className="flex flex-col gap-1">
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.webp,.zip"
          disabled={disabled || isUploading}
          onChange={(e) => void handleChange(e)}
        />
        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Paperclip className="h-4 w-4" />
          )}
          {isUploading
            ? "Uploading…"
            : currentFileUrl
              ? "Replace file"
              : "Upload file (optional)"}
        </button>
        <p className="text-xs text-stone-500">
          PDF, Office, images, TXT, CSV, ZIP · max {maxMb} MB
        </p>
      </div>

      <div className="space-y-1 pt-1">
        <label className="block text-xs font-medium text-stone-600">
          Written answer / note{" "}
          <span className="font-normal text-stone-400">(optional if you upload a file)</span>
        </label>
        <textarea
          value={commentDraft}
          onChange={(e) => setCommentDraft(e.target.value)}
          disabled={disabled}
          rows={4}
          maxLength={INTERNSHIP_SUBMISSION_MAX_COMMENT_CHARS}
          placeholder="Describe your answer or explain what’s in your file…"
          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-300 disabled:opacity-60"
        />
        <p className="text-xs text-stone-400 text-right tabular-nums">
          {commentDraft.length}/{INTERNSHIP_SUBMISSION_MAX_COMMENT_CHARS}
        </p>
      </div>
    </div>
  );
}
