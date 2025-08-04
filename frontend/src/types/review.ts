import { Course, CourseInstructor } from ".";

// ===================
// Review Type
// ===================

export interface Review {
  _id?: string;
  name: string;
  rating: number;
  comment: string;
  reviewableType: "Course" | "Instructor";
  reviewableId: Course["_id"] | CourseInstructor["_id"];
  profileImage?: string;
  currentRole: string;
  currentCompany: string;
  linkedin: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
