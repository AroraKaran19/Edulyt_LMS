import {
  createQnA,
  deleteQnA,
  getAllQnAs,
  getQnAById,
  updateQnA,
  addReply,
  removeReply,
  approveQnA,
  rejectQnA,
} from "../controllers/qna.controller";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyAdmin } from "../middlewares/admin.middleware";
import { Router } from "express";

const router = Router();

/**
 * @route   GET /api/qnas
 * @desc    Get all QnAs with optional filters
 * @access  Public
 */
router.get("/", verifyUser, getAllQnAs);

/**
 * @route   GET /api/qnas/:id
 * @desc    Get a QnA by ID
 * @access  Public
 */
router.get("/:id", verifyUser, getQnAById);

/**
 * @route   POST /api/qnas
 * @desc    Create a new QnA
 * @access  Authenticated Users
 */
router.post("/", verifyUser, createQnA);

/**
 * @route   PUT /api/qnas/:id
 * @desc    Update a QnA
 * @access  Authenticated Users (Owner only)
 */
router.put("/:id", verifyUser, updateQnA);

/**
 * @route   DELETE /api/qnas/:id
 * @desc    Delete a QnA
 * @access  Authenticated Users (Owner only)
 */
router.delete("/:id", verifyUser, deleteQnA);

/**
 * @route   POST /api/qnas/:qnaId/reply
 * @desc    Add a reply to a QnA
 * @access  Authenticated Users
 */
router.post("/:qnaId/reply", verifyUser, addReply);

/**
 * @route   DELETE /api/qnas/:qnaId/reply/:replyId
 * @desc    Remove a reply from a QnA
 * @access  Authenticated Users (Reply owner only)
 */
router.delete("/:qnaId/reply/:replyId", verifyUser, removeReply);

// ===================
// Admin Routes
// ===================

/**
 * @route   GET /api/admin/qnas
 * @desc    Get all QnAs for admin (with full data)
 * @access  Admin
 */
router.get("/admin", verifyUser, verifyAdmin, getAllQnAs);

/**
 * @route   GET /api/admin/qnas/:id
 * @desc    Get a QnA by ID for admin (with full data)
 * @access  Admin
 */
router.get("/admin/:id", verifyUser, verifyAdmin, getQnAById);

/**
 * @route   PUT /api/admin/qnas/:id
 * @desc    Update a QnA (Admin can update any QnA)
 * @access  Admin
 */
router.put("/admin/:id", verifyUser, verifyAdmin, updateQnA);

/**
 * @route   DELETE /api/admin/qnas/:id
 * @desc    Delete a QnA (Admin can delete any QnA)
 * @access  Admin
 */
router.delete("/admin/:id", verifyUser, verifyAdmin, deleteQnA);

/**
 * @route   PATCH /api/qna/admin/:id/approve
 * @desc    Approve a Q&A (Admin/Instructor only)
 * @access  Admin
 */
router.patch("/admin/:id/approve", verifyUser, verifyAdmin, approveQnA);

/**
 * @route   PATCH /api/qna/admin/:id/reject
 * @desc    Reject/Un-approve a Q&A (Admin/Instructor only)
 * @access  Admin
 */
router.patch("/admin/:id/reject", verifyUser, verifyAdmin, rejectQnA);

export default router;
