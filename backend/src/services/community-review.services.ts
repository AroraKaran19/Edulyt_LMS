import mongoose from "mongoose";
import { CommunityReviewModel } from "../models";
import {
  CommunityReview,
  CommunityReviewStatus,
  CommunityReviewTag,
  COMMUNITY_REVIEW_STATUSES,
  COMMUNITY_REVIEW_TAGS,
} from "../types";
import { AppError } from "../middlewares/error.middleware";
import { getPointsSettings } from "./pointsSettings.services";
import { awardWalletSuccessPoints } from "./successPoints.services";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const PUBLIC_USER_PROJECTION =
  "firstName lastName profilePicture collegeName currentPosition currentCompany";

export interface CreateCommunityReviewInput {
  userId: string | null;
  title: string;
  review: string;
  tag: CommunityReviewTag;
}

export async function createCommunityReviewService(
  input: CreateCommunityReviewInput
) {
  const title = (input.title ?? "").trim();
  const review = (input.review ?? "").trim();
  const tag = input.tag;

  if (!title) throw new AppError("Title is required", 400);
  if (!review) throw new AppError("Story content is required", 400);
  if (!tag || !COMMUNITY_REVIEW_TAGS.includes(tag)) {
    throw new AppError(
      `Tag must be one of: ${COMMUNITY_REVIEW_TAGS.join(", ")}`,
      400
    );
  }

  // One non-anonymous review per user. Anonymous posts carry no userId, so
  // they're neither limited nor counted here.
  const isIdentified =
    !!input.userId && mongoose.Types.ObjectId.isValid(input.userId);
  if (isIdentified) {
    const already = await CommunityReviewModel.exists({
      userId: new mongoose.Types.ObjectId(String(input.userId)),
    });
    if (already) {
      throw new AppError(
        "You've already posted a community review",
        409
      );
    }
  }

  const doc = await CommunityReviewModel.create({
    userId: isIdentified ? input.userId : undefined,
    title,
    review,
    tag,
    // status defaults to "pending_approval" via the schema
  });

  // Reward only identified authors. The 1/user lock above is the idempotency
  // guard — a second submit throws before reaching here.
  if (isIdentified) {
    try {
      const { communityReviewSuccessPoints } = await getPointsSettings();
      await awardWalletSuccessPoints(
        String(input.userId),
        communityReviewSuccessPoints,
        "community_review"
      );
    } catch (e) {
      // The review is the primary artifact — never fail the post over a
      // reward credit. Logged for manual reconciliation.
      console.error("Community review reward failed:", e);
    }
  }

  return doc.toObject();
}

export interface AdminListCommunityReviewsInput {
  page: number;
  limit: number;
  status?: CommunityReviewStatus;
  tag?: CommunityReviewTag;
  search?: string;
}

/**
 * Admin/moderation listing. Defaults to status = "pending_approval" so the
 * moderation queue is the natural landing view; pass an explicit status to see
 * approved or rejected items.
 */
export async function adminListCommunityReviewsService(
  input: AdminListCommunityReviewsInput
) {
  const page = Math.max(1, Math.floor(input.page) || 1);
  const limit = Math.max(1, Math.min(100, Math.floor(input.limit) || 10));

  const query: Record<string, unknown> = {};

  if (input.status) {
    if (!COMMUNITY_REVIEW_STATUSES.includes(input.status)) {
      throw new AppError(
        `Status must be one of: ${COMMUNITY_REVIEW_STATUSES.join(", ")}`,
        400
      );
    }
    query.status = input.status;
  }

  if (input.tag) {
    if (!COMMUNITY_REVIEW_TAGS.includes(input.tag)) {
      throw new AppError(
        `Tag must be one of: ${COMMUNITY_REVIEW_TAGS.join(", ")}`,
        400
      );
    }
    query.tag = input.tag;
  }

  const search = (input.search ?? "").trim();
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    query.$or = [{ title: rx }, { review: rx }];
  }

  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    CommunityReviewModel.find(query)
      .populate("userId", "firstName lastName email profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CommunityReviewModel.countDocuments(query),
  ]);

  return {
    reviews,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

async function setStatusService(
  id: string,
  status: CommunityReviewStatus
): Promise<CommunityReview | null> {
  const updated = await CommunityReviewModel.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  )
    .populate("userId", "firstName lastName email profilePicture")
    .lean();

  return (updated as CommunityReview) ?? null;
}

export async function approveCommunityReviewService(id: string) {
  return setStatusService(id, "approved");
}

export async function rejectCommunityReviewService(id: string) {
  return setStatusService(id, "rejected");
}

export interface ListPublicCommunityReviewsInput {
  page: number;
  limit: number;
  tag?: CommunityReviewTag;
  search?: string;
  /** Currently-logged-in user id (if any) — used to compute `hasLiked`. */
  currentUserId?: string;
}

/**
 * Public-facing listing. `status` is hardcoded to "approved" inside the
 * service — callers cannot pass it in, so the only way to read
 * "pending_approval" or "rejected" docs is via the admin-gated endpoints.
 */
export async function listPublicCommunityReviewsService(
  input: ListPublicCommunityReviewsInput
) {
  const page = Math.max(1, Math.floor(input.page) || 1);
  const limit = Math.max(1, Math.min(50, Math.floor(input.limit) || 10));

  const query: Record<string, unknown> = { status: "approved" };

  if (input.tag) {
    if (!COMMUNITY_REVIEW_TAGS.includes(input.tag)) {
      throw new AppError(
        `Tag must be one of: ${COMMUNITY_REVIEW_TAGS.join(", ")}`,
        400
      );
    }
    query.tag = input.tag;
  }

  const search = (input.search ?? "").trim();
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    query.$or = [{ title: rx }, { review: rx }];
  }

  const skip = (page - 1) * limit;
  const userObjectId = input.currentUserId
    ? new mongoose.Types.ObjectId(input.currentUserId)
    : null;

  const [rawReviews, total] = await Promise.all([
    CommunityReviewModel.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $addFields: {
          repliesCount: { $size: { $ifNull: ["$replies", []] } },
          totalLikes: { $ifNull: ["$totalLikes", 0] },
          hasLiked: userObjectId
            ? { $in: [userObjectId, { $ifNull: ["$likes", []] }] }
            : false,
        },
      },
      // Strip heavy / private fields before populate. `likes` is the dedup
      // array (server-side only); `totalLikes` is the public counter.
      { $project: { likes: 0, replies: 0 } },
    ]),
    CommunityReviewModel.countDocuments(query),
  ]);

  const reviews = await CommunityReviewModel.populate(rawReviews, {
    path: "userId",
    select: PUBLIC_USER_PROJECTION,
  });

  return {
    reviews,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/**
 * Hard-deletes any community review by id. Admin / moderation only.
 *
 * Learners deliberately cannot delete their own posts: posting a
 * non-anonymous review credits wallet success points, so a self-delete +
 * repost would be a way to farm the reward. Removing unwanted posts is an
 * admin action.
 */
export async function adminDeleteCommunityReviewService(reviewId: string) {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new AppError("Invalid review id", 400);
  }
  const result = await CommunityReviewModel.findByIdAndDelete(reviewId);
  if (!result) {
    throw new AppError("Community review not found", 404);
  }
  return { deleted: true };
}

// ===== Likes =====

export interface ToggleLikeResult {
  liked: boolean;
  totalLikes: number;
}

/**
 * Atomically toggles the requester's like on an approved review. Uses the
 * private `likes` array to dedup (one user = one like) and keeps the
 * denormalized `totalLikes` counter in sync. Only `totalLikes` is exposed
 * publicly.
 */
export async function toggleLikeCommunityReviewService(
  reviewId: string,
  userId: string
): Promise<ToggleLikeResult> {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new AppError("Invalid review id", 400);
  }
  const uid = new mongoose.Types.ObjectId(String(userId));

  // Try to UN-like first (idempotent if not currently liked).
  const unliked = await CommunityReviewModel.updateOne(
    { _id: reviewId, status: "approved", likes: uid },
    { $pull: { likes: uid }, $inc: { totalLikes: -1 } }
  );

  let liked: boolean;
  if (unliked.modifiedCount > 0) {
    liked = false;
  } else {
    // Wasn't already liked — add it. The `likes: { $ne: uid }` guard makes
    // this safe under concurrent requests.
    const likedRes = await CommunityReviewModel.updateOne(
      { _id: reviewId, status: "approved", likes: { $ne: uid } },
      { $addToSet: { likes: uid }, $inc: { totalLikes: 1 } }
    );
    if (likedRes.matchedCount === 0) {
      throw new AppError("Community review not found", 404);
    }
    liked = true;
  }

  // Re-read just the counter to return an accurate total even under races.
  const fresh = await CommunityReviewModel.findById(reviewId)
    .select("totalLikes")
    .lean();
  return {
    liked,
    totalLikes: fresh?.totalLikes ?? 0,
  };
}

// ===== Replies =====

export async function addReplyToCommunityReviewService(
  reviewId: string,
  userId: string | null,
  message: string
) {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new AppError("Invalid review id", 400);
  }
  const text = (message ?? "").trim();
  if (!text) throw new AppError("Reply message is required", 400);

  // Only allow replies on approved reviews (consistent with the lock-down
  // policy — non-admins can't even see pending/rejected posts).
  const exists = await CommunityReviewModel.exists({
    _id: reviewId,
    status: "approved",
  });
  if (!exists) throw new AppError("Community review not found", 404);

  const reply = await CommunityReviewModel.addReply(
    reviewId,
    userId ?? undefined,
    text
  );

  // Populate the author for the returned reply so the UI can render
  // name/avatar immediately without a refetch.
  if (reply?.userId) {
    return await CommunityReviewModel.populate(reply, {
      path: "userId",
      select: PUBLIC_USER_PROJECTION,
    });
  }
  return reply;
}

export interface ListRepliesInput {
  reviewId: string;
  page: number;
  limit: number;
}

export async function listCommunityReviewRepliesService(input: ListRepliesInput) {
  const { reviewId } = input;
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new AppError("Invalid review id", 400);
  }
  const page = Math.max(1, Math.floor(input.page) || 1);
  const limit = Math.max(1, Math.min(100, Math.floor(input.limit) || 20));

  const doc = await CommunityReviewModel.findOne({
    _id: reviewId,
    status: "approved",
  })
    .select("replies")
    .populate("replies.userId", PUBLIC_USER_PROJECTION)
    .lean();

  if (!doc) throw new AppError("Community review not found", 404);

  const all = (doc.replies ?? []).slice().sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return ta - tb;
  });
  const total = all.length;
  const skip = (page - 1) * limit;
  const replies = all.slice(skip, skip + limit);

  return {
    replies,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
