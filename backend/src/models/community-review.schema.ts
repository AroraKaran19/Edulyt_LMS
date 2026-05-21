import {
  CommunityReview,
  CommunityReviewReply,
  COMMUNITY_REVIEW_TAGS,
  COMMUNITY_REVIEW_STATUSES,
} from "../types";
import mongoose from "mongoose";

interface CommunityReviewModelStatic extends mongoose.Model<CommunityReview> {
  addReply(
    reviewId: string,
    userId: string | null | undefined,
    message: string
  ): Promise<any>;
  removeReply(
    reviewId: string,
    replyId: string,
    userId: string | mongoose.Types.ObjectId
  ): Promise<boolean>;
}

const communityReviewReplySchema = new mongoose.Schema<CommunityReviewReply>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, _id: true }
);

const communityReviewSchema = new mongoose.Schema<CommunityReview>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    title: {
      type: String,
      required: true,
    },
    review: {
      type: String,
      required: true,
    },
    tag: {
      type: String,
      enum: COMMUNITY_REVIEW_TAGS,
      required: true,
    },
    status: {
      type: String,
      enum: COMMUNITY_REVIEW_STATUSES,
      default: "pending_approval",
      required: true,
    },
    likes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
      select: false, // never sent to clients; used server-side for dedup only
    },
    totalLikes: {
      type: Number,
      default: 0,
      min: 0,
    },
    replies: {
      type: [communityReviewReplySchema],
      required: false,
      default: [],
    },
  },
  { timestamps: true }
);

communityReviewSchema.index({ createdAt: -1 });
communityReviewSchema.index({ status: 1, createdAt: -1 });
communityReviewSchema.index({ status: 1, tag: 1, createdAt: -1 });
communityReviewSchema.index({ tag: 1, createdAt: -1 });
communityReviewSchema.index({ userId: 1, createdAt: -1 });
communityReviewSchema.index({ "replies.userId": 1, createdAt: -1 });

communityReviewSchema.statics.addReply = async function (
  reviewId: string,
  userId: string | null | undefined,
  message: string
) {
  const doc = await this.findById(reviewId);
  if (!doc) {
    throw new Error("Community review not found");
  }

  const reply: { userId?: string; message: string } = { message };
  if (userId) reply.userId = userId;

  doc.replies.push(reply);
  await doc.save();

  return doc.replies[doc.replies.length - 1];
};

/** Normalize embedded ref (ObjectId or populated { _id }) for comparison. */
function embeddedRefIdString(ref: unknown): string {
  if (ref != null && typeof ref === "object" && "_id" in (ref as object)) {
    return String((ref as { _id: unknown })._id);
  }
  return String(ref);
}

communityReviewSchema.statics.removeReply = async function (
  reviewId: string,
  replyId: string,
  userId: string | mongoose.Types.ObjectId
) {
  const doc = await this.findById(reviewId);
  if (!doc) {
    throw new Error("Community review not found");
  }

  const rid = String(replyId);
  const uid = embeddedRefIdString(userId);

  const replyIndex = doc.replies.findIndex(
    (reply) =>
      String(reply._id) === rid &&
      reply.userId != null &&
      embeddedRefIdString(reply.userId) === uid
  );

  if (replyIndex === -1) {
    throw new Error("Reply not found or unauthorized");
  }

  doc.replies.splice(replyIndex, 1);
  await doc.save();

  return true;
};

export const CommunityReviewModel = mongoose.model<
  CommunityReview,
  CommunityReviewModelStatic
>("CommunityReview", communityReviewSchema);
