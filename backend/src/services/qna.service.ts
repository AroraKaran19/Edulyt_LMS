import { AppError } from "../middlewares/error.middleware";
import { QnAQuestionModel } from "../models/qna-question.schema";
import { QnAReplyModel } from "../models/qna-reply.schema";
import { UserModel } from "../models/user.schema";
import { CourseModel } from "../models/course.schema";
import {
  QnAQuestion,
  QnAReply,
  QnAQuestionWithDetails,
  QnAReplyWithDetails,
  QnAStats,
  QnAFilters,
  QnAPagination,
  QnAResponse,
} from "../types/qna";
import mongoose from "mongoose";

export class QnAService {
  /**
   * Create a new question
   */
  static async createQuestion(
    courseId: string,
    userId: string,
    questionData: {
      title: string;
      description: string;
      priority?: "low" | "medium" | "high";
      tags?: string[];
      isAnonymous?: boolean;
    }
  ): Promise<QnAQuestion> {
    try {
      // Verify course exists
      const course = await CourseModel.findById(courseId);
      if (!course) {
        throw new AppError("Course not found", 404);
      }

      // Verify user exists
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Check if user is enrolled in the course
      const enrollment = await mongoose.model("Enrollment").findOne({
        userId,
        courseId,
        status: { $in: ["active", "completed"] },
      });

      if (!enrollment) {
        throw new AppError("User must be enrolled in the course to ask questions", 403);
      }

      const question = new QnAQuestionModel({
        courseId,
        userId,
        title: questionData.title,
        description: questionData.description,
        priority: questionData.priority || "medium",
        tags: questionData.tags || [],
        isAnonymous: questionData.isAnonymous || false,
      });

      await question.save();
      return question;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to create question", 500);
    }
  }

  /**
   * Get questions with filters and pagination
   */
  static async getQuestions(
    filters: QnAFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<QnAResponse<QnAQuestionWithDetails>> {
    try {
      const query: any = {};

      // Apply filters
      if (filters.courseId) query.courseId = filters.courseId;
      if (filters.userId) query.userId = filters.userId;
      if (filters.status) query.status = filters.status;
      if (filters.priority) query.priority = filters.priority;
      if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
      }
      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = filters.dateFrom;
        if (filters.dateTo) query.createdAt.$lte = filters.dateTo;
      }
      if (filters.search) {
        query.$or = [
          { title: { $regex: filters.search, $options: "i" } },
          { description: { $regex: filters.search, $options: "i" } },
        ];
      }

      const skip = (page - 1) * limit;

      const questions = await QnAQuestionModel.find(query)
        .populate("userId", "firstName lastName profilePicture userType")
        .populate("courseId", "title thumbnail")
        .populate({
          path: "replies",
          model: "QnAReply",
          populate: {
            path: "userId",
            select: "firstName lastName profilePicture userType",
          },
          options: { sort: { createdAt: 1 } },
        })
        .sort({ lastActivityAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await QnAQuestionModel.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      const pagination: QnAPagination = {
        page,
        limit,
        total,
        totalPages,
      };

      return {
        data: questions as unknown as QnAQuestionWithDetails[],
        pagination,
      };
    } catch (error) {
      throw new AppError("Failed to fetch questions", 500);
    }
  }

  /**
   * Get a single question with details
   */
  static async getQuestionById(questionId: string): Promise<QnAQuestionWithDetails> {
    try {
      const question = await QnAQuestionModel.findById(questionId)
        .populate("userId", "firstName lastName profilePicture userType")
        .populate("courseId", "title thumbnail")
        .populate({
          path: "replies",
          model: "QnAReply",
          populate: {
            path: "userId",
            select: "firstName lastName profilePicture userType",
          },
          options: { sort: { createdAt: 1 } },
        })
        .lean();

      if (!question) {
        throw new AppError("Question not found", 404);
      }

      // Increment view count
      await QnAQuestionModel.findByIdAndUpdate(questionId, {
        $inc: { viewCount: 1 },
      });

      return question as unknown as QnAQuestionWithDetails;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to fetch question", 500);
    }
  }

  /**
   * Update a question
   */
  static async updateQuestion(
    questionId: string,
    userId: string,
    updateData: {
      title?: string;
      description?: string;
      status?: "open" | "resolved" | "closed";
      priority?: "low" | "medium" | "high";
      tags?: string[];
    }
  ): Promise<QnAQuestion> {
    try {
      const question = await QnAQuestionModel.findById(questionId);
      if (!question) {
        throw new AppError("Question not found", 404);
      }

      // Check if user is the question owner
      if (question.userId?.toString() !== userId) {
        throw new AppError("Not authorized to update this question", 403);
      }

      const updatedQuestion = await QnAQuestionModel.findByIdAndUpdate(
        questionId,
        updateData,
        { new: true }
      );

      return updatedQuestion!;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to update question", 500);
    }
  }

  /**
   * Delete a question
   */
  static async deleteQuestion(questionId: string, userId: string): Promise<void> {
    try {
      const question = await QnAQuestionModel.findById(questionId);
      if (!question) {
        throw new AppError("Question not found", 404);
      }

      // Check if user is the question owner
      if (question.userId?.toString() !== userId) {
        throw new AppError("Not authorized to delete this question", 403);
      }

      // Delete all replies first
      await QnAReplyModel.deleteMany({ questionId });

      // Delete the question
      await QnAQuestionModel.findByIdAndDelete(questionId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to delete question", 500);
    }
  }

  /**
   * Create a reply to a question
   */
  static async createReply(
    questionId: string,
    userId: string,
    replyData: {
      content: string;
      parentReplyId?: string;
    }
  ): Promise<QnAReply> {
    try {
      // Verify question exists
      const question = await QnAQuestionModel.findById(questionId);
      if (!question) {
        throw new AppError("Question not found", 404);
      }

      // Verify user exists
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Check if user is enrolled in the course or is an instructor
      const enrollment = await mongoose.model("Enrollment").findOne({
        userId,
        courseId: question.courseId,
        status: { $in: ["active", "completed"] },
      });

      const isInstructor = user.userType === "instructor" || user.userType === "admin";
      const isCourseInstructor = question.courseId && 
        await CourseModel.findOne({
          _id: question.courseId,
          instructor: userId,
        });

      if (!enrollment && !isInstructor && !isCourseInstructor) {
        throw new AppError("User must be enrolled in the course or be an instructor to reply", 403);
      }

      // If replying to another reply, verify parent reply exists
      if (replyData.parentReplyId) {
        const parentReply = await QnAReplyModel.findById(replyData.parentReplyId);
        if (!parentReply || parentReply.questionId?.toString() !== questionId) {
          throw new AppError("Parent reply not found", 404);
        }
      }

      const reply = new QnAReplyModel({
        questionId,
        userId,
        content: replyData.content,
        isInstructorReply: isInstructor || !!isCourseInstructor,
        parentReplyId: replyData.parentReplyId || null,
      });

      await reply.save();
      return reply;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to create reply", 500);
    }
  }

  /**
   * Get replies for a question
   */
  static async getReplies(
    questionId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<QnAResponse<QnAReplyWithDetails>> {
    try {
      const skip = (page - 1) * limit;

      const replies = await QnAReplyModel.find({ questionId })
        .populate("userId", "firstName lastName profilePicture userType")
        .populate({
          path: "parentReply",
          populate: {
            path: "userId",
            select: "firstName lastName profilePicture userType",
          },
        })
        .populate({
          path: "nestedReplies",
          populate: {
            path: "userId",
            select: "firstName lastName profilePicture userType",
          },
        })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await QnAReplyModel.countDocuments({ questionId });
      const totalPages = Math.ceil(total / limit);

      const pagination: QnAPagination = {
        page,
        limit,
        total,
        totalPages,
      };

      return {
        data: replies as unknown as QnAReplyWithDetails[],
        pagination,
      };
    } catch (error) {
      throw new AppError("Failed to fetch replies", 500);
    }
  }

  /**
   * Update a reply
   */
  static async updateReply(
    replyId: string,
    userId: string,
    updateData: {
      content?: string;
      isAccepted?: boolean;
    }
  ): Promise<QnAReply> {
    try {
      const reply = await QnAReplyModel.findById(replyId);
      if (!reply) {
        throw new AppError("Reply not found", 404);
      }

      // Check if user is the reply owner or question owner
      const question = await QnAQuestionModel.findById(reply.questionId);
      if (!question) {
        throw new AppError("Question not found", 404);
      }

      const isReplyOwner = reply.userId?.toString() === userId;
      const isQuestionOwner = question.userId?.toString() === userId;

      if (!isReplyOwner && !isQuestionOwner) {
        throw new AppError("Not authorized to update this reply", 403);
      }

      // Only question owner can accept/reject replies
      if (updateData.isAccepted !== undefined && !isQuestionOwner) {
        throw new AppError("Only question owner can accept replies", 403);
      }

      const updatedReply = await QnAReplyModel.findByIdAndUpdate(
        replyId,
        updateData,
        { new: true }
      );

      return updatedReply!;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to update reply", 500);
    }
  }

  /**
   * Delete a reply
   */
  static async deleteReply(replyId: string, userId: string): Promise<void> {
    try {
      const reply = await QnAReplyModel.findById(replyId);
      if (!reply) {
        throw new AppError("Reply not found", 404);
      }

      // Check if user is the reply owner or question owner
      const question = await QnAQuestionModel.findById(reply.questionId);
      if (!question) {
        throw new AppError("Question not found", 404);
      }

      const isReplyOwner = reply.userId?.toString() === userId;
      const isQuestionOwner = question.userId?.toString() === userId;

      if (!isReplyOwner && !isQuestionOwner) {
        throw new AppError("Not authorized to delete this reply", 403);
      }

      // Delete nested replies first
      await QnAReplyModel.deleteMany({ parentReplyId: replyId });

      // Delete the reply
      await QnAReplyModel.findByIdAndDelete(replyId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to delete reply", 500);
    }
  }

  /**
   * Vote on a question or reply
   */
  static async vote(
    itemId: string,
    userId: string,
    itemType: "question" | "reply",
    voteType: "upvote" | "downvote" | "remove"
  ): Promise<void> {
    try {
      let item;
      if (itemType === "question") {
        item = await QnAQuestionModel.findById(itemId);
      } else {
        item = await QnAReplyModel.findById(itemId);
      }
      
      if (!item) {
        throw new AppError(`${itemType} not found`, 404);
      }

      const updateField = voteType === "upvote" ? "upvotes" : "downvotes";
      const increment = voteType === "remove" ? -1 : 1;

      if (itemType === "question") {
        await QnAQuestionModel.findByIdAndUpdate(itemId, {
          $inc: { [updateField]: increment },
        });
      } else {
        await QnAReplyModel.findByIdAndUpdate(itemId, {
          $inc: { [updateField]: increment },
        });
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to ${voteType} ${itemType}`, 500);
    }
  }

  /**
   * Get QnA statistics
   */
  static async getQnAStats(courseId?: string): Promise<QnAStats> {
    try {
      const query = courseId ? { courseId } : {};

      const [
        totalQuestions,
        openQuestions,
        resolvedQuestions,
        closedQuestions,
        totalReplies,
        instructorReplies,
      ] = await Promise.all([
        QnAQuestionModel.countDocuments(query),
        QnAQuestionModel.countDocuments({ ...query, status: "open" }),
        QnAQuestionModel.countDocuments({ ...query, status: "resolved" }),
        QnAQuestionModel.countDocuments({ ...query, status: "closed" }),
        QnAReplyModel.countDocuments(courseId ? { questionId: { $in: await QnAQuestionModel.find(query).select("_id") } } : {}),
        QnAReplyModel.aggregate([
          { $match: courseId ? { questionId: { $in: await QnAQuestionModel.find(query).select("_id") } } : {} },
          { $match: { isInstructorReply: true } },
          { $group: { _id: "$userId", replyCount: { $sum: 1 } } },
          { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
          { $unwind: "$user" },
          { $project: { instructorId: "$_id", instructorName: { $concat: ["$user.firstName", " ", "$user.lastName"] }, replyCount: 1 } },
          { $sort: { replyCount: -1 } },
          { $limit: 5 },
        ]),
      ]);

      const averageRepliesPerQuestion = totalQuestions > 0 ? totalReplies / totalQuestions : 0;

      return {
        totalQuestions,
        openQuestions,
        resolvedQuestions,
        closedQuestions,
        totalReplies,
        averageRepliesPerQuestion,
        averageResponseTime: 0, // This would need to be calculated based on actual data
        mostActiveInstructors: instructorReplies,
      };
    } catch (error) {
      throw new AppError("Failed to fetch QnA statistics", 500);
    }
  }
}
