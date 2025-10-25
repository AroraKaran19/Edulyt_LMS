import { Course, Instructor, User } from ".";

// ===================
// Review Type
// ===================

export interface Review {
  _id?: string;
  userId: User;
  rating: number;
  comment: string;
  reviewableType: "Course" | "Instructor";
  reviewableId: Course["_id"] | Instructor["_id"];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
