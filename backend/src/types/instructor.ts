// ===================
// Instructor Type
// ===================

import { Types } from "mongoose";

export interface Instructor {
  _id?: Types.ObjectId;
  name: string;
  profileImage?: string;
  experience: string;
  rating: number;
  totalStudents: number;
  totalCourses: number;
  bio: string;
  currentPosition?: string;
  currentCompany?: string;
  previousExperience?: string[];
  education?: string[];
  linkedinUrl: string;
}