"use client";

import Modal from "@/components/ui/Modal";
import type {
  AssessmentSubmission,
  FileSubmission,
  MCQSubmission,
} from "@/types/assessment";
import { Download } from "lucide-react";
import { MOCK_FILE_POOL, MOCK_MCQ_POOL, MOCK_USER_LABELS } from "./mockData";
import WhiteButton from "@/components/ui/buttons/WhiteButton";

type Props = {
  row: AssessmentSubmission | null;
  onClose: () => void;
};

function mcqQuestionLabel(questionId: string) {
  const q = MOCK_MCQ_POOL.find((x) => x._id === questionId);
  return q?.preview ?? questionId;
}

function fileQuestionLabel(questionId: string) {
  const q = MOCK_FILE_POOL.find((x) => x._id === questionId);
  return q?.preview ?? questionId;
}

function extractFileName(filePath: string): string {
  const parts = filePath.split("/");
  return parts[parts.length - 1] || filePath;
}

function handleFileDownload(fileUrl: string) {
  const fileName = extractFileName(fileUrl);
  alert(
    `Download initiated for: ${fileName}\n\nIn production, this will fetch a signed URL from the backend.`,
  );
}

function McqSubmissionBody({ submission }: { submission: MCQSubmission }) {
  return (
    <div className="space-y-3">
      {submission.responses.map((r, i) => (
        <div
          key={`${r.question}-${i}`}
          className="border-b border-gray-100 pb-3 last:border-0"
        >
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Question {i + 1}
          </p>
          <p className="text-sm text-gray-900 mb-2">
            {mcqQuestionLabel(r.question)}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {r.selectedAnswers.map((a, idx) => (
              <span
                key={idx}
                className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 rounded"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FileSubmissionBody({ submission }: { submission: FileSubmission }) {
  return (
    <div className="space-y-3">
      {submission.uploads.map((u, i) => {
        const fileName = extractFileName(u.file);
        return (
          <div
            key={`${u.question}-${i}`}
            className="border-b border-gray-100 pb-3 last:border-0"
          >
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Upload {i + 1}
            </p>
            <p className="text-sm text-gray-900 mb-2">
              {fileQuestionLabel(u.question)}
            </p>
            <div className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded p-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {fileName}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Score: <span className="font-mono">{u.qualifyingScore}</span>
                </p>
              </div>
              <WhiteButton
                type="button"
                onClick={() => handleFileDownload(u.file)}
                className="flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </WhiteButton>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const SubmissionDetailPanel = ({ row, onClose }: Props) => {
  if (!row) return null;

  const extra = MOCK_USER_LABELS[row.user];
  const userLabel = extra?.name ?? row.user;

  const getStatusClass = (status?: string) => {
    switch (status) {
      case "graded":
        return "bg-green-100 text-green-800 border-green-200";
      case "submitted":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Submission detail"
      className="max-w-2xl"
    >
      <div className="space-y-4">
        <div className="space-y-3 pb-4 border-b border-gray-100">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Learner
              </p>
              <div className="text-sm font-medium text-gray-900 mt-0.5">
                <div>{userLabel}</div>
                {extra && (
                  <div className="text-gray-500 text-xs mt-0.5">
                    {extra.email}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </p>
              <div className="mt-1">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border capitalize ${getStatusClass(
                    row.status,
                  )}`}
                >
                  {row.status ?? "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </p>
              <div className="text-sm font-medium text-gray-900 mt-0.5">
                {row.earnedPoints != null ? (
                  <>
                    <span className="font-mono">{row.earnedPoints}</span>
                    {" / "}
                    <span className="font-mono text-gray-500">
                      {row.qualifyingScore}
                    </span>
                  </>
                ) : (
                  <span className="font-mono">{row.qualifyingScore}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            {row.submissionType === "mcq" ? "Responses" : "Submitted files"}
          </h3>
          {row.submissionType === "mcq" ? (
            <McqSubmissionBody submission={row.submission as MCQSubmission} />
          ) : (
            <FileSubmissionBody submission={row.submission as FileSubmission} />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SubmissionDetailPanel;
