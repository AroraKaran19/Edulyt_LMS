import { User, Course } from ".";

export interface QnAQuestion {
  _id?: string;
  courseId: string | Course;
  userId: string | User;
  question: string;
  isResolved: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QnAReply {
  _id?: string;
  questionId: string | QnAQuestion;
  userId: string | User;
  reply: string;
  isInstructorReply: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
