import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import {
  countUpcomingCohorts,
  type InternshipCohortBatchLike,
} from "@/lib/utils/internshipCohortDate";

const InternshipBatchCountContainer = ({
  batches,
  className,
}: {
  batches: InternshipCohortBatchLike[] | undefined | null;
  className?: string;
}) => {
  const upcoming = countUpcomingCohorts(batches);

  if (upcoming <= 0) return null;

  return (
    <div
      className={cn(
        "internship-batch-count flex select-none gap-2 text-sm items-center text-primary",
        className,
      )}
    >
      <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold shadow-sm border border-orange-200">
        <Icon icon="boxicons:community-filled" width="16" height="16" aria-hidden />
        <span>
          {upcoming} upcoming {upcoming === 1 ? "batch" : "batches"}
        </span>
      </span>
    </div>
  );
};

export default InternshipBatchCountContainer;
