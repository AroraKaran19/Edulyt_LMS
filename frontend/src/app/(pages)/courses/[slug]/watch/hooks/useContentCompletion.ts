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
          // Extract contentIds from ContentCompletion objects
          const contentIds = (enrollmentStatus.enrollment.completedContents as any[]).map(
            (completion) => typeof completion === 'string' ? completion : completion.contentId
          );
          setCompletionState(prev => ({
            ...prev,
            completedContents: new Set(contentIds),
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
  
  // Check for content completion - use ref to track if we've already marked this content
  // Must be defined before useEffects that use it
  const completionCheckRef = useRef<Set<string>>(new Set());

  // Helper function to calculate totals - must be defined early
  const calculateTotalContents = useCallback(() => {
    // This would ideally come from course data, but for now we'll estimate
    // In a real implementation, you'd pass the full course data
    return 10; // Placeholder - should be calculated from course structure
  }, []);

  // Update enrollment progress in backend - must be defined before useEffects that use it
  const updateProgressInEnrollment = useCallback(async (
    markAsCompleted: boolean = false,
    contentIdToCheck?: string
  ) => {
    if (!session?.user || !courseId || !selectedContent || !selectedLesson || !selectedModule) {
      return;
    }

    try {
      const currentTime = Date.now();
      const sessionDuration = sessionStartTime.current > 0 ? currentTime - sessionStartTime.current : 0;
      const timeSpentMinutes = Math.round(sessionDuration / 60000); // Convert to minutes

      // Get the content ID to check (use provided one or current selected content)
      const targetContentId = contentIdToCheck || selectedContent._id!;
      
      // Check if content is completed (use current state or provided flag)
      const isCompleted = markAsCompleted || completionState.completedContents.has(targetContentId);

      // Calculate progress based on completed contents
      const totalContents = calculateTotalContents();
      const completedCount = completionState.completedContents.size + (markAsCompleted && !completionState.completedContents.has(targetContentId) ? 1 : 0);
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
        contentId: targetContentId,
        contentType: selectedContent.type as "video" | "quiz" | "document",
        lastPosition: videoProgress,
        completed: isCompleted,
        timeSpent: timeSpentMinutes,
      });

      // Refresh completed contents from updated enrollment
      const updatedEnrollmentStatus = await checkEnrollment({ courseId });
      if (updatedEnrollmentStatus?.enrollment?.completedContents) {
        // Extract contentIds from ContentCompletion objects
        const contentIds = (updatedEnrollmentStatus.enrollment.completedContents as any[]).map(
          (completion) => typeof completion === 'string' ? completion : completion.contentId
        );
        setCompletionState(prev => ({
          ...prev,
          completedContents: new Set(contentIds),
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
    checkEnrollment,
    updateEnrollmentProgress,
    calculateTotalContents,
  ]);

  // Initialize session tracking
  useEffect(() => {
    if (selectedContent && isVideoPlaying && !completionState.isTracking) {
      sessionStartTime.current = Date.now();
      setCompletionState(prev => ({ ...prev, isTracking: true }));
    }
  }, [selectedContent, isVideoPlaying, completionState.isTracking]);

  // Stop tracking when content changes or video stops
  // Also check for completion when video pauses/stops
  useEffect(() => {
    if (!isVideoPlaying || !selectedContent) {
      if (completionState.isTracking) {
        setCompletionState(prev => ({ ...prev, isTracking: false }));
        if (progressUpdateInterval.current) {
          clearInterval(progressUpdateInterval.current);
          progressUpdateInterval.current = null;
        }
      }
      
      // Check for completion when video pauses/stops if progress is high enough
      // IMPORTANT: Only check if this is the currently tracked content (not a stale check from content switch)
      if (selectedContent && selectedContent.type === "video" && selectedContent._id) {
        const contentId = selectedContent._id;
        
        // Verify this is the correct content (not stale from previous video)
        if (lastContentIdRef.current !== contentId) {
          return;
        }
        
        // Only check if video was actually being tracked (was playing) and progress is high enough
        if (
          completionState.isTracking && // Video was playing before pause
          !completionState.completedContents.has(contentId) &&
          !completionCheckRef.current.has(contentId) &&
          videoProgress >= completionThreshold
        ) {
          // Mark as checked to prevent duplicate checks
          completionCheckRef.current.add(contentId);

          // Mark content as completed in state
          setCompletionState(prev => {
            if (prev.completedContents.has(contentId)) {
              return prev;
            }
            return {
              ...prev,
              completedContents: new Set([...prev.completedContents, contentId]),
            };
          });

          // Show completion notification
          toast.success(`Completed: ${selectedContent.title || 'Content'}`, {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });

          // Update enrollment progress immediately with completion flag
          setTimeout(() => {
            updateProgressInEnrollment(true, contentId);
          }, 100);
        }
      }
    }
  }, [isVideoPlaying, selectedContent, completionState.isTracking, completionState.completedContents, videoProgress, completionThreshold, updateProgressInEnrollment]);

  // Track the last content ID to detect content changes
  const lastContentIdRef = useRef<string | null>(null);

  // Reset completion check ref when content changes
  useEffect(() => {
    if (selectedContent?._id) {
      const currentContentId = selectedContent._id;
      
      // If content has changed, clear the completion check ref
      if (lastContentIdRef.current !== null && lastContentIdRef.current !== currentContentId) {
        completionCheckRef.current.clear();
      }
      
      lastContentIdRef.current = currentContentId;
    }
  }, [selectedContent?._id]);

  // Check for content completion
  useEffect(() => {
    if (!selectedContent || !selectedContent._id) {
      return;
    }

    const contentId = selectedContent._id;

    // Skip if already completed or already checked in this session
    if (completionState.completedContents.has(contentId) || completionCheckRef.current.has(contentId)) {
      return;
    }

    // IMPORTANT: Only check completion if this content matches the last tracked content ID
    // This prevents using stale progress from previous videos when switching
    if (lastContentIdRef.current !== contentId) {
      return;
    }

    // For video content, check if progress >= threshold (90%) or video ended (>= 100%)
    if (selectedContent.type === "video") {
      // Only mark as completed if:
      // 1. Progress is at or above threshold (90% or 100%)
      // 2. Video is currently playing OR was being tracked (to catch completion when video ends)
      // This ensures we don't mark videos as completed when switching if progress is stale
      const shouldMarkCompleted = 
        (videoProgress >= completionThreshold || videoProgress >= 100) &&
        (isVideoPlaying || completionState.isTracking);

      if (shouldMarkCompleted) {
        // Mark as checked to prevent duplicate checks
        completionCheckRef.current.add(contentId);

        // Mark content as completed in state
        setCompletionState(prev => {
          if (prev.completedContents.has(contentId)) {
            return prev;
          }
          return {
            ...prev,
            completedContents: new Set([...prev.completedContents, contentId]),
          };
        });

        // Show completion notification
        toast.success(`Completed: ${selectedContent.title || 'Content'}`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        // Update enrollment progress immediately with completion flag
        // Use setTimeout to ensure state update is processed
        setTimeout(() => {
          updateProgressInEnrollment(true, contentId);
        }, 100);
      }
    }
  }, [videoProgress, selectedContent, completionState.completedContents, completionState.isTracking, updateProgressInEnrollment, isVideoPlaying]);

  // Periodic progress updates
  useEffect(() => {
    if (!completionState.isTracking || !selectedContent) return;

    const updateProgress = () => {
      const currentTime = Date.now();
      const timeSpent = currentTime - sessionStartTime.current;
      
      // Only update if significant time has passed
      if (timeSpent - lastProgressUpdate.current >= progressUpdateIntervalMs) {
        updateProgressInEnrollment(false);
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
  }, [completionState.isTracking, selectedContent, updateProgressInEnrollment]);

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

  // Manual completion trigger (for non-video content or video end)
  const markContentAsCompleted = useCallback(async (contentId?: string) => {
    const targetContentId = contentId || selectedContent?._id;
    if (!targetContentId) {
      return;
    }

    if (completionState.completedContents.has(targetContentId)) {
      return; // Already completed
    }

    setCompletionState(prev => {
      // Double check to avoid duplicates
      if (prev.completedContents.has(targetContentId)) {
        return prev;
      }
      return {
        ...prev,
        completedContents: new Set([...prev.completedContents, targetContentId]),
      };
    });

    toast.success("Content marked as completed!", {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });

    // Update enrollment progress with completion flag
    await updateProgressInEnrollment(true, targetContentId);
  }, [completionState.completedContents, updateProgressInEnrollment, selectedContent]);

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
