import { useEffect, useRef, useCallback } from "react";
import useEnrollment from "@/hooks/useEnrollment";
import { useEnrollmentContext } from "@/components/EnrollmentGuard";
import { ContentCompletion } from "@/types/enrollment";
import { toast } from "react-toastify";

interface UseVideoProgressTrackingProps {
  contentId?: string;
  moduleId?: string;
  lessonId?: string;
  contentType?: "video" | "quiz" | "document";
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onVideoComplete?: () => void; // Callback when video completes (98%)
}

/**
 * Hook to track video progress and completion
 * 
 * Strategy:
 * - Sends ONE request when video reaches 98% completion
 * - Sends ONE final request on page unload with last accessed content and duration
 * - No periodic updates during playback (only on completion and unload)
 */
export const useVideoProgressTracking = ({
  contentId,
  moduleId,
  lessonId,
  contentType = "video",
  currentTime,
  duration,
  isPlaying,
  onVideoComplete,
}: UseVideoProgressTrackingProps) => {
  const { updateEnrollmentProgress } = useEnrollment();
  const { enrollment, refreshEnrollment } = useEnrollmentContext() || {};
  
  // Refs to track state
  const hasMarkedCompletedRef = useRef(false);
  const hasSentCompletionRequestRef = useRef(false);
  const timeSpentRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const lastCurrentTimeRef = useRef(0);
  const lastContentIdRef = useRef<string | undefined>(contentId);
  const isUnloadingRef = useRef(false);

  // Check if content is already completed
  const isContentCompleted = useCallback(() => {
    if (!enrollment?.completedContents || !contentId) return false;
    return enrollment.completedContents.some(
      (completion: ContentCompletion) => completion.contentId === contentId
    );
  }, [enrollment, contentId]);

  // Reset tracking when content changes
  useEffect(() => {
    if (contentId && contentId !== lastContentIdRef.current) {
      // Save final state of previous content before switching
      if (lastContentIdRef.current && !hasMarkedCompletedRef.current) {
        sendFinalUpdate(lastContentIdRef.current);
      }

      lastContentIdRef.current = contentId;
      hasMarkedCompletedRef.current = isContentCompleted();
      hasSentCompletionRequestRef.current = false;
      timeSpentRef.current = 0;
      startTimeRef.current = null;
      lastCurrentTimeRef.current = 0;
    }
  }, [contentId, isContentCompleted]);

  // Track time spent while playing
  useEffect(() => {
    if (!isPlaying || !duration || duration === 0) {
      if (startTimeRef.current !== null) {
        // Calculate time spent since last start
        const elapsed = (Date.now() - startTimeRef.current) / 1000; // in seconds
        timeSpentRef.current += elapsed;
        startTimeRef.current = null;
      }
      return;
    }

    // Start tracking time when video starts playing
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }
  }, [isPlaying, duration]);

  // Also track time based on currentTime as a fallback (more accurate)
  // This ensures we have at least the video playback time tracked
  useEffect(() => {
    if (contentId && duration > 0 && currentTime > 0) {
      // Use currentTime as minimum time spent (in seconds)
      // This ensures we always have at least the playback time tracked
      const playbackTimeSeconds = currentTime;
      if (playbackTimeSeconds > timeSpentRef.current) {
        timeSpentRef.current = playbackTimeSeconds;
      }
    }
  }, [currentTime, contentId, duration]);

  // Update last current time ref
  useEffect(() => {
    if (contentId && duration > 0) {
      lastCurrentTimeRef.current = currentTime;
    }
  }, [currentTime, contentId, duration]);

  // Function to send final update (on unload or content change)
  const sendFinalUpdate = useCallback(
    async (targetContentId?: string) => {
      if (isUnloadingRef.current) return; // Prevent duplicate calls
      
      const finalContentId = targetContentId || contentId;
      if (!enrollment?._id || !finalContentId || !moduleId || !lessonId) return;

      // Calculate final time spent
      let finalTimeSpent = timeSpentRef.current;
      if (startTimeRef.current !== null) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        finalTimeSpent += elapsed;
      }
      const timeSpentMinutes = Math.round(finalTimeSpent / 60);

      // Only send if we have meaningful progress (at least 1 second watched)
      if (lastCurrentTimeRef.current < 1 && timeSpentMinutes === 0) return;

      try {
        await updateEnrollmentProgress(enrollment._id, {
          moduleId,
          lessonId,
          contentId: finalContentId,
          contentType,
          lastPosition: lastCurrentTimeRef.current,
          completed: false, // Not marking as completed, just updating last accessed
          timeSpent: timeSpentMinutes,
        });
      } catch (error) {
        console.error(error);
      }
    },
    [enrollment, contentId, moduleId, lessonId, contentType, updateEnrollmentProgress]
  );

  // Check and mark video as completed at 98%
  useEffect(() => {
    if (
      !enrollment?._id ||
      !contentId ||
      !moduleId ||
      !lessonId ||
      !duration ||
      duration === 0 ||
      hasMarkedCompletedRef.current ||
      hasSentCompletionRequestRef.current
    ) {
      return;
    }

    // Calculate watch percentage
    const watchPercentage = (currentTime / duration) * 100;

    // Completion criteria: 98% or more
    if (watchPercentage >= 98) {
      hasMarkedCompletedRef.current = true;
      hasSentCompletionRequestRef.current = true;

      // Calculate total time spent in minutes
      // Use the maximum of: tracked time OR currentTime (playback position)
      // This ensures we always have at least the video playback time
      let finalTimeSpent = Math.max(timeSpentRef.current, currentTime);
      if (startTimeRef.current !== null) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        finalTimeSpent = Math.max(finalTimeSpent, currentTime + elapsed);
      }
      // Ensure we have at least currentTime as minimum
      finalTimeSpent = Math.max(finalTimeSpent, currentTime);
      const timeSpentMinutes = Math.max(1, Math.round(finalTimeSpent / 60)); // At least 1 minute if video was watched

      // Send completion request (only once)
      updateEnrollmentProgress(enrollment._id, {
        moduleId,
        lessonId,
        contentId,
        contentType,
        lastPosition: currentTime,
        completed: true,
        timeSpent: timeSpentMinutes,
      })
        .then(() => {
          // Refresh enrollment data to update completed contents list
          // Use setTimeout to defer refresh and prevent immediate re-render during video switch
          if (refreshEnrollment) {
            setTimeout(() => {
              refreshEnrollment();
            }, 100);
          }

          // Call onVideoComplete callback to auto-advance to next content
          if (onVideoComplete) {
            // Show toast notification
            toast.info("Video completed! Moving to next content...", {
              position: "bottom-right",
              autoClose: 1500,
              hideProgressBar: false,
            });
            
            setTimeout(() => {
              onVideoComplete();
            }, 1500); // Wait 1.5 seconds before auto-advancing
          }
        })
        .catch((error) => {
          console.error("Failed to mark video as completed:", error);
          // Reset flags on error so we can retry
          hasMarkedCompletedRef.current = false;
          hasSentCompletionRequestRef.current = false;
        });
    }
  }, [currentTime, duration, enrollment, contentId, moduleId, lessonId, contentType, updateEnrollmentProgress, refreshEnrollment, onVideoComplete]);

  // Handle page unload - send final update
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isUnloadingRef.current) return;
      isUnloadingRef.current = true;
      
      // Send final update synchronously (may not always complete, but we try)
      if (!hasMarkedCompletedRef.current && enrollment?._id && contentId) {
        sendFinalUpdate();
      }
    };

    // Also handle visibility change (tab switch, minimize, etc.)
    const handleVisibilityChange = () => {
      if (document.hidden && !hasMarkedCompletedRef.current && !isUnloadingRef.current) {
        // User switched tabs or minimized - send update
        sendFinalUpdate();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      
      // Send final update on component unmount (if not already completed)
      if (!hasMarkedCompletedRef.current && !isUnloadingRef.current) {
        sendFinalUpdate();
      }
    };
  }, [contentId, enrollment, sendFinalUpdate]);

  return {
    isCompleted: hasMarkedCompletedRef.current || isContentCompleted(),
    timeSpent: timeSpentRef.current,
  };
};
