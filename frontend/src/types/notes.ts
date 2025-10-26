import { User, Course } from ".";

export interface VideoNote {
  _id?: string;
  user: User | string;
  courseId: Course | string;
  lessonId: string;
  contentId: string;
  content: string;
  timestamp: number; // Video timestamp in seconds
  createdAt?: Date;
  updatedAt?: Date;
}
