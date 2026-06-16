import { useEffect, useState, useMemo } from "react";
import { useEnrollmentContext } from "@/components/EnrollmentGuard";
import { ContentCompletion } from "@/types/enrollment";

/**
 * Hook to track completed contents from enrollment
 * Returns a Set of completed content IDs for quick lookup
 */
export const useCompletedContents = () => {
  const { enrollment } = useEnrollmentContext() || {};
  const [completedContentIds, setCompletedContentIds] = useState<Set<string>>(
    new Set()
  );

  // Update completed content IDs when enrollment changes
  useEffect(() => {
    if (
      enrollment?.completedContents &&
      Array.isArray(enrollment.completedContents)
    ) {
      const ids = new Set<string>(
        enrollment.completedContents
          .map((completion: ContentCompletion) => completion.contentId)
          .filter(
            (id: string | undefined): id is string =>
              typeof id === "string" && id.length > 0
          )
      );
      setCompletedContentIds(ids);
    } else {
      setCompletedContentIds(new Set());
    }
  }, [enrollment?.completedContents]);

  // Helper function to check if a content is completed
  const isContentCompleted = useMemo(
    () => (contentId: string) => completedContentIds.has(contentId),
    [completedContentIds]
  );

  return {
    completedContentIds,
    isContentCompleted,
    completedContents: enrollment?.completedContents || [],
  };
};
