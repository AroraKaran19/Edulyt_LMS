"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";

type InternshipVerification = {
  internId: string;
  learnerName: string;
  internshipTitle: string;
  batchName?: string;
  status: string;
  enrolledAt?: string;
  offerLetterGeneratedAt?: string;
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return "—";
  }
}

function statusLabel(status: string): { label: string; tone: "ok" | "warn" | "bad" } {
  switch (status) {
    case "enrolled":
      return { label: "Active intern", tone: "ok" };
    case "completed":
      return { label: "Completed", tone: "ok" };
    case "paused":
      return { label: "Paused", tone: "warn" };
    case "dropped":
      return { label: "Withdrew", tone: "bad" };
    case "revoked":
      return { label: "Revoked", tone: "bad" };
    default:
      return { label: status.replace(/_/g, " "), tone: "warn" };
  }
}

export default function VerifyInternPage() {
  const params = useParams();
  const internId = params?.internId as string;

  const [data, setData] = useState<InternshipVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!internId) {
      setError("Intern ID is required");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get(
          ENDPOINTS.internshipEnrollments.verify(internId),
        );
        if (!cancelled) setData(res.data?.data ?? null);
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { error?: { message?: string }; message?: string } } })
            ?.response?.data?.error?.message ??
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Offer letter not found or invalid";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [internId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Verifying offer letter…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Offer Letter Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error ||
              "The offer letter you are looking for does not exist or has been invalidated."}
          </p>
          <p className="text-sm text-gray-500">
            Intern ID:{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">{internId}</code>
          </p>
        </div>
      </div>
    );
  }

  const sl = statusLabel(data.status);
  const toneClass =
    sl.tone === "ok"
      ? "bg-green-100 text-green-800 border-green-200"
      : sl.tone === "warn"
        ? "bg-amber-100 text-amber-800 border-amber-200"
        : "bg-red-100 text-red-800 border-red-200";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Offer Letter Verified
              </h1>
              <p className="text-gray-600 text-sm">
                This offer letter was issued by Airkrit India and is on record.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Intern Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Name</p>
              <p className="text-lg font-semibold text-gray-900">
                {data.learnerName}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Intern ID</p>
              <p className="text-lg font-semibold text-gray-900 font-mono">
                {data.internId}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Program</p>
              <p className="text-lg font-semibold text-gray-900">
                {data.internshipTitle}
              </p>
            </div>

            {data.batchName ? (
              <div>
                <p className="text-sm text-gray-500 mb-1">Cohort</p>
                <p className="text-lg font-semibold text-gray-900">
                  {data.batchName}
                </p>
              </div>
            ) : null}

            <div>
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-sm font-medium capitalize ${toneClass}`}
              >
                {sl.label}
              </span>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Issued on</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatDate(
                  data.offerLetterGeneratedAt ?? data.enrolledAt,
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
