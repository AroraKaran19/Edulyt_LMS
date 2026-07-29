"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, CalendarDays } from "lucide-react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import Loader from "@/components/ui/Loader";

type EnrollmentRow = {
  _id: string;
  title: string;
  courseTitle: string;
  startDate: string;
  endDate: string;
  durationMonths: number;
  status: "active" | "completed" | "expired";
  daysRemaining: number;
};

const formatDate = (iso?: string) => {
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

const STATUS_STYLES: Record<EnrollmentRow["status"], string> = {
  active: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  expired: "bg-gray-100 text-gray-600",
};

export default function CourseInternshipsPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEnrollments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(ENDPOINTS.courseInternshipEnrollments.mine);
      setEnrollments(res.data?.data?.enrollments ?? []);
    } catch {
      setEnrollments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEnrollments();
  }, [fetchEnrollments]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader size="lg" variant="spinner" />
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Briefcase className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium">No course internships yet</p>
        <p className="text-gray-400 text-sm mt-1">
          Add one at checkout when you buy a course that offers it.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {enrollments.map((row) => (
        <Link
          key={row._id}
          href={`/dashboard/course-internships/${row._id}`}
          className="group flex flex-col gap-3 rounded-xl border border-gray-200 p-4 transition-colors hover:border-orange-300 hover:bg-orange-50/40 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-text-primary truncate">
                {row.title}
              </h2>
              <span
                className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[row.status]}`}
              >
                {row.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 truncate">
              With {row.courseTitle || "your course"}
            </p>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <div className="text-sm">
              <div className="flex items-center gap-1.5 text-gray-500">
                <CalendarDays className="size-3.5" />
                <span className="text-xs">
                  {formatDate(row.startDate)} – {formatDate(row.endDate)}
                </span>
              </div>
              <p className="mt-0.5 text-xs font-semibold text-text-primary">
                {row.status === "active"
                  ? `${row.daysRemaining} day${row.daysRemaining === 1 ? "" : "s"} left`
                  : `${row.durationMonths} month${row.durationMonths === 1 ? "" : "s"}`}
              </p>
            </div>
            <ArrowRight className="size-4 text-gray-400 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>
      ))}
    </div>
  );
}
