import { User, Course } from ".";

export interface VideoNote {
  _id?: string;
  userId: string | User;
  courseId: string | Course;
  lessonId: string;
  contentId: string;
  content: string;
  timestamp: number; // Video timestamp in seconds
  createdAt?: Date;
  updatedAt?: Date;
}
