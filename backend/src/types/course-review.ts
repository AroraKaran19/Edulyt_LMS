import { User, Course } from ".";

// Course Review interface
export interface CourseReview {
  _id?: string;
  courseId: Course["_id"];
  userId: User["_id"];
  rating: number; // 1-5 stars
  title: string;
  comment: string;
  isAnonymous?: boolean;
  helpfulVotes?: number;
  notHelpfulVotes?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Course Review with populated data
export interface CourseReviewWithDetails extends CourseReview {
  user: {
    _id: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    userType: string;
  };
  course: {
    _id: string;
    title: string;
    thumbnail: string;
  };
}

// Review Statistics
export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5": number;
  };
  recentReviews: number; // Last 30 days
}

// Review Filters
export interface ReviewFilters {
  courseId?: string;
  userId?: string;
  rating?: number;
  isAnonymous?: boolean;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Review Pagination
export interface ReviewPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Review Response with pagination
export interface ReviewResponse<T> {
  data: T[];
  pagination: ReviewPagination;
}
