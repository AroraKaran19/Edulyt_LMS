import { User } from ".";

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

export const COMMUNITY_REVIEW_STATUSES = [
  "pending_approval",
  "approved",
  "rejected",
] as const;

export type CommunityReviewStatus = (typeof COMMUNITY_REVIEW_STATUSES)[number];

export interface CommunityReviewReply {
  _id?: string;
  userId?: User["_id"]; // omitted when the reply is anonymous
  message: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CommunityReview {
  _id?: string;
  userId?: User["_id"]; // omitted when the review is anonymous
  title: string;
  review: string;
  tag: CommunityReviewTag;
  status: CommunityReviewStatus;
  /** Server-side dedup list — never serialized to clients. */
  likes?: User["_id"][];
  /** Denormalized counter; this is what the API returns. */
  totalLikes: number;
  replies: CommunityReviewReply[];
  createdAt?: Date;
  updatedAt?: Date;
}
