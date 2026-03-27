import mongoose from "mongoose";
import { CourseModel, QnAModel, UserModel } from "../models";
import { AppError } from "../middlewares/error.middleware";
import { QnA } from "../types/qna";

function refIdString(ref: unknown): string {
  if (ref != null && typeof ref === "object" && "_id" in (ref as object)) {
    return String((ref as { _id: unknown })._id);
  }
  return String(ref);
}

/** Last message = question if no replies; else chronologically last reply (any depth in flat list). */
export function getLastMessageAuthorId(qna: {
  userId: unknown;
  replies?: Array<{ userId: unknown; createdAt?: Date; _id?: unknown }>;
}): string {
  const replies = qna.replies ?? [];
  if (replies.length === 0) {
    return refIdString(qna.userId);
  }
  const sorted = [...replies].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (ta !== tb) return ta - tb;
    return String(a._id ?? "").localeCompare(String(b._id ?? ""));
  });
  const last = sorted[sorted.length - 1];
  return refIdString(last.userId);
}

/** Admin / super-admin, or listed instructor on the course = "staff"; last message from staff ⇒ notifyInstructor false. */
export async function isUserStaffOnCourse(
  userId: string,
  courseId: string
): Promise<boolean> {
  const user = await UserModel.findById(userId).select("userType").lean();
  if (
    user &&
    (user.userType === "admin" || user.userType === "super-admin")
  ) {
    return true;
  }
  const course = await CourseModel.findById(courseId).select("instructor").lean();
  if (!course) {
    return false;
  }
  return isUserIdInCourseInstructorList(course, userId);
}

/**
 * Sets notifyInstructor: true if the last message in the thread is not from staff
 * (admin/super-admin or a course instructor).
 */
export async function syncNotifyInstructorForQna(qnaId: string): Promise<void> {
  const qna = await QnAModel.findById(qnaId)
    .select("userId courseId replies")
    .lean();
  if (!qna) {
    return;
  }
  const lastAuthorId = getLastMessageAuthorId(qna as {
    userId: unknown;
    replies?: Array<{ userId: unknown; createdAt?: Date; _id?: unknown }>;
  });
  const staff = await isUserStaffOnCourse(
    lastAuthorId,
    String(qna.courseId)
  );
  const notifyInstructor = !staff;
  await QnAModel.updateOne(
    { _id: qnaId },
    { $set: { notifyInstructor } }
  );
}

function isUserIdInCourseInstructorList(
  course: { instructor?: unknown },
  userId: string
): boolean {
  const raw = course.instructor;
  if (raw == null) return false;
  const list = Array.isArray(raw) ? raw : [raw];
  return list.some((id) => String(id) === String(userId));
}

/** Admin, course instructor, or original asker may post a reply. */
export async function assertUserCanReplyToQnA(
  qnaId: string,
  userId: string,
  userType: string | undefined
): Promise<void> {
  if (userType === "admin" || userType === "super-admin") {
    return;
  }
  const qna = await QnAModel.findById(qnaId).select("courseId userId").lean();
  if (!qna) {
    throw new AppError("QnA not found", 404);
  }
  if (String(qna.userId) === String(userId)) {
    return;
  }
  const course = await CourseModel.findById(qna.courseId)
    .select("instructor")
    .lean();
  if (!course) {
    throw new AppError("Course not found", 404);
  }
  if (isUserIdInCourseInstructorList(course, userId)) {
    return;
  }
  throw new AppError("You are not allowed to reply to this question", 403);
}

/** Admin, thread author, or course instructor may delete the whole QnA (including all replies). */
export async function assertUserCanDeleteQnA(
  qnaId: string,
  userId: string,
  userType: string | undefined
): Promise<void> {
  if (userType === "admin" || userType === "super-admin") {
    return;
  }
  const qna = await QnAModel.findById(qnaId).select("courseId userId").lean();
  if (!qna) {
    throw new AppError("QnA not found", 404);
  }
  if (String(qna.userId) === String(userId)) {
    return;
  }
  const course = await CourseModel.findById(qna.courseId)
    .select("instructor")
    .lean();
  if (!course) {
    throw new AppError("Course not found", 404);
  }
  if (isUserIdInCourseInstructorList(course, userId)) {
    return;
  }
  throw new AppError("You are not allowed to delete this question", 403);
}

export const getAllQnAsService = async (
  page: number,
  limit: number,
  search: string,
  courseId?: string,
  lessonId?: string,
  contentId?: string,
  isAdmin?: boolean,
  approved?: boolean,
  repliesLimit?: number
): Promise<{
  qnas: QnA[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  const skip = (page - 1) * limit;

  let filters: any = {};

  // Only show approved Q&As for non-admin users
  if (!isAdmin) {
    filters.approved = true;
  } else {
    // Admin can filter by approval status
    if (approved !== undefined) {
      filters.approved = approved;
    }
  }

  if (search) {
    filters.$or = [
      { message: { $regex: search, $options: "i" } },
      { "replies.message": { $regex: search, $options: "i" } },
    ];
  }

  if (courseId) {
    filters.courseId = courseId;
  }
  if (lessonId) {
    filters.lessonId = lessonId;
  }
  if (contentId) {
    filters.contentId = contentId;
  }

  const rawQnas = await QnAModel.find(filters)
    .populate("userId", isAdmin ? "-__v" : "firstName lastName email profilePicture")
    .populate("courseId", "title slug")
    .populate("replies.userId", isAdmin ? "-__v" : "firstName lastName email profilePicture")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();

  const total = await QnAModel.countDocuments(filters);
  const totalPages = Math.ceil(total / limit);

  // Limit replies per QnA for optimized payload (chronological order, first N)
  const qnas: QnA[] =
    repliesLimit !== undefined && repliesLimit > 0
      ? rawQnas.map((qna: any) => {
        const replies = (qna.replies || []).sort(
          (a: any, b: any) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        return {
          ...qna,
          totalReplies: replies.length,
          replies: replies.slice(0, repliesLimit),
        };
      }) as QnA[]
      : (rawQnas as QnA[]);

  return {
    qnas,
    total,
    totalPages,
    page,
  };
};

export const getRepliesForQnAService = async (
  qnaId: string,
  page: number,
  limit: number,
  isAdmin?: boolean
): Promise<{ replies: any[]; total: number; page: number; totalPages: number } | null> => {
  const qna = await QnAModel.findById(qnaId).select("replies").lean();
  if (!qna || !qna.replies) {
    return { replies: [], total: 0, page, totalPages: 0 };
  }

  const sortedReplies = (qna.replies as any[])
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const total = sortedReplies.length;
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;
  const paginatedReplies = sortedReplies.slice(skip, skip + limit);

  const replyIds = paginatedReplies.map((r) => r.userId).filter(Boolean);
  const users = await mongoose.model("User").find({ _id: { $in: replyIds } })
    .select(isAdmin ? "-__v" : "firstName lastName email profilePicture")
    .lean();

  const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));
  const populatedReplies = paginatedReplies.map((reply) => ({
    ...reply,
    userId: userMap.get(reply.userId?.toString?.() || reply.userId) || reply.userId,
  }));

  return {
    replies: populatedReplies,
    total,
    page,
    totalPages,
  };
};

export const getQnAByIdService = async (
  id: string,
  isAdmin?: boolean,
  instructorUserId?: string
): Promise<QnA | null> => {
  let query = QnAModel.findById(id);

  // Only admins may fetch a thread by id before it is approved; everyone else sees approved only.
  const seeUnapproved = !!isAdmin;
  if (!seeUnapproved) {
    query = query.where({ approved: true });
  }

  const qna = await query
    .populate(
      "userId",
      isAdmin ? "-__v" : "firstName lastName email profilePicture"
    )
    .populate(
      "replies.userId",
      isAdmin ? "-__v" : "firstName lastName email profilePicture"
    );

  if (!qna) {
    return null;
  }

  if (instructorUserId && !isAdmin) {
    const cid =
      typeof qna.courseId === "object" && qna.courseId !== null
        ? (qna.courseId as { _id?: mongoose.Types.ObjectId })._id ??
        (qna.courseId as mongoose.Types.ObjectId)
        : qna.courseId;
    const course = await CourseModel.findById(cid).select("instructor").lean();
    const instructors =
      (course?.instructor as mongoose.Types.ObjectId[] | undefined) ?? [];
    const allowed = instructors.some(
      (i) => String(i) === String(instructorUserId)
    );
    if (!allowed) {
      return null;
    }
  }

  return qna as QnA;
};

export const createQnAService = async (qnaData: {
  courseId: string;
  lessonId: string | null;
  contentId: string | null;
  userId: string;
  message: string;
}): Promise<QnA | null> => {
  const qna = new QnAModel(qnaData);
  const savedQnA = await qna.save();

  if (!savedQnA) {
    return null;
  }

  await syncNotifyInstructorForQna(String(savedQnA._id));

  // Populate user data with firstName, lastName, email and profilePicture
  const populatedQnA = await QnAModel.findById(savedQnA._id).populate(
    "userId",
    "firstName lastName email profilePicture"
  );

  return populatedQnA as QnA;
};

export const updateQnAService = async (
  id: string,
  updateData: { message?: string },
  isAdmin?: boolean
): Promise<QnA | null> => {
  const qna = await QnAModel.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("userId", isAdmin ? "-__v" : "firstName lastName email profilePicture")
    .populate("replies.userId", isAdmin ? "-__v" : "firstName lastName email profilePicture");

  if (!qna) {
    return null;
  }

  return qna as QnA;
};

export const deleteQnAService = async (id: string): Promise<QnA | null> => {
  const qna = await QnAModel.findByIdAndDelete(id);

  if (!qna) {
    return null;
  }

  return qna as QnA;
};

export const addReplyToQnAService = async (
  qnaId: string,
  userId: string,
  message: string,
  userType?: string
): Promise<any> => {
  await assertUserCanReplyToQnA(qnaId, userId, userType);
  await QnAModel.addReply(qnaId, userId, message);
  await syncNotifyInstructorForQna(qnaId);

  // Get the updated QnA with populated data
  const updatedQnA = await QnAModel.findById(qnaId)
    .populate("userId", "firstName lastName email profilePicture")
    .populate("replies.userId", "firstName lastName email profilePicture");

  return updatedQnA;
};

export const removeReplyFromQnAService = async (
  qnaId: string,
  replyId: string,
  userId: string | mongoose.Types.ObjectId
): Promise<QnA | null> => {
  try {
    await QnAModel.removeReply(qnaId, replyId, userId);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "QnA not found") {
      throw new AppError(msg, 404);
    }
    if (msg === "Reply not found or unauthorized") {
      throw new AppError(msg, 403);
    }
    throw e;
  }

  await syncNotifyInstructorForQna(qnaId);

  // Get the updated QnA with populated data
  const updatedQnA = await QnAModel.findById(qnaId)
    .populate("userId", "firstName lastName email profilePicture")
    .populate("replies.userId", "firstName lastName email profilePicture");

  return updatedQnA as QnA;
};

// Approve a Q&A (instructor/admin only)
export const approveQnAService = async (id: string): Promise<QnA | null> => {
  const qna = await QnAModel.findByIdAndUpdate(
    id,
    { approved: true },
    { new: true, runValidators: true }
  );

  if (!qna) {
    return null;
  }

  await syncNotifyInstructorForQna(id);

  const populated = await QnAModel.findById(id)
    .populate("userId", "firstName lastName email profilePicture")
    .populate("replies.userId", "firstName lastName email profilePicture");

  return populated as QnA;
};

// Reject/Un-approve a Q&A (instructor/admin only)
export const rejectQnAService = async (id: string): Promise<QnA | null> => {
  const qna = await QnAModel.findByIdAndUpdate(
    id,
    { approved: false },
    { new: true, runValidators: true }
  )
    .populate("userId", "firstName lastName email profilePicture")
    .populate("replies.userId", "firstName lastName email profilePicture");

  if (!qna) {
    return null;
  }

  return qna as QnA;
};
