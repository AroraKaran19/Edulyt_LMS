import { Course } from "@/types";

type RatingSource = Pick<
  Course,
  "analytics" | "staticRating" | "staticReviewCount"
>;

/**
 * Until a course earns a real rating, show the admin-set static pair instead.
 * Both values switch together so the rating and its review count always agree.
 */
export const getCourseDisplayRating = (
  course?: Partial<RatingSource> | null
): { rating: number; reviewCount: number } => {
  const averageRating = course?.analytics?.averageRating || 0;

  if (averageRating > 0) {
    return {
      rating: averageRating,
      reviewCount: course?.analytics?.totalReviews || 0,
    };
  }

  return {
    rating: course?.staticRating || 0,
    reviewCount: course?.staticReviewCount || 0,
  };
};

/** Compacts a review count for display: 1240 -> "1.2K", 2000000 -> "2M". */
export const formatReviewCount = (count: number): string => {
  if (!count || count <= 0) return "0";

  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }

  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }

  return count.toString();
};
