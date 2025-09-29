import { Course, Instructor } from ".";

// ===================
// Review Type
// ===================

export interface Review {
  _id?: string;
  name: string;
  rating: number;
  comment: string;
  reviewableType: "Course" | "Instructor";
  reviewableId: Course["_id"] | Instructor["_id"];
  profileImage?: string;
  currentRole: string;
  currentCompany: string;
  linkedin: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
