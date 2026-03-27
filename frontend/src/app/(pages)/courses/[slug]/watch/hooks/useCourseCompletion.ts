import { useEffect, useState, useRef, useMemo } from "react";
import { useEnrollmentContext } from "@/components/EnrollmentGuard";
import apiClient from "@/configs/apiConfig";
import { Certificate } from "@/types/certificate";
import { Course, CourseModule, CourseLesson, Content } from "@/types";
import { canAccessContent } from "@/lib/accessControlUtils";

/**
 * When a certified course is fully completed (full access), checks if a certificate
 * already exists; if not, surfaces a one-time modal: certificate will appear on the
 * dashboard shortly (no redirect to certificate page).
 */
export const useCourseCompletion = (course?: Course) => {
  const { enrollment, accessControl } = useEnrollmentContext() || {};
  const [showCertificatePendingModal, setShowCertificatePendingModal] =
    useState(false);
  const certificateModalHandledRef = useRef(false);

  const accessibleContentsCount = useMemo(() => {
    if (!course?.modules || !Array.isArray(course.modules)) return 0;

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

  const allAccessibleContentsCompleted = useMemo(() => {
    if (!enrollment?.completedContents || !course?.modules) return false;

    const completedContentIds = new Set(
      enrollment.completedContents.map((c: { contentId: string }) => c.contentId)
    );

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

  const hasFullAccess = !accessControl || accessControl.accessType === "full";

  const isCourseCompleted =
    hasFullAccess &&
    (enrollment?.status === "completed" ||
      (enrollment?.progress?.overallCompletion ?? 0) >= 100) &&
    allAccessibleContentsCompleted;

  const isCertified =
    enrollment?.courseId &&
    typeof enrollment.courseId === "object" &&
    enrollment.courseId.isCertified;

  useEffect(() => {
    if (
      !hasFullAccess ||
      !isCourseCompleted ||
      !isCertified ||
      !enrollment?._id ||
      certificateModalHandledRef.current
    ) {
      return;
    }

    certificateModalHandledRef.current = true;

    void (async () => {
      try {
        const response = await apiClient.get("/certificates");
        const certificates: Certificate[] = response.data.data || [];

        const enrollmentIdStr =
          typeof enrollment._id === "string"
            ? enrollment._id
            : enrollment._id?.toString();

        const certificate = certificates.find((cert) => {
          const certEnrollmentId =
            typeof cert.enrollmentId === "string"
              ? cert.enrollmentId
              : (cert.enrollmentId as { toString?: () => string })?.toString?.() ||
                String(cert.enrollmentId);

          return certEnrollmentId === enrollmentIdStr;
        });

        if (!certificate) {
          setShowCertificatePendingModal(true);
        }
      } catch (error) {
        console.error("Error checking for certificate:", error);
      }
    })();
  }, [isCourseCompleted, isCertified, enrollment?._id, hasFullAccess]);

  const dismissCertificatePendingModal = () => {
    setShowCertificatePendingModal(false);
  };

  return {
    showCertificatePendingModal,
    dismissCertificatePendingModal,
    isCourseCompleted,
    isCertified,
  };
};
