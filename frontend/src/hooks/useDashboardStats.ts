import { useState, useCallback, useEffect } from "react";
import apiClient from "@/configs/apiConfig";

export interface DashboardStats {
  totalTimeSpent: number; // in minutes
  averageTimePerSession: number; // in minutes
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalProgress: number; // average progress across all courses
  dailyGoal: {
    target: number;
    completed: number;
    streak: number;
  };
  recentActivity: {
    lastActivityAt: Date | null;
    coursesAccessedToday: number;
  };
}

const useDashboardStats = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalTimeSpent: 0,
    averageTimePerSession: 0,
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalProgress: 0,
    dailyGoal: {
      target: 10, // episodes per day
      completed: 0,
      streak: 0,
    },
    recentActivity: {
      lastActivityAt: null,
      coursesAccessedToday: 0,
    },
  });

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get("/enrollments/dashboard-stats");
      const data = response.data.data;

      // Transform backend response to match frontend interface
      const newStats: DashboardStats = {
        totalTimeSpent: data.totalTimeSpent || 0,
        averageTimePerSession: data.averageTimePerSession || 0,
        totalCourses: data.totalCourses || 0,
        completedCourses: data.completedCourses || 0,
        inProgressCourses: data.inProgressCourses || 0,
        totalProgress: data.totalProgress || 0,
        dailyGoal: {
          target: data.dailyGoal?.target || 10,
          completed: data.dailyGoal?.completed || 0,
          streak: data.dailyGoal?.streak || 0,
        },
        recentActivity: {
          lastActivityAt: data.recentActivity?.lastActivityAt
            ? new Date(data.recentActivity.lastActivityAt)
            : null,
          coursesAccessedToday: data.recentActivity?.coursesAccessedToday || 0,
        },
      };

      setStats(newStats);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error?.message ||
        err.message ||
        "Failed to fetch dashboard statistics";
      setError(errorMsg);
      console.error("Dashboard stats fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refreshStats = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refreshStats,
  };
};

export default useDashboardStats;
