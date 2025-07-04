// Instructor-related types for Edulyt platform

export interface Instructor {
  id: string;
  name: string;
  profileImage?: string;
  experience: string; // e.g., "14 of Experience"
  rating: number;
  totalStudents: number;
  totalCourses: number;
  bio: string;
  currentPosition?: string;
  previousExperience?: string[];
  education?: string[];
  linkedinUrl: string;
} 