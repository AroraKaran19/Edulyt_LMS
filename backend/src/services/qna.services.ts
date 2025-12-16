import { QnAModel } from "../models";
import { QnA } from "../types/qna";

export const getAllQnAsService = async (
  page: number,
  limit: number,
  search: string,
  courseId?: string,
  lessonId?: string,
  contentId?: string,
  isAdmin?: boolean,
  approved?: boolean
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

  // Lesson filter
  if (lessonId) {
    filters.lessonId = lessonId;
  }

  // Content filter
  if (contentId) {
    filters.contentId = contentId;
  }

  const qnas = await QnAModel.find(filters)
    .populate("userId", isAdmin ? "-__v" : "firstName lastName email profilePicture")
    .populate("replies.userId", isAdmin ? "-__v" : "firstName lastName email profilePicture")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await QnAModel.countDocuments(filters);
  const totalPages = Math.ceil(total / limit);

  return {
    qnas,
    total,
    totalPages,
    page,
  };
};

export const getQnAByIdService = async (
  id: string,
  isAdmin?: boolean
): Promise<QnA | null> => {
  let query = QnAModel.findById(id);
  
  // Only show approved Q&As to non-admins
  if (!isAdmin) {
    query = query.where({ approved: true });
  }
  
  const qna = await query
    .populate("userId", isAdmin ? "-__v" : "firstName lastName email profilePicture")
    .populate("replies.userId", isAdmin ? "-__v" : "firstName lastName email profilePicture");

  if (!qna) {
    return null;
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
  message: string
): Promise<any> => {
  const reply = await QnAModel.addReply(qnaId, userId, message);

  // Get the updated QnA with populated data
  const updatedQnA = await QnAModel.findById(qnaId)
    .populate("userId", "firstName lastName email profilePicture")
    .populate("replies.userId", "firstName lastName email profilePicture");

  return updatedQnA;
};

export const removeReplyFromQnAService = async (
  qnaId: string,
  replyId: string,
  userId: string
): Promise<QnA | null> => {
  await QnAModel.removeReply(qnaId, replyId, userId);

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
  )
    .populate("userId", "firstName lastName email profilePicture")
    .populate("replies.userId", "firstName lastName email profilePicture");

  if (!qna) {
    return null;
  }

  return qna as QnA;
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
