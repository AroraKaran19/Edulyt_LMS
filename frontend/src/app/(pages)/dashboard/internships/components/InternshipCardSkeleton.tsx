"use client";

/**
 * Placeholder matching DashboardInternshipCard's structure while enrollments
 * load: left accent bar, status pill + offer-letter action, title, cohort and
 * date line, the six-step progress rail, then the footer row. Same heights as
 * the real card so the grid does not jump when data lands.
 */
const InternshipCardSkeleton = () => (
  <div
    className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white"
    aria-hidden="true"
  >
    {/* Left accent bar */}
    <div className="absolute inset-y-0 left-0 w-1.5 animate-pulse bg-gray-200" />

    <div className="p-4 pl-6 sm:p-5 sm:pl-7">
      {/* Status pill + offer letter button */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="h-6 w-24 animate-pulse rounded-full bg-gray-200" />
        <div className="h-8 w-44 shrink-0 animate-pulse rounded-lg bg-gray-200" />
      </div>

      {/* Title: long programme names wrap to two lines */}
      <div className="mb-2 h-6 w-11/12 animate-pulse rounded bg-gray-200" />
      <div className="mb-3 h-6 w-3/5 animate-pulse rounded bg-gray-200" />

      {/* Cohort + start/end dates */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Stage label + "Step n of 6" */}
      <div className="mb-2 flex items-center justify-between">
        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Six-segment progress rail with its captions */}
      <div className="mb-1.5 grid grid-cols-6 gap-1.5">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-1.5 animate-pulse rounded-full bg-gray-200" />
        ))}
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="mx-auto h-3 w-12 animate-pulse rounded bg-gray-200"
          />
        ))}
      </div>

      {/* Footer: status text / points chip, then the action */}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <div className="h-10 w-40 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-8 w-28 shrink-0 animate-pulse rounded-lg bg-gray-200" />
      </div>
    </div>
  </div>
);

/** A grid of skeletons, matching the internships grid breakpoints. */
export const InternshipCardSkeletonGrid = ({ count = 4 }: { count?: number }) => (
  <div
    className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2 lg:gap-6"
    role="status"
    aria-label="Loading your internships"
  >
    {Array.from({ length: count }, (_, i) => (
      <InternshipCardSkeleton key={i} />
    ))}
  </div>
);

export default InternshipCardSkeleton;
