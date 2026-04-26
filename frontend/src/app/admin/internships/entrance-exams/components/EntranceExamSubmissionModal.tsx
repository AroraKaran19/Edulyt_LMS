"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { toast } from "react-toastify";
import { ExternalLink } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string | null;
};

export default function EntranceExamSubmissionModal({
  isOpen,
  onClose,
  submissionId,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [doc, setDoc] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!isOpen || !submissionId) {
      setDoc(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(
          ENDPOINTS.internshipSubmissions.adminById(submissionId),
        );
        const d = res.data?.data as Record<string, unknown> | undefined;
        if (!cancelled) setDoc(d ?? null);
      } catch {
        if (!cancelled) {
          toast.error("Could not load submission");
          onClose();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, submissionId, onClose]);

  const snap = doc?.templateSnapshot as
    | { title?: string; questions?: { questionId: string; questionText: string; type: string; score: number }[] }
    | undefined;
  const mcq = (doc?.mcqResponses as { question: string; selectedOptions?: string[]; awardedScore?: number; isCorrect?: boolean }[]) ?? [];
  const files = (doc?.fileResponses as { question: string; currentFile: string; status?: string; awardedScore?: number }[]) ?? [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Exam submission"
      className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
    >
      {loading ? (
        <div className="py-10 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      ) : !doc ? (
        <p className="text-gray-500 text-sm py-4">No data.</p>
      ) : (
        <div className="space-y-4 text-sm">
          {snap?.title ? (
            <p className="font-medium text-gray-900">{snap.title}</p>
          ) : null}
          <p className="text-xs text-gray-500">
            Status: {String(doc.status ?? "—")} · Total score:{" "}
            {typeof doc.totalAwardedScore === "number" ? doc.totalAwardedScore : "—"}
          </p>
          {snap?.questions?.map((q) => {
            if (q.type === "mcq") {
              const r = mcq.find((m) => m.question === q.questionId);
              return (
                <div
                  key={q.questionId}
                  className="rounded-lg border border-gray-200 p-3 space-y-1"
                >
                  <p className="text-xs font-semibold text-orange-600 uppercase">
                    MCQ · {q.score} pts
                  </p>
                  <p className="text-gray-900">{q.questionText}</p>
                  <p className="text-gray-600">
                    Selected:{" "}
                    {r?.selectedOptions?.length
                      ? r.selectedOptions.join(", ")
                      : "—"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {r?.awardedScore != null
                      ? `Score: ${r.awardedScore} · ${r.isCorrect ? "Correct" : "Incorrect"}`
                      : "—"}
                  </p>
                </div>
              );
            }
            const f = files.find((x) => x.question === q.questionId);
            return (
              <div
                key={q.questionId}
                className="rounded-lg border border-gray-200 p-3 space-y-1"
              >
                <p className="text-xs font-semibold text-amber-600 uppercase">
                  File upload · {q.score} pts
                </p>
                <p className="text-gray-900">{q.questionText}</p>
                {f?.currentFile ? (
                  <a
                    href={f.currentFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-orange-600 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open file
                  </a>
                ) : (
                  <p className="text-gray-500">No file</p>
                )}
                <p className="text-xs text-gray-500">
                  Status: {f?.status ?? "—"}
                  {f?.awardedScore != null
                    ? ` · Score: ${f.awardedScore}`
                    : ""}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
