import { User, Course, CourseLesson, Content } from ".";

export interface QnAReply {
  _id?: string;
  userId: User | string;
  message: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QnA {
  _id?: string;
  courseId: Course | string;
  lessonId: CourseLesson | string | null;
  contentId: Content | string | null;
  userId: User | string;
  message: string;
  approved: boolean; // Instructor/Admin approval required to show question
  notifyInstructor?: boolean;
  replies: QnAReply[];
  totalReplies?: number; // Total count when replies are paginated
  createdAt?: Date;
  updatedAt?: Date;
}
