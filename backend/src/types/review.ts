import { Course, Instructor, User } from ".";

// ===================
// Review Type
// ===================

export interface Review {
  _id?: string;
  userId: User["_id"];
  rating: number;
  comment: string;
  reviewableType: "Course" | "Instructor";
  reviewableId: Course["_id"] | Instructor["_id"]; // will be the id of the course or instructor
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
