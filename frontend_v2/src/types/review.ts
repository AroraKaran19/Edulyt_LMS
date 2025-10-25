import { Course, Instructor, User } from ".";

// ===================
// Review Type
// ===================

export interface Review {
  _id?: string;
  userId: User | string;
  rating: number;
  comment: string;
  reviewableType: "Course" | "Instructor";
  reviewableId: Course | Instructor | string; // will be the id of the course or instructor
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
