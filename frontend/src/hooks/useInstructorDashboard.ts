import { useState, useEffect, useCallback } from "react";
import apiClient from "@/configs/apiConfig";

export interface InstructorCourseSummary {
  _id: string;
  title: string;
  slug: string;
  thumbnail?: string;
  totalLearners: number;
  activeLearners: number;
  completedLearners: number;
  avgProgress: number;
  newEnrollments30d: number;
  pendingQnaCount: number;
}

export interface InstructorRecentQna {
  _id: string;
  message: string;
  createdAt: string;
  approved: boolean;
  notifyInstructor: boolean;
  course: { _id: string; title: string; slug?: string };
  authorName: string;
  replyCount: number;
  lessonId?: string | null;
  contentId?: string | null;
}

export interface InstructorDashboardSummary {
  coursesCount: number;
  uniqueLearners: number;
  averageLearnerProgress: number;
  activeEnrollments: number;
  completedEnrollments: number;
  newEnrollmentsLast30Days: number;
  certificatesIssued: number;
  pendingQnaCount: number;
  liveSessionsCount: number;
  upcomingLiveSessions: number;
}

export interface InstructorDashboardData {
  summary: InstructorDashboardSummary;
  courses: InstructorCourseSummary[];
  recentQnas: InstructorRecentQna[];
}

export default function useInstructorDashboard() {
  const [data, setData] = useState<InstructorDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/instructor/dashboard");
      setData(res.data?.data ?? res.data);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Failed to load dashboard";
      setError(msg);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, isLoading, error, refetch: fetchDashboard };
}
