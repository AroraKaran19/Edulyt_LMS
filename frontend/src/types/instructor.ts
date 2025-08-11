// ===================
// Instructor Type
// ===================

import { Course } from ".";
import { Review } from "./review";

export interface CourseInstructor {
  _id?: string;
  name: string;
  profileImage?: string;
  // experience?: string;
  rating?: number;
  totalStudents?: number;
  totalCourses?: number;
  bio?: string;
  currentPosition?: string;
  currentCompany?: string;
  previousExperience?: string[];
  // education?: string[];
  linkedinUrl?: string;
  reviews?: Review[];
  courses?: Course[];
  createdAt?: Date;
  updatedAt?: Date;
}