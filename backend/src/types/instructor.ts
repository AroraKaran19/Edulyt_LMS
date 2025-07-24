// ===================
// Instructor Type
// ===================

export interface Instructor {
  _id: string;
  name: string;
  profileImage?: string;
  experience: string;
  rating: number;
  totalStudents: number;
  totalCourses: number;
  bio: string;
  currentPosition?: string;
  previousExperience?: string[];
  education?: string[];
  linkedinUrl: string;
}