"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileText,
  Lock,
  TriangleAlert,
} from "lucide-react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import Loader from "@/components/ui/Loader";

type TaskRow = {
  _id: string;
  title: string;
  description: string;
  totalScore: number;
  questionCount: number;
  isUnlocked: boolean;
  isDue: boolean;
  isClamped: boolean;
  visibleFrom: string;
  dueAt: string;
};

type EnrollmentDetail = {
  _id: string;
  title: string;
  description: string;
  courseTitle: string;
  startDate: string;
  endDate: string;
  durationMonths: number;
  status: "active" | "completed" | "expired";
  daysRemaining: number;
  whatsappGroupLink: string;
  documentation: {
    required: boolean;
    dueAt: string | null;
    status: string;
    files: string[];
    rejectionNote: string;
  };
  certificateUrl: string;
  offerLetterUrl: string;
  tasks: TaskRow[];
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

export default function CourseInternshipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const enrollmentId = String(params?.enrollmentId ?? "");

  const [data, setData] = useState<EnrollmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    if (!enrollmentId) return;
    setIsLoading(true);
    try {
      const res = await apiClient.get(
        ENDPOINTS.courseInternshipEnrollments.mineById(enrollmentId),
      );
      setData(res.data?.data ?? null);
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [enrollmentId]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader size="lg" variant="spinner" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-600 font-medium">Internship not found</p>
        <button
          type="button"
          onClick={() => router.push("/dashboard/course-internships")}
          className="mt-3 text-sm text-orange-600 underline cursor-pointer"
        >
          Back to my course internships
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/course-internships")}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          My course internships
        </button>

        <h1 className="text-2xl font-bold text-text-primary">{data.title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Running alongside {data.courseTitle || "your course"}
        </p>
        {data.description && (
          // Authored with the rich-text editor, same as internships.
          <div
            className="prose prose-sm max-w-none mt-3 text-text-primary"
            dangerouslySetInnerHTML={{ __html: data.description }}
          />
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-1.5 text-gray-600">
            <CalendarDays className="size-4" />
            {formatDate(data.startDate)} – {formatDate(data.endDate)}
          </span>
          <span className="font-semibold text-text-primary">
            {data.status === "active"
              ? `${data.daysRemaining} day${data.daysRemaining === 1 ? "" : "s"} left`
              : data.status}
          </span>
          {data.whatsappGroupLink && (
            <a
              href={data.whatsappGroupLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 underline"
            >
              Join the WhatsApp group
            </a>
          )}
        </div>
      </div>

      {data.documentation.required && (
        <section className="rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-gray-500" />
            <h2 className="font-bold text-text-primary">Documents</h2>
            <span className="ml-auto text-xs font-semibold text-gray-500 capitalize">
              {data.documentation.status}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-gray-500">
            Due by {formatDate(data.documentation.dueAt)}.
          </p>
          {data.documentation.rejectionNote && (
            <p className="mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-700">
              {data.documentation.rejectionNote}
            </p>
          )}
        </section>
      )}

      <section>
        <h2 className="font-bold text-text-primary mb-3">Tasks</h2>

        {data.tasks.length === 0 ? (
          <p className="rounded-xl border border-gray-200 p-4 text-sm text-gray-500">
            No tasks fall inside your {data.durationMonths}-month programme.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {data.tasks.map((task) => (
              <li
                key={task._id}
                className={`rounded-xl border p-4 ${
                  task.isUnlocked
                    ? "border-gray-200"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {task.isUnlocked ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-orange-500" />
                  ) : (
                    <Lock className="mt-0.5 size-4 shrink-0 text-gray-400" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-text-primary">
                        {task.title}
                      </h3>
                      {task.isDue && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                          Closed
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>
                        {task.isUnlocked
                          ? `Due ${formatDate(task.dueAt)}`
                          : `Unlocks ${formatDate(task.visibleFrom)}`}
                      </span>
                      <span>{task.totalScore} points</span>
                      {task.questionCount > 0 && (
                        <span>{task.questionCount} questions</span>
                      )}
                    </div>

                    {task.isClamped && (
                      <p className="mt-2 inline-flex items-start gap-1.5 text-xs text-amber-700">
                        <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                        This deadline was shortened to your programme end date.
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
