import { User, Course, CourseLesson, Content } from ".";

export interface QnAReply {
  _id?: string;
  userId: User["_id"];
  message: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QnA {
  _id?: string;
  courseId: Course["_id"];
  lessonId: CourseLesson["_id"];
  contentId: Content["_id"];
  userId: User["_id"];
  message: string;
  approved: boolean; // Admin approval required to show question
  notifyInstructor?: boolean;
  replies: QnAReply[];
  createdAt?: Date;
  updatedAt?: Date;
}
