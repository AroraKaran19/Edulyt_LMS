"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { toast } from "react-toastify";
import type { InternshipEnrollmentListRow } from "@/types";

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function userLabel(u: InternshipEnrollmentListRow["user"]) {
  if (!u) return "—";
  if (u.name?.trim()) return u.name.trim();
  const n = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return n || u.email || u._id;
}

type Props = {
  isOpen: boolean;
  enrollmentId: string | null;
  onClose: () => void;
};

export default function InternshipEnrollmentDetailModal({
  isOpen,
  enrollmentId,
  onClose,
}: Props) {
  const [detail, setDetail] = useState<InternshipEnrollmentListRow | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !enrollmentId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(
          ENDPOINTS.internshipEnrollments.adminById(enrollmentId),
        );
        const d = res.data?.data as InternshipEnrollmentListRow | undefined;
        if (!cancelled) setDetail(d ?? null);
      } catch {
        if (!cancelled) {
          toast.error("Could not load enrollment");
          onClose();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, enrollmentId, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Internship enrollment"
      className="max-w-lg w-full mx-4 max-h-[90vh]"
    >
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      ) : !detail ? (
        <p className="text-gray-500 text-center py-6">No data.</p>
      ) : (
        <div className="flex flex-col gap-3 text-sm">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Learner
            </p>
            <p className="text-gray-900 font-medium">{userLabel(detail.user)}</p>
            {detail.user?.email ? (
              <p className="text-xs text-gray-500">{detail.user.email}</p>
            ) : null}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Internship
            </p>
            <p className="text-gray-900">{detail.internship?.title ?? "—"}</p>
          </div>
          {detail.batchSnapshot ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Batch
              </p>
              <p className="text-gray-900">{detail.batchSnapshot.name}</p>
              <p className="text-xs text-gray-500">
                Starts {formatDate(detail.batchSnapshot.internshipStartDate)}
              </p>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Path
              </p>
              <p className="text-gray-800 capitalize">
                {detail.enrollmentType ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Status
              </p>
              <p className="text-gray-800">{detail.status.replace(/_/g, " ")}</p>
            </div>
            {typeof detail.examScore === "number" ? (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                  Exam score
                </p>
                <p className="text-gray-800 tabular-nums">{detail.examScore}</p>
              </div>
            ) : null}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Success points
              </p>
              <p className="text-gray-800 tabular-nums">
                {detail.internshipSuccessPoints}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Enrolled at
            </p>
            <p className="text-gray-800">{formatDate(detail.enrolledAt)}</p>
          </div>
          <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
            Updated {formatDate(detail.updatedAt)}
          </div>
        </div>
      )}
    </Modal>
  );
}
