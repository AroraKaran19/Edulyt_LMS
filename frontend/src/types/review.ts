import { Course, Instructor, User } from ".";

// ===================
// Review Type
// ===================

export interface Review {
  _id?: string;
  userId: User | string;
  rating: number;
  comment: string;
  reviewableType: "Course" | "Instructor" | "Internship";
  reviewableId: Course | Instructor | string;
  internshipBatchId?: string;
  isActive: boolean;
  approved: boolean; // Instructor/Admin approval required to show review
  createdAt?: Date;
  updatedAt?: Date;
}
