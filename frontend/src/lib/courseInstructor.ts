import type { Course } from "@/types";

function normalizeInstructorRef(inst: unknown): string | null {
  if (inst == null) return null;
  if (typeof inst === "string") return inst;
  if (typeof inst === "object") {
    const o = inst as { _id?: unknown; id?: unknown };
    if (o._id != null) return String(o._id);
    if (o.id != null) return String(o.id);
  }
  return String(inst);
}

/** True if `userId` matches any entry on the course `instructor` list (ObjectId strings or populated users). */
export function isUserInstructorOfCourse(
  userId: string | undefined,
  course: Course
): boolean {
  if (!userId || !course.instructor) return false;
  const uid = userId.trim();
  const list = Array.isArray(course.instructor)
    ? course.instructor
    : [course.instructor];
  for (const inst of list) {
    const nid = normalizeInstructorRef(inst);
    if (nid && nid === uid) return true;
  }
  return false;
}
