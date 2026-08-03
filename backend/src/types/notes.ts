import { User, Course } from ".";

export interface VideoNote {
  _id?: string;
  userId: User["_id"];
  courseId: Course["_id"];
  lessonId: string;
  contentId: string;
  content: string;
  timestamp: number; // Video timestamp in seconds
  createdAt?: Date;
  updatedAt?: Date;
}
