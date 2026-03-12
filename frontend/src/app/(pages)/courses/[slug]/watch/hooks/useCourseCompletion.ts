import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useEnrollmentContext } from "@/components/EnrollmentGuard";
import apiClient from "@/configs/apiConfig";
import { Certificate } from "@/types/certificate";
import { Course, CourseModule, CourseLesson, Content } from "@/types";
import { canAccessContent } from "@/lib/accessControlUtils";

/**
 * Hook to monitor course completion and certificate generation
 * Shows loading screen when course is completed and redirects to certificate page
 */
export const useCourseCompletion = (course?: Course) => {
  const { enrollment, refreshEnrollment, accessControl } = useEnrollmentContext() || {};
  const router = useRouter();
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasRedirectedRef = useRef(false);
  const certificateExistedOnMountRef = useRef<boolean | null>(null);

  // Calculate accessible contents count based on accessControl
  const accessibleContentsCount = useMemo(() => {
    if (!course?.modules || !Array.isArray(course.modules)) return 0;

    // If no accessControl or full access, count all contents
    if (!accessControl || accessControl.accessType === "full") {
      let count = 0;
      (course.modules as CourseModule[]).forEach((module) => {
        if (typeof module === "string" || !module.lessons) return;
        (module.lessons as CourseLesson[]).forEach((lesson) => {
          if (typeof lesson === "string" || !lesson.contents) return;
          count += (lesson.contents as Content[]).filter(
            (c: Content) => typeof c !== "string"
          ).length;
        });
      });
      return count;
    }

    // For partial access, count only accessible contents
    let count = 0;
    (course.modules as CourseModule[]).forEach((module) => {
      if (typeof module === "string") return;
      const moduleId = module._id || "";
      
      (module.lessons as CourseLesson[]).forEach((lesson) => {
        if (typeof lesson === "string") return;
        const lessonId = lesson._id || "";
        
        if (!lesson.contents) return;
        
        (lesson.contents as Content[]).forEach((content) => {
          if (typeof content === "string") return;
          
          const contentId = content._id || "";
          if (canAccessContent(accessControl, moduleId, lessonId, contentId)) {
            count++;
          }
        });
      });
    });
    return count;
  }, [course, accessControl]);

  // Check if all accessible contents are completed
  const allAccessibleContentsCompleted = useMemo(() => {
    if (!enrollment?.completedContents || !course?.modules) return false;
    
    const completedContentIds = new Set(
      enrollment.completedContents.map((c: { contentId: string }) => c.contentId)
    );

    // If no accessControl or full access, check against all contents
    if (!accessControl || accessControl.accessType === "full") {
      let totalContents = 0;
      let completedCount = 0;
      
      (course.modules as CourseModule[]).forEach((module) => {
        if (typeof module === "string" || !module.lessons) return;
        (module.lessons as CourseLesson[]).forEach((lesson) => {
          if (typeof lesson === "string" || !lesson.contents) return;
          (lesson.contents as Content[]).forEach((content) => {
            if (typeof content === "string") return;
            totalContents++;
            if (completedContentIds.has(content._id || "")) {
              completedCount++;
            }
          });
        });
      });
      
      return totalContents > 0 && completedCount === totalContents;
    }

    // For partial access, check only accessible contents
    let accessibleCount = 0;
    let completedAccessibleCount = 0;
    
    (course.modules as CourseModule[]).forEach((module) => {
      if (typeof module === "string") return;
      const moduleId = module._id || "";
      
      (module.lessons as CourseLesson[]).forEach((lesson) => {
        if (typeof lesson === "string") return;
        const lessonId = lesson._id || "";
        
        if (!lesson.contents) return;
        
        (lesson.contents as Content[]).forEach((content) => {
          if (typeof content === "string") return;
          
          const contentId = content._id || "";
          if (canAccessContent(accessControl, moduleId, lessonId, contentId)) {
            accessibleCount++;
            if (completedContentIds.has(contentId)) {
              completedAccessibleCount++;
            }
          }
        });
      });
    });
    
    return accessibleCount > 0 && completedAccessibleCount === accessibleCount;
  }, [enrollment?.completedContents, course, accessControl]);

  // Check if user has FULL access (not partial access)
  const hasFullAccess = !accessControl || accessControl.accessType === "full";

  // Check if course is completed - require BOTH backend flag AND frontend verification
  // This prevents certificate flow when backend incorrectly reports 100% (e.g. after 1 video)
  const isCourseCompleted = hasFullAccess && (
    (enrollment?.status === "completed" || (enrollment?.progress?.overallCompletion ?? 0) >= 100)
  ) && allAccessibleContentsCompleted;

  // Check if course is certified
  const isCertified = enrollment?.courseId && 
    typeof enrollment.courseId === "object" && 
    enrollment.courseId.isCertified;

  useEffect(() => {
    // Only proceed if:
    // 1. User has FULL access (not partial access)
    // 2. Course is completed
    // 3. Course is certified
    // 4. Enrollment ID exists
    // 5. Not already redirected
    if (!hasFullAccess || !isCourseCompleted || !isCertified || !enrollment?._id || hasRedirectedRef.current) {
      return;
    }

    // If all accessible contents are completed but backend hasn't marked it as completed yet,
    // we should still show loading and poll for certificate
    // The backend might need a moment to update the status

    // Check if certificate already exists
    const checkForCertificate = async () => {
      try {
        // Fetch all certificates for the user
        const response = await apiClient.get("/certificates");
        const certificates: Certificate[] = response.data.data || [];

        // Find certificate for this enrollment
        const enrollmentIdStr = typeof enrollment._id === "string" 
          ? enrollment._id 
          : enrollment._id?.toString();
        
        const certificate = certificates.find((cert) => {
          // enrollmentId in Certificate is a string
          const certEnrollmentId = typeof cert.enrollmentId === "string"
            ? cert.enrollmentId
            : (cert.enrollmentId as any)?.toString?.() || String(cert.enrollmentId);
          
          return certEnrollmentId === enrollmentIdStr;
        });

        // On initial mount, check if certificate already existed
        if (certificateExistedOnMountRef.current === null) {
          certificateExistedOnMountRef.current = !!certificate;
          
          // If certificate already existed when we mounted, don't show loading or redirect
          // This allows users to return to the watch page after certificate generation
          if (certificate) {
            console.log("Certificate already exists - user can view course content");
            return;
          }
        }

        // Only show loading and redirect if certificate didn't exist on mount
        // This means we're actively waiting for certificate generation
        if (!certificateExistedOnMountRef.current) {
          setIsGeneratingCertificate(true);
          
          if (certificate) {
            // Certificate was just generated - redirect to certificate page
            hasRedirectedRef.current = true;
            setIsGeneratingCertificate(false);
            
            // Use _id (MongoDB ID) for the route, as that's what the certificate detail page expects
            if (certificate._id) {
              router.push(`/dashboard/certificates/${certificate._id}`);
            }
          }
          // else: Certificate not found yet - continue polling
        }
      } catch (error) {
        console.error("Error checking for certificate:", error);
        // Continue polling even on error
      }
    };

    // Initial check
    checkForCertificate();

    pollingIntervalRef.current = setInterval(() => {
      if (!hasRedirectedRef.current && certificateExistedOnMountRef.current === false) {
        checkForCertificate();
      }
    }, 5000);

    // Cleanup interval on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isCourseCompleted, isCertified, enrollment?._id, enrollment?.status, router, hasFullAccess]);

  // Refresh enrollment periodically to check for completion
  useEffect(() => {
    return () => {}; // No cleanup needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCourseCompleted, enrollment?._id]);

  return {
    isGeneratingCertificate,
    isCourseCompleted,
    isCertified,
  };
};

