import mongoose from "mongoose";
import { CourseModel } from "../models";
import { AppError } from "../middlewares/error.middleware";

/** Ensures the user is listed as an instructor on the course. */
export async function assertInstructorTeachesCourse(
  courseId: string,
  instructorUserId: string
): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new AppError("Invalid course id", 400);
  }
  const course = await CourseModel.findOne({
    _id: courseId,
    instructor: new mongoose.Types.ObjectId(instructorUserId),
  }).select("_id");
  if (!course) {
    throw new AppError(
      "Course not found or you are not an instructor for this course",
      403
    );
  }
}
