"use client";

/**
 * Placeholder that mirrors CourseCard's structure while enrollments load:
 * 16:9 thumbnail, title block, author chip, then the progress/action footer.
 * Keeping the same heights means the grid does not jump when real cards land.
 */
const CourseCardSkeleton = () => (
  <div
    className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
    aria-hidden="true"
  >
    {/* Thumbnail */}
    <div className="relative aspect-video w-full animate-pulse bg-gray-200">
      {/* Duration / category chip */}
      <div className="absolute left-3 top-3 h-6 w-40 rounded-full bg-gray-300/70" />
    </div>

    <div className="p-4 sm:p-5">
      {/* Title: two lines, second short, matching the wrap on long titles */}
      <div className="mb-2 h-5 w-11/12 animate-pulse rounded bg-gray-200" />
      <div className="mb-4 h-5 w-2/3 animate-pulse rounded bg-gray-200" />

      {/* Author chip */}
      <div className="mb-5 flex items-center gap-2">
        <div className="size-6 animate-pulse rounded-full bg-gray-200" />
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
      </div>

      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Progress ring */}
            <div className="size-10 shrink-0 animate-pulse rounded-full bg-gray-200" />
            <div>
              <div className="mb-1.5 h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
          {/* Action button */}
          <div className="h-9 w-24 shrink-0 animate-pulse rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  </div>
);

/** A full grid of skeletons, matching the courses grid breakpoints. */
export const CourseCardSkeletonGrid = ({ count = 8 }: { count?: number }) => (
  <div
    className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4"
    role="status"
    aria-label="Loading your programs"
  >
    {Array.from({ length: count }, (_, i) => (
      <CourseCardSkeleton key={i} />
    ))}
  </div>
);

export default CourseCardSkeleton;
