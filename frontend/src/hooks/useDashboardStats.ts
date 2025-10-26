import { useState, useCallback, useEffect } from "react";
import useUserEnrollments from "./useUserEnrollments";
import { Enrollment } from "@/types/enrollment";

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

  const { getUserEnrollments, calculateProgress } = useUserEnrollments();

  const calculateStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get all user enrollments
      const result = await getUserEnrollments({
        page: 1,
        limit: 100, // Get all enrollments for stats calculation
      });

      if (!result) {
        throw new Error("Failed to fetch enrollment data");
      }

      const enrollments = result.enrollments;

      // Calculate basic stats
      const totalCourses = enrollments.length;
      const completedCourses = enrollments.filter(
        (enrollment) => enrollment.status === "completed"
      ).length;
      const inProgressCourses = enrollments.filter(
        (enrollment) => enrollment.status === "active"
      ).length;

      // Calculate total time spent (convert from seconds to minutes)
      const totalTimeSpent =
        enrollments.reduce(
          (total, enrollment) => total + (enrollment.totalTimeSpent || 0),
          0
        ) / 60; // Convert seconds to minutes

      // Calculate average progress
      const totalProgress =
        enrollments.length > 0
          ? enrollments.reduce((total, enrollment) => {
              return total + calculateProgress(enrollment);
            }, 0) / enrollments.length
          : 0;

      // Calculate average time per session (simplified)
      const averageTimePerSession =
        totalCourses > 0 ? totalTimeSpent / totalCourses : 0;

      // Calculate daily goal progress (simplified - episodes completed today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const coursesAccessedToday = enrollments.filter((enrollment) => {
        const lastActivity = enrollment.lastActivityAt;
        if (!lastActivity) return false;
        return new Date(lastActivity) >= today;
      }).length;

      // Calculate streak (simplified - consecutive days with activity)
      const streak = calculateStreak(enrollments);

      // Get most recent activity
      const lastActivityAt = enrollments.reduce((latest, enrollment) => {
        const activityDate = enrollment.lastActivityAt;
        if (!activityDate) return latest;

        const activityDateObj = new Date(activityDate);
        if (!latest || activityDateObj > latest) {
          return activityDateObj;
        }
        return latest;
      }, null as Date | null);

      const newStats: DashboardStats = {
        totalTimeSpent: Math.round(totalTimeSpent),
        averageTimePerSession: Math.round(averageTimePerSession),
        totalCourses,
        completedCourses,
        inProgressCourses,
        totalProgress: Math.round(totalProgress),
        dailyGoal: {
          target: 10,
          completed: coursesAccessedToday,
          streak,
        },
        recentActivity: {
          lastActivityAt,
          coursesAccessedToday,
        },
      };

      setStats(newStats);
    } catch (err: any) {
      const errorMsg =
        err.message || "Failed to calculate dashboard statistics";
      setError(errorMsg);
      console.error("Dashboard stats calculation error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [getUserEnrollments, calculateProgress]);

  // Calculate streak (simplified implementation)
  const calculateStreak = useCallback((enrollments: Enrollment[]): number => {
    // This is a simplified streak calculation
    // In a real implementation, you'd track daily activity more precisely
    const today = new Date();
    let streak = 0;

    for (let i = 0; i < 30; i++) {
      // Check last 30 days
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      checkDate.setHours(0, 0, 0, 0);

      const hasActivity = enrollments.some((enrollment) => {
        const lastActivity = enrollment.lastActivityAt;
        if (!lastActivity) return false;

        const activityDate = new Date(lastActivity);
        if (isNaN(activityDate.getTime())) return false; // Check if valid date

        activityDate.setHours(0, 0, 0, 0);

        return activityDate.getTime() === checkDate.getTime();
      });

      if (hasActivity) {
        streak++;
      } else if (i > 0) {
        // Don't break streak on first day if no activity
        break;
      }
    }

    return streak;
  }, []);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  const refreshStats = useCallback(() => {
    calculateStats();
  }, [calculateStats]);

  return {
    stats,
    isLoading,
    error,
    refreshStats,
  };
};

export default useDashboardStats;
