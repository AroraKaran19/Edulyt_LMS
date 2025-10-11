import { User, Course } from ".";

// QnA Question interface
export interface QnAQuestion {
  _id?: string;
  courseId: Course["_id"];
  userId: User["_id"]; // User who asked the question
  title: string;
  description: string;
  status: "open" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  tags?: string[];
  isAnonymous?: boolean;
  upvotes?: number;
  downvotes?: number;
  viewCount?: number;
  lastActivityAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// QnA Reply interface
export interface QnAReply {
  _id?: string;
  questionId: QnAQuestion["_id"];
  userId: User["_id"]; // User who replied (instructor or original questioner)
  content: string;
  isInstructorReply: boolean;
  isAccepted?: boolean; // Marked as accepted answer by questioner
  upvotes?: number;
  downvotes?: number;
  parentReplyId?: QnAReply["_id"]; // For nested replies
  createdAt?: Date;
  updatedAt?: Date;
}

// QnA Question with populated data
export interface QnAQuestionWithDetails extends QnAQuestion {
  user: {
    _id: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    userType: string;
  };
  course: {
    _id: string;
    title: string;
    thumbnail: string;
  };
  replies: QnAReplyWithDetails[];
  replyCount: number;
}

// QnA Reply with populated data
export interface QnAReplyWithDetails extends QnAReply {
  user: {
    _id: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    userType: string;
  };
  parentReply?: QnAReplyWithDetails;
  nestedReplies?: QnAReplyWithDetails[];
}

// QnA Statistics
export interface QnAStats {
  totalQuestions: number;
  openQuestions: number;
  resolvedQuestions: number;
  closedQuestions: number;
  totalReplies: number;
  averageRepliesPerQuestion: number;
  averageResponseTime: number; // In hours
  mostActiveInstructors: Array<{
    instructorId: string;
    instructorName: string;
    replyCount: number;
  }>;
}

// QnA Filters
export interface QnAFilters {
  courseId?: string;
  userId?: string;
  status?: "open" | "resolved" | "closed";
  priority?: "low" | "medium" | "high";
  isInstructorReply?: boolean;
  search?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

// QnA Pagination
export interface QnAPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// QnA Response with pagination
export interface QnAResponse<T> {
  data: T[];
  pagination: QnAPagination;
}
