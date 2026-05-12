"use client";

import { useCallback } from "react";
import apiClient from "@/configs/apiConfig";

export interface PartnerCollegeContext {
  _id: string;
  name: string;
  location: string;
  website?: string;
  image?: string;
}

export interface PartnerDashboardStats {
  totalStudents: number;
  studentsEnrolledInCourses: number;
  studentsEnrolledInInternships: number;
  totalCourseEnrollments: number;
  totalInternshipEnrollments: number;
  /** When `from`/`to` are sent; full roster size for context. */
  rosterAllTimeCount?: number;
}

/** One bucket per calendar month — backend fills zeros for continuity. */
export interface PartnerMonthlyTrendPoint {
  year: number;
  month: number;
  newStudents: number;
  courseEnrollments: number;
  internshipEnrollments: number;
}

export interface PartnerDashboardTrends {
  durationMonths: number;
  monthlyTrend: PartnerMonthlyTrendPoint[];
}

export interface PartnerDashboardResponse {
  college: PartnerCollegeContext;
  stats: PartnerDashboardStats;
  trends: PartnerDashboardTrends;
}

export interface PartnerStudentRow {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: string;
  collegeName?: string;
  createdAt?: string;
  enrolledCourses: number;
  enrolledInternships: number;
}

export interface ListPartnerStudentsResponse {
  students: PartnerStudentRow[];
  total: number;
  page: number;
  totalPages: number;
}

interface ApiSuccessBody<T> {
  success: boolean;
  data: T;
  message?: string;
}

/** Thin REST client for the partner portal. Each call returns parsed `data`
 *  or throws; callers can `try/catch` and toast as needed. */
export default function usePartner() {
  const getDashboard = useCallback(
    async (
      opts?: {
        trendMonths?: number;
        /** `YYYY-MM-DD` (UTC calendar day bounds on backend). */
        from?: string;
        to?: string;
      },
    ): Promise<PartnerDashboardResponse> => {
      const monthsRaw = opts?.trendMonths;
      const clamped =
        typeof monthsRaw === "number" && Number.isFinite(monthsRaw)
          ? Math.min(24, Math.max(3, Math.floor(monthsRaw)))
          : 6;
      const qs = new URLSearchParams({ months: String(clamped) });
      const fromTrim = opts?.from?.trim() ?? "";
      const toTrim = opts?.to?.trim() ?? "";
      if (fromTrim && toTrim) {
        qs.set("from", fromTrim);
        qs.set("to", toTrim);
      }
      const res = await apiClient.get<ApiSuccessBody<PartnerDashboardResponse>>(
        `/partner/dashboard?${qs}`,
      );
      return res.data.data;
    },
    [],
  );

  const getMe = useCallback(async (): Promise<{
    college: PartnerCollegeContext;
  }> => {
    const res = await apiClient.get<
      ApiSuccessBody<{ college: PartnerCollegeContext }>
    >("/partner/me");
    return res.data.data;
  }, []);

  const listStudents = useCallback(
    async (params: {
      page?: number;
      limit?: number;
      search?: string;
    }): Promise<ListPartnerStudentsResponse> => {
      const q = new URLSearchParams();
      if (params.page) q.set("page", String(params.page));
      if (params.limit) q.set("limit", String(params.limit));
      if (params.search?.trim()) q.set("search", params.search.trim());
      const res = await apiClient.get<
        ApiSuccessBody<ListPartnerStudentsResponse>
      >(`/partner/students?${q.toString()}`);
      return res.data.data;
    },
    [],
  );

  return { getDashboard, getMe, listStudents };
}
