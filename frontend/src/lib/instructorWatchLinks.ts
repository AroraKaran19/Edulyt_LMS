import type { QnA } from "@/types/qna";

export function getContentIdFromQna(q: QnA): string | undefined {
  if (!q.contentId) return undefined;
  if (
    typeof q.contentId === "object" &&
    q.contentId !== null &&
    "_id" in q.contentId
  ) {
    return String((q.contentId as { _id: string })._id);
  }
  return String(q.contentId);
}

export function getLessonIdFromQna(q: QnA): string | undefined {
  if (!q.lessonId) return undefined;
  if (
    typeof q.lessonId === "object" &&
    q.lessonId !== null &&
    "_id" in q.lessonId
  ) {
    return String((q.lessonId as { _id: string })._id);
  }
  return String(q.lessonId);
}

export function getCourseSlugFromQna(q: QnA): string | undefined {
  const c = q.courseId;
  if (c && typeof c === "object" && "slug" in c) {
    return (c as { slug?: string }).slug;
  }
  return undefined;
}

/** Build `/courses/[slug]/watch?...` for instructor navigation from dashboard lists. */
export function buildInstructorWatchDeepLink(opts: {
  courseSlug: string;
  qnaId: string;
  contentId?: string | null;
  lessonId?: string | null;
}): string {
  const params = new URLSearchParams();
  params.set("qna", opts.qnaId);
  if (opts.contentId) params.set("content", opts.contentId);
  else if (opts.lessonId) params.set("lesson", opts.lessonId);
  return `/courses/${encodeURIComponent(opts.courseSlug)}/watch?${params.toString()}`;
}

/** Deep link to the watch page: right lesson/content + Q&A tab + scroll target. */
export function buildWatchUrlForInstructorQna(q: QnA): string | null {
  const slug = getCourseSlugFromQna(q);
  const qnaId = q._id;
  if (!slug || !qnaId) return null;
  return buildInstructorWatchDeepLink({
    courseSlug: slug,
    qnaId: String(qnaId),
    contentId: getContentIdFromQna(q),
    lessonId: getLessonIdFromQna(q),
  });
}
