import { Course, Instructor, User } from ".";

// ===================
// Review Type
// ===================

export interface Review {
  _id?: string;
  userId: User["_id"];
  rating: number;
  comment: string;
  reviewableType: "Course" | "Instructor" | "Internship";
  /** Course, Instructor, or Internship id (see `reviewableType`). */
  reviewableId: Course["_id"] | Instructor["_id"] | string;
  /**
   * When `reviewableType` is `Internship`, optional id of the embedded batch subdocument
   * so the review is scoped to that intake batch.
   */
  internshipBatchId?: string;
  isActive: boolean;
  approved: boolean; // Instructor/Admin approval required to show review
  createdAt?: Date;
  updatedAt?: Date;
}
