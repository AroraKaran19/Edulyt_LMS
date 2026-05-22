import { Router } from "express";
import {
  optionalVerifyUser,
  verifyUser,
} from "../middlewares/user.middleware";
import { verifyAdmin } from "../middlewares/admin.middleware";
import {
  addReplyToCommunityReview,
  adminApproveCommunityReview,
  adminDeleteCommunityReview,
  adminListCommunityReviews,
  adminRejectCommunityReview,
  createCommunityReview,
  listCommunityReviewReplies,
  listPublicCommunityReviews,
  toggleLikeCommunityReview,
} from "../controllers/community-review.controller";

const router = Router();

/**
 * @route   GET /api/community-reviews
 * @desc    Public listing — returns only approved reviews. Supports
 *          ?page, ?limit, ?tag, and ?search. Any ?status param is ignored.
 *          Uses optional auth so `hasLiked` is filled in when the caller
 *          happens to be logged in.
 * @access  Public (optional auth)
 */
router.get("/", optionalVerifyUser, listPublicCommunityReviews);

/**
 * @route   POST /api/community-reviews
 * @desc    Create a new community review (student-only). Created docs land in
 *          "pending_approval" status until an admin approves them.
 * @access  Authenticated (student)
 */
router.post("/", verifyUser, createCommunityReview);

/**
 * @route   POST /api/community-reviews/:id/like
 * @desc    Toggle the requester's like on a review. Returns { liked, totalLikes }.
 * @access  Authenticated
 */
router.post("/:id/like", verifyUser, toggleLikeCommunityReview);

/**
 * @route   GET /api/community-reviews/:id/replies
 * @desc    Paginated list of replies on an approved review.
 * @access  Public
 */
router.get("/:id/replies", listCommunityReviewReplies);

/**
 * @route   POST /api/community-reviews/:id/reply
 * @desc    Add a reply. Pass { anonymous: true } in the body to omit userId.
 * @access  Authenticated
 */
router.post("/:id/reply", verifyUser, addReplyToCommunityReview);

// ===================
// Admin / moderation
// ===================

/**
 * @route   GET /api/community-reviews/admin
 * @desc    Paginated list for moderation. Default filter is the pending queue;
 *          pass ?status=approved or ?status=rejected for the other queues.
 *          Optional ?tag=<tag> and ?search=<text> further narrow results.
 * @access  Admin
 */
router.get("/admin", verifyUser, verifyAdmin, adminListCommunityReviews);

/**
 * @route   PATCH /api/community-reviews/admin/:id/approve
 * @desc    Move a community review to "approved" (becomes publicly visible).
 * @access  Admin
 */
router.patch(
  "/admin/:id/approve",
  verifyUser,
  verifyAdmin,
  adminApproveCommunityReview
);

/**
 * @route   PATCH /api/community-reviews/admin/:id/reject
 * @desc    Move a community review to "rejected" (stays in DB, hidden publicly).
 * @access  Admin
 */
router.patch(
  "/admin/:id/reject",
  verifyUser,
  verifyAdmin,
  adminRejectCommunityReview
);

/**
 * @route   DELETE /api/community-reviews/admin/:id
 * @desc    Hard-delete a community review (any status). Learners can't
 *          delete their own posts — removal is an admin/moderation action.
 * @access  Admin
 */
router.delete(
  "/admin/:id",
  verifyUser,
  verifyAdmin,
  adminDeleteCommunityReview
);

export default router;
