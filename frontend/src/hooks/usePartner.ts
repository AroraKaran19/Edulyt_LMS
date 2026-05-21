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

export interface PartnerAccessFlags {
  courseAnalytics: boolean;
  internshipAnalytics: boolean;
}

export interface PartnerMeResponse {
  college: PartnerCollegeContext;
  access: PartnerAccessFlags;
}

export interface PartnerAccessFlags {
  courseAnalytics: boolean;
  internshipAnalytics: boolean;
}

export interface PartnerMeResponse {
  college: PartnerCollegeContext;
  access: PartnerAccessFlags;
}

export interface PartnerDashboardStats {
  totalStudents: number;
  studentsEnrolledInCourses: number;
  studentsEnrolledInInternships: number;
  totalCourseEnrollments: number;
  totalInternshipEnrollments: number;
  rosterAllTimeCount?: number;
}

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

export interface PartnerCourseCategorySlice {
  categoryId: string;
  categoryName: string;
  audience: "college-students" | "professionals";
  enrollments: number;
  completions: number;
}

export interface PartnerCourseListItem {
  courseId: string;
  title: string;
  slug: string;
  thumbnail: string;
  categories: string[];
  studentsEnrolled: number;
}

export interface PartnerCoursesResponse {
  stats: {
    totalCourses: number;
    totalEnrollments: number;
    distinctLearners: number;
    certificatesIssued: number;
  };
  categoryBreakdown: PartnerCourseCategorySlice[];
  courses: PartnerCourseListItem[];
}

export interface PartnerCoursesStudentRow {
  userId: string;
  name: string;
  email: string;
  coursesEnrolled: number;
  coursesCompleted: number;
  certificatesIssued: number;
}

export interface PartnerCoursesStudentsResponse {
  items: PartnerCoursesStudentRow[];
  total: number;
  page: number;
  pageSize: number;
}

export type PartnerAudience = "college-students" | "professionals";

export interface PartnerEnrollmentRow {
  enrollmentId: string;
  userId: string;
  studentName: string;
  email: string;
  courseId: string;
  courseTitle: string;
  domains: string[];
  audiences: PartnerAudience[];
  status: "active" | "completed";
  certified: boolean;
}

export interface PartnerEnrollmentFilterOptions {
  courses: { courseId: string; title: string }[];
  domains: { categoryId: string; name: string; audience: PartnerAudience }[];
}

export interface PartnerCoursesEnrollmentsResponse {
  items: PartnerEnrollmentRow[];
  total: number;
  page: number;
  pageSize: number;
  filters: PartnerEnrollmentFilterOptions;
}

export interface PartnerFilterCoursesResponse {
  items: { courseId: string; title: string }[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PartnerFilterDomainsResponse {
  items: { categoryId: string; name: string; audience: PartnerAudience }[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PartnerCourseStudentRow {
  userId: string;
  name: string;
  email: string;
  completion: number;
  certified: boolean;
}

export interface PartnerCourseDetailResponse {
  course: {
    courseId: string;
    title: string;
    slug: string;
    thumbnail: string;
    categories: string[];
  };
  stats: {
    studentsEnrolled: number;
    certificatesIssued: number;
    averageCompletion: number;
  };
  students: PartnerCourseStudentRow[];
}

export interface PartnerInternshipListItem {
  internshipId: string;
  title: string;
  slug: string;
  thumbnail: string;
  studentsEnrolled: number;
}

export interface PartnerInternshipsResponse {
  stats: {
    totalInternships: number;
    totalEnrolled: number;
    appearedInExam: number;
    offerLettersReceived: number;
    certificatesIssued: number;
  };
  internships: PartnerInternshipListItem[];
}

export interface PartnerInternshipFunnel {
  enrolled: number;
  appearedInExam: number;
  selected: number;
  certified: number;
}

/** One enrolled student in a batch, with the funnel stages they reached. */
export interface PartnerInternshipBatchStudent {
  name: string;
  email: string;
  appearedInExam: boolean;
  selected: boolean;
  certified: boolean;
}

export interface PartnerInternshipBatchBreakdown {
  batchId: string;
  name: string;
  counts: PartnerInternshipFunnel;
  students: PartnerInternshipBatchStudent[];
}

export interface PartnerInternshipDetailResponse {
  internship: {
    internshipId: string;
    title: string;
    slug: string;
    thumbnail: string;
  };
  totals: PartnerInternshipFunnel;
  batches: PartnerInternshipBatchBreakdown[];
}

interface ApiSuccessBody<T> {
  success: boolean;
  data: T;
  message?: string;
}

/** Thin REST client for the partner portal. Each call returns parsed `data`
 *  or throws; callers can `try/catch` and toast as needed. */
export default function usePartner() {
  const getMe = useCallback(async (): Promise<PartnerMeResponse> => {
    const res = await apiClient.get<ApiSuccessBody<PartnerMeResponse>>(
      "/partner/me",
    );
    return res.data.data;
  }, []);

  const getMe = useCallback(async (): Promise<PartnerMeResponse> => {
    const res = await apiClient.get<ApiSuccessBody<PartnerMeResponse>>(
      "/partner/me",
    );
    return res.data.data;
  }, []);

  const getDashboard = useCallback(
    async (opts?: {
      trendMonths?: number;
      from?: string;
      to?: string;
    }): Promise<PartnerDashboardResponse> => {
    async (opts?: {
      trendMonths?: number;
      from?: string;
      to?: string;
    }): Promise<PartnerDashboardResponse> => {
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

  const getCourses = useCallback(
    async (): Promise<PartnerCoursesResponse> => {
      const res = await apiClient.get<ApiSuccessBody<PartnerCoursesResponse>>(
        "/partner/courses",
      );
      return res.data.data;
    },
    [],
  );

  const getCoursesStudents = useCallback(
    async (opts: {
      page: number;
      pageSize: number;
      q?: string;
    }): Promise<PartnerCoursesStudentsResponse> => {
      const qs = new URLSearchParams({
        page: String(opts.page),
        pageSize: String(opts.pageSize),
      });
      const search = opts.q?.trim() ?? "";
      if (search) qs.set("q", search);
      const res = await apiClient.get<
        ApiSuccessBody<PartnerCoursesStudentsResponse>
      >(`/partner/courses/students?${qs}`);
      return res.data.data;
    },
    [],
  );

  const getCoursesEnrollments = useCallback(
    async (opts: {
      page: number;
      pageSize: number;
      q?: string;
      audience?: PartnerAudience;
      categoryId?: string;
      courseId?: string;
    }): Promise<PartnerCoursesEnrollmentsResponse> => {
      const qs = new URLSearchParams({
        page: String(opts.page),
        pageSize: String(opts.pageSize),
      });
      const search = opts.q?.trim() ?? "";
      if (search) qs.set("q", search);
      if (opts.audience) qs.set("audience", opts.audience);
      if (opts.categoryId) qs.set("categoryId", opts.categoryId);
      if (opts.courseId) qs.set("courseId", opts.courseId);
      const res = await apiClient.get<
        ApiSuccessBody<PartnerCoursesEnrollmentsResponse>
      >(`/partner/courses/enrollments?${qs}`);
      return res.data.data;
    },
    [],
  );

  const getCourseFilterCourses = useCallback(
    async (opts: {
      page: number;
      pageSize: number;
      q?: string;
    }): Promise<PartnerFilterCoursesResponse> => {
      const qs = new URLSearchParams({
        page: String(opts.page),
        pageSize: String(opts.pageSize),
      });
      const search = opts.q?.trim() ?? "";
      if (search) qs.set("q", search);
      const res = await apiClient.get<
        ApiSuccessBody<PartnerFilterCoursesResponse>
      >(`/partner/courses/filter-options/courses?${qs}`);
      return res.data.data;
    },
    [],
  );

  const getCourseFilterDomains = useCallback(
    async (opts: {
      page: number;
      pageSize: number;
      q?: string;
      audience?: PartnerAudience;
    }): Promise<PartnerFilterDomainsResponse> => {
      const qs = new URLSearchParams({
        page: String(opts.page),
        pageSize: String(opts.pageSize),
      });
      const search = opts.q?.trim() ?? "";
      if (search) qs.set("q", search);
      if (opts.audience) qs.set("audience", opts.audience);
      const res = await apiClient.get<
        ApiSuccessBody<PartnerFilterDomainsResponse>
      >(`/partner/courses/filter-options/domains?${qs}`);
      return res.data.data;
    },
    [],
  );

  const getCourseDetail = useCallback(
    async (slug: string): Promise<PartnerCourseDetailResponse> => {
      const res = await apiClient.get<
        ApiSuccessBody<PartnerCourseDetailResponse>
      >(`/partner/courses/${encodeURIComponent(slug)}/analytics`);
      return res.data.data;
    },
    [],
  );

  const getInternships = useCallback(
    async (): Promise<PartnerInternshipsResponse> => {
      const res = await apiClient.get<
        ApiSuccessBody<PartnerInternshipsResponse>
      >("/partner/internships");
      return res.data.data;
    },
    [],
  );

  const getInternshipDetail = useCallback(
    async (slug: string): Promise<PartnerInternshipDetailResponse> => {
  const getInternshipDetail = useCallback(
    async (slug: string): Promise<PartnerInternshipDetailResponse> => {
      const res = await apiClient.get<
        ApiSuccessBody<PartnerInternshipDetailResponse>
      >(`/partner/internships/${encodeURIComponent(slug)}/analytics`);
        ApiSuccessBody<PartnerInternshipDetailResponse>
      >(`/partner/internships/${encodeURIComponent(slug)}/analytics`);
      return res.data.data;
    },
    [],
  );

  return {
    getMe,
    getDashboard,
    getCourses,
    getCoursesStudents,
    getCoursesEnrollments,
    getCourseFilterCourses,
    getCourseFilterDomains,
    getCourseDetail,
    getInternships,
    getInternshipDetail,
  };
}
