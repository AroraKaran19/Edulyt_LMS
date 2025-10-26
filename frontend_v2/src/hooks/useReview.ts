import { useState, useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import { Review } from "@/types/review";

export interface GetReviewsParams {
  page?: number;
  limit?: number;
  search?: string;
  reviewableType?: "Course" | "Instructor";
  reviewableId?: string;
  rating?: number;
}

export interface GetReviewsResult {
  reviews: Review[];
  total: number;
  page: number;
  totalPages: number;
}

export interface GetReviewsByReviewableResult {
  reviews: Review[];
  total: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
}

export interface CreateReviewData {
  rating: number;
  comment: string;
  reviewableType: "Course" | "Instructor";
  reviewableId: string;
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
}

const useReview = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = useCallback(
    async <T>(
      requestFn: () => Promise<T>,
      errorMessage: string
    ): Promise<T | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await requestFn();
        return result;
      } catch (err: any) {
        const errorMsg = err.response?.data?.error?.message || errorMessage;
        setError(errorMsg);
        console.error(errorMessage, err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getReviews = useCallback(
    async (params: GetReviewsParams = {}): Promise<GetReviewsResult | null> => {
      return handleRequest(async () => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.search) queryParams.append("search", params.search);
        if (params.reviewableType)
          queryParams.append("reviewableType", params.reviewableType);
        if (params.reviewableId)
          queryParams.append("reviewableId", params.reviewableId);
        if (params.rating)
          queryParams.append("rating", params.rating.toString());

        const response = await apiClient.get(
          `/reviews?${queryParams.toString()}`
        );
        return response.data.data;
      }, "Failed to fetch reviews");
    },
    [handleRequest]
  );

  const getReviewById = useCallback(
    async (id: string): Promise<Review | null> => {
      return handleRequest(async () => {
        const response = await apiClient.get(`/reviews/${id}`);
        return response.data.data;
      }, "Failed to fetch review");
    },
    [handleRequest]
  );

  const createReview = useCallback(
    async (data: CreateReviewData): Promise<Review | null> => {
      return handleRequest(async () => {
        const response = await apiClient.post("/reviews", data);
        return response.data.data;
      }, "Failed to create review");
    },
    [handleRequest]
  );

  const updateReview = useCallback(
    async (id: string, data: UpdateReviewData): Promise<Review | null> => {
      return handleRequest(async () => {
        const response = await apiClient.put(`/reviews/${id}`, data);
        return response.data.data;
      }, "Failed to update review");
    },
    [handleRequest]
  );

  const deleteReview = useCallback(
    async (id: string): Promise<boolean> => {
      const result = await handleRequest(async () => {
        await apiClient.delete(`/reviews/${id}`);
        return true;
      }, "Failed to delete review");
      return result !== null;
    },
    [handleRequest]
  );

  const getReviewsByReviewable = useCallback(
    async (
      reviewableType: "Course" | "Instructor",
      reviewableId: string,
      params: { page?: number; limit?: number; rating?: number } = {}
    ): Promise<GetReviewsByReviewableResult | null> => {
      return handleRequest(async () => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.rating)
          queryParams.append("rating", params.rating.toString());

        const response = await apiClient.get(
          `/reviews/reviewable/${reviewableType}/${reviewableId}?${queryParams.toString()}`
        );
        return response.data.data;
      }, "Failed to fetch reviews by reviewable");
    },
    [handleRequest]
  );

  // Validation functions
  const validateReview = useCallback((data: CreateReviewData): string[] => {
    const errors: string[] = [];

    if (!data.rating || data.rating < 1 || data.rating > 5) {
      errors.push("Rating must be between 1 and 5");
    }

    if (!data.comment || data.comment.trim().length < 10) {
      errors.push("Comment must be at least 10 characters long");
    }

    if (data.comment && data.comment.length > 1000) {
      errors.push("Comment must be less than 1000 characters");
    }

    if (
      !data.reviewableType ||
      !["Course", "Instructor"].includes(data.reviewableType)
    ) {
      errors.push("Reviewable type must be either 'Course' or 'Instructor'");
    }

    if (!data.reviewableId) {
      errors.push("Reviewable ID is required");
    }

    return errors;
  }, []);

  const validateUpdateReview = useCallback(
    (data: UpdateReviewData): string[] => {
      const errors: string[] = [];

      if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
        errors.push("Rating must be between 1 and 5");
      }

      if (data.comment !== undefined) {
        if (data.comment.trim().length < 10) {
          errors.push("Comment must be at least 10 characters long");
        }
        if (data.comment.length > 1000) {
          errors.push("Comment must be less than 1000 characters");
        }
      }

      if (!data.rating && !data.comment) {
        errors.push("At least one field (rating or comment) must be provided");
      }

      return errors;
    },
    []
  );

  return {
    // State
    isLoading,
    error,

    // Actions
    getReviews,
    getReviewById,
    createReview,
    updateReview,
    deleteReview,
    getReviewsByReviewable,

    // Validation
    validateReview,
    validateUpdateReview,
  };
};

export default useReview;
