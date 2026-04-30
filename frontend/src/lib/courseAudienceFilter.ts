import type { Course } from "@/types/course";

/** Admin UI: filter course lists, or “all” to include every active course. */
export type CourseAudienceFilter = "all" | Course["audience"];

export const COURSE_AUDIENCE_FILTER_LABEL: Record<CourseAudienceFilter, string> =
  {
    all: "All audiences",
    "college-students": "College students",
    professionals: "Professionals",
  };

/**
 * Stored enrollment/collaboration audience is always a concrete segment.
 * When the admin picks “All” for the course picker, we default to college students.
 */
export function enrollmentAudienceForApi(
  filter: CourseAudienceFilter
): Course["audience"] {
  return filter === "all" ? "college-students" : filter;
}
