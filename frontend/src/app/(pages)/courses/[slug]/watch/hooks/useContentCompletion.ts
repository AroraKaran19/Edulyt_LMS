"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import useEnrollment from "@/hooks/useEnrollment";
import { Content, CourseLesson, CourseModule } from "@/types";
import { toast } from "react-toastify";

interface ContentCompletionState {
  completedContents: Set<string>;
  isTracking: boolean;
  lastUpdateTime: number;
}

interface UseContentCompletionProps {
  courseId: string;
  selectedContent: Content | null;
  selectedLesson: CourseLesson | null;
  selectedModule: CourseModule | null;
  videoProgress: number; // 0-100
  isVideoPlaying: boolean;
}

export const useContentCompletion = ({
  courseId,
  selectedContent,
  selectedLesson,
  selectedModule,
  videoProgress,
  isVideoPlaying,
}: UseContentCompletionProps) => {
  const { data: session } = useSession();
  const { updateEnrollmentProgress, checkEnrollment } = useEnrollment();
  
  const [completionState, setCompletionState] = useState<ContentCompletionState>({
    completedContents: new Set(),
    isTracking: false,
    lastUpdateTime: 0,
  });

  // Load completed contents from enrollment on mount
  useEffect(() => {
    const loadCompletedContents = async () => {
      if (!session?.user || !courseId) return;
      
      try {
        const enrollmentStatus = await checkEnrollment({ courseId });
        if (enrollmentStatus?.enrollment?.completedContents) {
          setCompletionState(prev => ({
            ...prev,
            completedContents: new Set((enrollmentStatus.enrollment as any).completedContents),
          }));
        }
      } catch (error) {
        console.error("Failed to load completed contents:", error);
      }
    };

    loadCompletedContents();
  }, [session?.user, courseId, checkEnrollment]);

  const sessionStartTime = useRef<number>(0);
  const lastProgressUpdate = useRef<number>(0);
  const progressUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const completionThreshold = 90; // Consider content completed at 90% progress
  const progressUpdateIntervalMs = 10000; // Update progress every 10 seconds

  // Initialize session tracking
  useEffect(() => {
    if (selectedContent && isVideoPlaying && !completionState.isTracking) {
      sessionStartTime.current = Date.now();
      setCompletionState(prev => ({ ...prev, isTracking: true }));
    }
  }, [selectedContent, isVideoPlaying, completionState.isTracking]);

  // Stop tracking when content changes or video stops
  useEffect(() => {
    if (!isVideoPlaying || !selectedContent) {
      if (completionState.isTracking) {
        setCompletionState(prev => ({ ...prev, isTracking: false }));
        if (progressUpdateInterval.current) {
          clearInterval(progressUpdateInterval.current);
          progressUpdateInterval.current = null;
        }
      }
    }
  }, [isVideoPlaying, selectedContent, completionState.isTracking]);

  // Check for content completion
  useEffect(() => {
    if (
      !selectedContent ||
      !isVideoPlaying ||
      videoProgress < completionThreshold ||
      completionState.completedContents.has(selectedContent._id!)
    ) {
      return;
    }

    // Mark content as completed
    setCompletionState(prev => ({
      ...prev,
      completedContents: new Set([...prev.completedContents, selectedContent._id!]),
    }));

    // Show completion notification
    toast.success(`Completed: ${selectedContent.title || 'Content'}`, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });

    // Update enrollment progress immediately
    updateProgressInEnrollment();
  }, [videoProgress, selectedContent, isVideoPlaying, completionState.completedContents]);

  // Periodic progress updates
  useEffect(() => {
    if (!completionState.isTracking || !selectedContent) return;

    const updateProgress = () => {
      const currentTime = Date.now();
      const timeSpent = currentTime - sessionStartTime.current;
      
      // Only update if significant time has passed
      if (timeSpent - lastProgressUpdate.current >= progressUpdateIntervalMs) {
        updateProgressInEnrollment();
        lastProgressUpdate.current = currentTime;
      }
    };

    // Set up interval for periodic updates
    progressUpdateInterval.current = setInterval(updateProgress, progressUpdateIntervalMs);

    return () => {
      if (progressUpdateInterval.current) {
        clearInterval(progressUpdateInterval.current);
        progressUpdateInterval.current = null;
      }
    };
  }, [completionState.isTracking, selectedContent]);

  // Update enrollment progress in backend
  const updateProgressInEnrollment = useCallback(async () => {
    if (!session?.user || !courseId || !selectedContent || !selectedLesson || !selectedModule) {
      return;
    }

    try {
      const currentTime = Date.now();
      const sessionDuration = sessionStartTime.current > 0 ? currentTime - sessionStartTime.current : 0;
      const timeSpentMinutes = Math.round(sessionDuration / 60000); // Convert to minutes

      // Calculate progress based on completed contents
      const totalContents = calculateTotalContents();
      const completedCount = completionState.completedContents.size;
      const overallProgress = totalContents > 0 ? Math.round((completedCount / totalContents) * 100) : 0;

      // Get enrollment ID first
      const enrollmentStatus = await checkEnrollment({ courseId });
      if (!enrollmentStatus?.enrollment?._id) {
        console.log("No enrollment found for this course");
        return;
      }

      // Update enrollment progress with correct arguments
      await updateEnrollmentProgress(enrollmentStatus.enrollment._id, {
        moduleId: selectedModule._id!,
        lessonId: selectedLesson._id!,
        contentId: selectedContent._id!,
        contentType: selectedContent.type as "video" | "quiz" | "document",
        lastPosition: videoProgress,
        completed: completionState.completedContents.has(selectedContent._id!),
        timeSpent: timeSpentMinutes,
      });

      // Refresh completed contents from updated enrollment
      const updatedEnrollmentStatus = await checkEnrollment({ courseId });
      if (updatedEnrollmentStatus?.enrollment?.completedContents) {
        setCompletionState(prev => ({
          ...prev,
          completedContents: new Set((updatedEnrollmentStatus.enrollment as any).completedContents),
        }));
      }

      console.log(`Progress updated: ${overallProgress}% (${completedCount}/${totalContents} contents completed)`);

    } catch (error) {
      console.error("Failed to update enrollment progress:", error);
      toast.error("Failed to update progress", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  }, [
    session?.user,
    courseId,
    selectedContent,
    selectedLesson,
    selectedModule,
    completionState.completedContents,
    videoProgress,
  ]);

  // Helper functions to calculate totals
  const calculateTotalContents = useCallback(() => {
    // This would ideally come from course data, but for now we'll estimate
    // In a real implementation, you'd pass the full course data
    return 10; // Placeholder - should be calculated from course structure
  }, []);

  const getTotalModules = useCallback(() => {
    // Placeholder - should be calculated from course structure
    return 3;
  }, []);

  const getCompletedModules = useCallback(() => {
    // Placeholder - should be calculated based on completed lessons in each module
    return 1;
  }, []);

  const getTotalLessons = useCallback(() => {
    // Placeholder - should be calculated from course structure
    return 8;
  }, []);

  const getCompletedLessons = useCallback(() => {
    // Placeholder - should be calculated based on completed contents in each lesson
    return 2;
  }, []);

  // Manual completion trigger (for non-video content)
  const markContentAsCompleted = useCallback(async (contentId: string) => {
    if (completionState.completedContents.has(contentId)) {
      return; // Already completed
    }

    setCompletionState(prev => ({
      ...prev,
      completedContents: new Set([...prev.completedContents, contentId]),
    }));

    toast.success("Content marked as completed!", {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });

    // Update enrollment progress
    await updateProgressInEnrollment();
  }, [completionState.completedContents, updateProgressInEnrollment]);

  // Get completion status for a specific content
  const isContentCompleted = useCallback((contentId: string) => {
    return completionState.completedContents.has(contentId);
  }, [completionState.completedContents]);

  // Get overall completion percentage
  const getOverallCompletion = useCallback(() => {
    const totalContents = calculateTotalContents();
    const completedCount = completionState.completedContents.size;
    return totalContents > 0 ? Math.round((completedCount / totalContents) * 100) : 0;
  }, [completionState.completedContents, calculateTotalContents]);

  return {
    completedContents: completionState.completedContents,
    isTracking: completionState.isTracking,
    markContentAsCompleted,
    isContentCompleted,
    getOverallCompletion,
    updateProgressInEnrollment,
  };
};
