// ===================
// Review Type
// ===================

import { Course, CourseInstructor } from ".";

export interface Review {
    _id?: string;
    name: string;
    rating: number;
    comment: string;
    reviewableType: "course" | "instructor";
    reviewableId: Course["_id"] | CourseInstructor["_id"];
    profileImage?: string;
    currentRole: string;
    currentCompany: string;
    linkedin: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }