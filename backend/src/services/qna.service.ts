import mongoose from "mongoose";
import { QnAQuestionModel, QnAReplyModel } from "../models";
import { CourseModel } from "../models/course.schema";
import { UserModel } from "../models/user.schema";
import { AppError } from "../middlewares/error.middleware";
import { QnAQuestion, QnAReply } from "../types/qna";

/**
 * Create a new QnA question
 * @param courseId - The ID of the course
 * @param userId - The ID of the user asking the question
 * @param question - The question text
 * @returns Promise<QnAQuestion>
 */
export const createQnAQuestion = async (
  courseId: string,
  userId: string,
  question: string
): Promise<QnAQuestion> => {
  try {
    // Validate course exists
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    // Validate user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Create the question
    const qnaQuestion = new QnAQuestionModel({
      courseId,
      userId,
      question,
      isResolved: false,
    });

    const savedQuestion = await qnaQuestion.save();
    return savedQuestion as QnAQuestion;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in createQnAQuestion:", error);
    throw new AppError(
      `Failed to create question: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Get all QnA questions for a course
 * @param courseId - The ID of the course
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @param isResolved - Filter by resolved status (optional)
 * @returns Promise<{questions: QnAQuestion[], total: number, page: number, totalPages: number}>
 */
export const getQnAQuestionsByCourse = async (
  courseId: string,
  page: number = 1,
  limit: number = 10,
  isResolved?: boolean
): Promise<{
  questions: QnAQuestion[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  try {
    // Input validation
    if (page < 1 || limit < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    if (limit > 100) {
      throw new AppError("Limit cannot exceed 100 items per page", 400);
    }

    // Validate course exists
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    // Build query
    const query: any = { courseId };
    if (isResolved !== undefined) {
      query.isResolved = isResolved;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const questions = await QnAQuestionModel.find(query)
      .populate("userId", "firstName lastName profilePicture userType")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await QnAQuestionModel.countDocuments(query);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      questions: questions as QnAQuestion[],
      total,
      page,
      totalPages,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in getQnAQuestionsByCourse:", error);
    throw new AppError(
      `Failed to retrieve questions: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Get a specific QnA question with its replies
 * @param questionId - The ID of the question
 * @returns Promise<QnAQuestion | null>
 */
export const getQnAQuestionById = async (
  questionId: string
): Promise<QnAQuestion | null> => {
  try {
    const question = await QnAQuestionModel.findById(questionId)
      .populate("userId", "firstName lastName profilePicture userType")
      .populate("courseId", "title slug")
      .lean();

    return question as QnAQuestion | null;
  } catch (error) {
    console.error("Database error in getQnAQuestionById:", error);
    throw new AppError(
      `Failed to retrieve question: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Create a reply to a QnA question
 * @param questionId - The ID of the question
 * @param userId - The ID of the user replying
 * @param reply - The reply text
 * @returns Promise<QnAReply>
 */
export const createQnAReply = async (
  questionId: string,
  userId: string,
  reply: string
): Promise<QnAReply> => {
  try {
    // Validate question exists
    const question = await QnAQuestionModel.findById(questionId);
    if (!question) {
      throw new AppError("Question not found", 404);
    }

    // Validate user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Check if user is an instructor for this course
    const course = await CourseModel.findById(question.courseId);
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    const isInstructorReply = course.instructor
      .filter(
        (instructorId): instructorId is NonNullable<typeof instructorId> =>
          instructorId != null
      )
      .some((instructorId) => instructorId.toString() === userId);

    // Create the reply
    const qnaReply = new QnAReplyModel({
      questionId,
      userId,
      reply,
      isInstructorReply,
    });

    const savedReply = await qnaReply.save();
    return savedReply as QnAReply;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in createQnAReply:", error);
    throw new AppError(
      `Failed to create reply: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Get all replies for a QnA question
 * @param questionId - The ID of the question
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @returns Promise<{replies: QnAReply[], total: number, page: number, totalPages: number}>
 */
export const getQnAReplysByQuestion = async (
  questionId: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  replies: QnAReply[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  try {
    // Input validation
    if (page < 1 || limit < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    if (limit > 100) {
      throw new AppError("Limit cannot exceed 100 items per page", 400);
    }

    // Validate question exists
    const question = await QnAQuestionModel.findById(questionId);
    if (!question) {
      throw new AppError("Question not found", 404);
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const replies = await QnAReplyModel.find({ questionId })
      .populate("userId", "firstName lastName profilePicture userType")
      .sort({ createdAt: 1 }) // Sort by creation time ascending (oldest first)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await QnAReplyModel.countDocuments({ questionId });

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      replies: replies as QnAReply[],
      total,
      page,
      totalPages,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in getQnAReplysByQuestion:", error);
    throw new AppError(
      `Failed to retrieve replies: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Mark a QnA question as resolved
 * @param questionId - The ID of the question
 * @param userId - The ID of the user (must be question owner or course instructor)
 * @returns Promise<QnAQuestion>
 */
export const markQuestionAsResolved = async (
  questionId: string,
  userId: string
): Promise<QnAQuestion> => {
  try {
    // Validate question exists
    const question = await QnAQuestionModel.findById(questionId);
    if (!question) {
      throw new AppError("Question not found", 404);
    }

    // Check if user is the question owner or a course instructor
    const course = await CourseModel.findById(question.courseId);
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    const isQuestionOwner = question.userId.toString() === userId;
    const isCourseInstructor = course.instructor
      .filter(
        (instructorId): instructorId is NonNullable<typeof instructorId> =>
          instructorId != null
      )
      .some((instructorId) => instructorId.toString() === userId);

    if (!isQuestionOwner && !isCourseInstructor) {
      throw new AppError("Unauthorized to mark this question as resolved", 403);
    }

    // Update the question
    const updatedQuestion = await QnAQuestionModel.findByIdAndUpdate(
      questionId,
      { isResolved: true, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate("userId", "firstName lastName profilePicture userType");

    return updatedQuestion as QnAQuestion;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in markQuestionAsResolved:", error);
    throw new AppError(
      `Failed to mark question as resolved: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Get QnA questions by user
 * @param userId - The ID of the user
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @returns Promise<{questions: QnAQuestion[], total: number, page: number, totalPages: number}>
 */
export const getQnAQuestionsByUser = async (
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  questions: QnAQuestion[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  try {
    // Input validation
    if (page < 1 || limit < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    if (limit > 100) {
      throw new AppError("Limit cannot exceed 100 items per page", 400);
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const questions = await QnAQuestionModel.find({ userId })
      .populate("courseId", "title slug thumbnail")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await QnAQuestionModel.countDocuments({ userId });

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      questions: questions as QnAQuestion[],
      total,
      page,
      totalPages,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in getQnAQuestionsByUser:", error);
    throw new AppError(
      `Failed to retrieve user questions: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};
