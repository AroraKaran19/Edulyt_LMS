"use client";

import { useCallback } from "react";
import apiClient from "@/configs/apiConfig";

export const COMMUNITY_REVIEW_STATUSES = [
  "pending_approval",
  "approved",
  "rejected",
] as const;

export type CommunityReviewStatus = (typeof COMMUNITY_REVIEW_STATUSES)[number];

export interface CommunityReviewUser {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePicture?: string;
}

export interface CommunityReviewItem {
  _id: string;
  userId?: CommunityReviewUser | string;
  title: string;
  review: string;
  tag: CommunityReviewTag;
  status: CommunityReviewStatus;
  replies?: unknown[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminListCommunityReviewsParams {
  page?: number;
  limit?: number;
  status?: CommunityReviewStatus;
  tag?: CommunityReviewTag;
  search?: string;
}

export interface AdminListCommunityReviewsResponse {
  reviews: CommunityReviewItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface PublicCommunityReviewUser {
  _id?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  collegeName?: string;
  currentPosition?: string;
  currentCompany?: string;
}

export interface PublicCommunityReview {
  _id: string;
  userId?: PublicCommunityReviewUser | string;
  title: string;
  review: string;
  tag: CommunityReviewTag;
  totalLikes: number;
  hasLiked: boolean;
  repliesCount: number;
  createdAt?: string;
}

export interface CommunityReviewReply {
  _id: string;
  userId?: PublicCommunityReviewUser | string;
  message: string;
  createdAt?: string;
}

export interface ListCommunityReviewRepliesResponse {
  replies: CommunityReviewReply[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ToggleLikeResult {
  liked: boolean;
  totalLikes: number;
}

export interface ListPublicCommunityReviewsParams {
  page?: number;
  limit?: number;
  tag?: CommunityReviewTag;
  search?: string;
}

export interface ListPublicCommunityReviewsResponse {
  reviews: PublicCommunityReview[];
  total: number;
  page: number;
  totalPages: number;
}

export const COMMUNITY_REVIEW_TAGS = [
  "Career Switch",
  "Interviews",
  "Projects",
  "Campus Placements",
  "Freshers",
  "On Job",
  "Internships",
  "Articles",
] as const;

export type CommunityReviewTag = (typeof COMMUNITY_REVIEW_TAGS)[number];

export interface CreateCommunityReviewInput {
  title: string;
  review: string;
  tag: CommunityReviewTag;
  anonymous: boolean;
}

export default function useCommunityReview() {
  const createReview = useCallback(
    async (input: CreateCommunityReviewInput) => {
      const res = await apiClient.post("/community-reviews", input);
      return res.data.data;
    },
    []
  );

  const adminListReviews = useCallback(
    async (
      params: AdminListCommunityReviewsParams = {}
    ): Promise<AdminListCommunityReviewsResponse> => {
      const res = await apiClient.get("/community-reviews/admin", { params });
      return res.data.data;
    },
    []
  );

  const adminApproveReview = useCallback(
    async (id: string): Promise<CommunityReviewItem> => {
      const res = await apiClient.patch(
        `/community-reviews/admin/${id}/approve`
      );
      return res.data.data;
    },
    []
  );

  const adminRejectReview = useCallback(
    async (id: string): Promise<CommunityReviewItem> => {
      const res = await apiClient.patch(
        `/community-reviews/admin/${id}/reject`
      );
      return res.data.data;
    },
    []
  );

  const listPublicReviews = useCallback(
    async (
      params: ListPublicCommunityReviewsParams = {}
    ): Promise<ListPublicCommunityReviewsResponse> => {
      const res = await apiClient.get("/community-reviews", { params });
      return res.data.data;
    },
    []
  );

  const adminDeleteReview = useCallback(async (id: string): Promise<void> => {
    await apiClient.delete(`/community-reviews/admin/${id}`);
  }, []);

  const toggleLike = useCallback(
    async (reviewId: string): Promise<ToggleLikeResult> => {
      const res = await apiClient.post(`/community-reviews/${reviewId}/like`);
      return res.data.data;
    },
    []
  );

  const listReplies = useCallback(
    async (
      reviewId: string,
      params: { page?: number; limit?: number } = {}
    ): Promise<ListCommunityReviewRepliesResponse> => {
      const res = await apiClient.get(
        `/community-reviews/${reviewId}/replies`,
        { params }
      );
      return res.data.data;
    },
    []
  );

  const addReply = useCallback(
    async (
      reviewId: string,
      input: { message: string; anonymous?: boolean }
    ): Promise<CommunityReviewReply> => {
      const res = await apiClient.post(
        `/community-reviews/${reviewId}/reply`,
        input
      );
      return res.data.data;
    },
    []
  );

  return {
    createReview,
    listPublicReviews,
    toggleLike,
    listReplies,
    addReply,
    adminListReviews,
    adminApproveReview,
    adminRejectReview,
    adminDeleteReview,
  };
}
