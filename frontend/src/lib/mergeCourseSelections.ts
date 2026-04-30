import type { Course } from "@/types";

type CourseLike = { _id?: string; id?: string; title?: string };

/** Admin list rows may use `_id` or `id` depending on source / serialization. */
export function normalizeCourseRowId(
  c: CourseLike | null | undefined
): string | undefined {
  const raw = c?._id ?? c?.id;
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return undefined;
  }
  return String(raw);
}

/**
 * Merge newly fetched option rows into the current multi-select list (dedupe by id).
 */
export function mergeCourseSelections(
  previous: Course[],
  fetched: CourseLike[]
): Course[] {
  const merged = new Map<string, Course>();
  const add = (c: CourseLike) => {
    const id = normalizeCourseRowId(c);
    if (!id) return;
    const row = c as Course;
    merged.set(id, {
      ...row,
      _id: id,
      title: typeof row.title === "string" ? row.title : String(id),
    });
  };
  previous.forEach(add);
  fetched.forEach(add);
  return Array.from(merged.values());
}
