import { CollaborationDomain } from "@/types/collaborationDomain";

export function getCourseCount(domain: CollaborationDomain): number {
  return Array.isArray(domain.courses) ? domain.courses.length : 0;
}

/** Linked courses: course allot enrollments, or discount scope at checkout. */
export function getCoursesColumnDisplay(domain: CollaborationDomain): string {
  const n = getCourseCount(domain);
  return n > 0 ? String(n) : "0";
}

export function getBenefitDisplay(
  domain: CollaborationDomain
): string | null {
  if (domain.collaborationKind !== "discount" || !domain.benefit) {
    return null;
  }
  if (domain.benefit.type === "percentage")
    return `${domain.benefit.value}% OFF`;
  return `₹${domain.benefit.value} OFF`;
}

export function getAccessLabel(
  domain: CollaborationDomain
): string | null {
  if (domain.collaborationKind !== "course_allot") return null;
  const ea = domain.enrollmentAccess;
  if (!ea) return null;
  const { mode, topNSettings } = ea;
  if (mode === "full") return "Full Access";
  if (topNSettings) return `First ${topNSettings.contentsPerLesson} per lesson`;
  return "Partial Access";
}
