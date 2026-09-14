import mongoose from "mongoose";
import { DEFAULT_BRAND, isBrand, type Brand } from "../constants/brands";
import { brandFromAudience } from "../lib/brandRules";

/**
 * A course's brand, falling back to its audience so writes are correct even
 * before the backfill has branded the catalogue.
 */
export const courseBrand = async (courseId: unknown): Promise<Brand> => {
  if (!courseId) {
    return DEFAULT_BRAND;
  }
  const course = await mongoose
    .model("Course")
    .findById(courseId)
    .select("brand audience")
    .lean<{ brand?: string; audience?: string } | null>();
  if (!course) {
    return DEFAULT_BRAND;
  }
  return isBrand(course.brand) ? course.brand : brandFromAudience(course.audience);
};

export const enrollmentBrand = async (enrollmentId: unknown): Promise<Brand> => {
  if (!enrollmentId) {
    return DEFAULT_BRAND;
  }
  const enrollment = await mongoose
    .model("Enrollment")
    .findById(enrollmentId)
    .select("brand courseId")
    .lean<{ brand?: string; courseId?: unknown } | null>();
  if (!enrollment) {
    return DEFAULT_BRAND;
  }
  return isBrand(enrollment.brand)
    ? enrollment.brand
    : await courseBrand(enrollment.courseId);
};

/**
 * Internship and letter-of-recommendation certificates say so through
 * `enrollmentModel`, which needs no lookup. A course certificate follows its
 * course, or its enrollment when the course has been unlinked.
 */
export const certificateBrand = async (doc: {
  get: (path: string) => unknown;
}): Promise<Brand> => {
  if (doc.get("enrollmentModel") === "InternshipEnrollment") {
    return "edulyt";
  }
  const courseId = doc.get("courseId");
  return courseId ? courseBrand(courseId) : enrollmentBrand(doc.get("enrollmentId"));
};
