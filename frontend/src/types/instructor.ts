import { Course, Review, User } from ".";

// ===================
// Instructor Type
// ===================

export interface CourseInstructor
  extends Omit<
    User,
    | "experienceLevel"
    | "enrolledCourses"
    | "pendingPayments"
    | "universityName"
    | "collegeName"
    | "collegeState"
    | "currentDegree"
    | "currentCourse"
    | "placementCellEmail"
    | "guardianPhone"
    | "isGuardianPhoneVerified"
    | "tenthMarks"
    | "twelfthMarks"
    | "pursuingMarks"
    | "referral"
  > {
  rating: number;
  totalStudents: number;
  bio?: string;
  currentPosition?: string;
  currentCompany?: string;
  previousExperience?: string[];
  linkedinUrl?: string; // TODO: remove this and add socialProfiles
  reviews: Review["_id"][];
  ownedCourses: Course["_id"][];
}
