import { AppError } from "../middlewares/error.middleware";
import {
  LiveClassModel,
  CourseModel,
  EnrollmentModel,
  UserModel,
} from "../models";
import {
  deleteFilesFromS3,
  extractS3KeyFromUrl,
} from "./upload.services";
import { LiveClass } from "../types/live-classes";
import mongoose from "mongoose";

// ===================
// Create Live Class
// ===================
export const createLiveClassService = async (
  liveClassData: Partial<LiveClass>,
  instructorId: string,
  isAdmin: boolean = false
): Promise<LiveClass> => {
  // Validate required fields
  if (!liveClassData.title) {
    throw new AppError("Title is required", 400);
  }
  if (!liveClassData.course) {
    throw new AppError("Course is required", 400);
  }
  if (!liveClassData.startDate) {
    throw new AppError("Start date is required", 400);
  }
  if (!liveClassData.startTime) {
    throw new AppError("Start time is required", 400);
  }
  if (!liveClassData.endDate) {
    throw new AppError("End date is required", 400);
  }
  if (!liveClassData.endTime) {
    throw new AppError("End time is required", 400);
  }

  // Validate time format
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(liveClassData.startTime)) {
    throw new AppError("Start time must be in HH:mm format", 400);
  }
  if (!timeRegex.test(liveClassData.endTime)) {
    throw new AppError("End time must be in HH:mm format", 400);
  }

  // Validate that end date/time is after start date/time
  const startDateTime = new Date(liveClassData.startDate);
  const [startHours, startMinutes] = liveClassData.startTime.split(":").map(Number);
  startDateTime.setHours(startHours, startMinutes, 0, 0);

  const endDateTime = new Date(liveClassData.endDate);
  const [endHours, endMinutes] = liveClassData.endTime.split(":").map(Number);
  endDateTime.setHours(endHours, endMinutes, 0, 0);

  if (endDateTime <= startDateTime) {
    throw new AppError(
      "End date and time must be after start date and time",
      400
    );
  }

  // Set instructor from parameter (authenticated user) or from request body if admin
  // If admin provides instructor in request body, use that; otherwise use authenticated user
  let finalInstructorId: string = instructorId;
  if (liveClassData.instructor) {
    if (typeof liveClassData.instructor === "object" && liveClassData.instructor !== null) {
      const instructorObj = liveClassData.instructor as any;
      finalInstructorId = instructorObj._id?.toString() || String(instructorObj);
    } else {
      finalInstructorId = String(liveClassData.instructor);
    }
  }
  
  liveClassData.instructor = finalInstructorId;

  // Verify course exists
  const course = await CourseModel.findById(liveClassData.course);
  if (!course) {
    throw new AppError("Course not found", 404);
  }

  // For admins, skip instructor assignment check if they're creating for another instructor
  // For instructors, they must be assigned to the course
  if (!isAdmin) {
  // Check if instructor is assigned to the course
  const courseInstructors = (course.instructor || []).map((inst: any) =>
    typeof inst === "object" && inst._id ? inst._id.toString() : inst.toString()
  );
    if (!courseInstructors.includes(finalInstructorId)) {
    throw new AppError("Instructor is not assigned to this course", 403);
    }
  } else {
    // For admins, verify the instructor exists and optionally check if assigned to course
    const instructor = await UserModel.findById(finalInstructorId);
    if (!instructor) {
      throw new AppError("Instructor not found", 404);
    }
    if (instructor.userType !== "instructor") {
      throw new AppError("Specified user is not an instructor", 400);
    }
    // Optionally verify instructor is assigned to course (warning only, not blocking)
    const courseInstructors = (course.instructor || []).map((inst: any) =>
      typeof inst === "object" && inst._id ? inst._id.toString() : inst.toString()
    );
    if (!courseInstructors.includes(finalInstructorId)) {
      // For admins, we allow creating even if instructor is not assigned (they can assign later)
      // But we could throw an error if you want to enforce it
      // throw new AppError("Instructor is not assigned to this course", 403);
    }
  }

  const liveClass = new LiveClassModel(liveClassData);
  await liveClass.save();

  return liveClass.toObject() as LiveClass;
};

// ===================
// Update Live Class
// ===================
export const updateLiveClassService = async (
  liveClassId: string,
  updateData: Partial<LiveClass>
): Promise<LiveClass | null> => {
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(liveClassId)) {
    throw new AppError("Invalid live class ID", 400);
  }

  // Validate time format if provided
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  if (updateData.startTime && !timeRegex.test(updateData.startTime)) {
    throw new AppError("Start time must be in HH:mm format", 400);
  }
  if (updateData.endTime && !timeRegex.test(updateData.endTime)) {
    throw new AppError("End time must be in HH:mm format", 400);
  }

  // Get current live class for validation
  const currentLiveClass = await LiveClassModel.findById(liveClassId);
  if (!currentLiveClass) {
    throw new AppError("Live class not found", 404);
  }

  // Validate that end date/time is after start date/time
  const startDate = updateData.startDate || currentLiveClass.startDate;
  const startTime = updateData.startTime || currentLiveClass.startTime;
  const endDate = updateData.endDate || currentLiveClass.endDate;
  const endTime = updateData.endTime || currentLiveClass.endTime;

  const startDateTime = new Date(startDate);
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  startDateTime.setHours(startHours, startMinutes, 0, 0);

  const endDateTime = new Date(endDate);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  endDateTime.setHours(endHours, endMinutes, 0, 0);

  if (endDateTime <= startDateTime) {
    throw new AppError(
      "End date and time must be after start date and time",
      400
    );
  }

  // If course is being updated, verify it exists
  if (updateData.course) {
    const course = await CourseModel.findById(updateData.course);
    if (!course) {
      throw new AppError("Course not found", 404);
    }
  }

  // If instructor is being updated, verify it exists and is assigned to the course
  if (updateData.instructor) {
    const instructor = await UserModel.findById(updateData.instructor);
    if (!instructor) {
      throw new AppError("Instructor not found", 404);
    }

    // If course is also being updated or exists, verify instructor is assigned
    const courseId =
      updateData.course || (await LiveClassModel.findById(liveClassId))?.course;
    if (courseId) {
      const course = await CourseModel.findById(courseId);
      if (course) {
        const courseInstructors = (course.instructor || []).map((inst: any) =>
          typeof inst === "object" && inst._id
            ? inst._id.toString()
            : inst.toString()
        );
        if (!courseInstructors.includes(updateData.instructor.toString())) {
          throw new AppError("Instructor is not assigned to this course", 403);
        }
      }
    }
  }

  const updatedLiveClass = await LiveClassModel.findByIdAndUpdate(
    liveClassId,
    { ...updateData, updatedAt: new Date() },
    { new: true, runValidators: true }
  );

  if (!updatedLiveClass) {
    throw new AppError("Live class not found", 404);
  }

  return updatedLiveClass.toObject() as LiveClass;
};

// ===================
// Get All Live Classes (Admin)
// ===================
export const getAllLiveClassesService = async (
  page: number = 1,
  limit: number = 10
): Promise<{
  liveClasses: LiveClass[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  const skip = (page - 1) * limit;

  const liveClasses = await LiveClassModel.find({})
    .populate("instructor", "firstName lastName email profilePicture")
    .populate("course", "title thumbnail slug")
    .sort({ startDate: 1, startTime: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await LiveClassModel.countDocuments({});
  const totalPages = Math.ceil(total / limit);

  return {
    liveClasses: liveClasses as LiveClass[],
    total,
    page,
    totalPages,
  };
};

// ===================
// Get All Ongoing Live Classes (Admin)
// ===================
export const getAllOngoingLiveClassesService = async (
  page: number = 1,
  limit: number = 10
): Promise<{
  liveClasses: LiveClass[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  const skip = (page - 1) * limit;
  const now = new Date();

  // Find live classes that are currently ongoing (started but not ended)
  // Fetch all and filter in memory (simpler approach)
  const allLiveClasses = await LiveClassModel.find({})
    .populate("instructor", "firstName lastName email profilePicture")
    .populate("course", "title thumbnail slug")
    .sort({ startDate: 1, startTime: 1 })
    .lean();

  // Filter ongoing live classes by combining date and time
  const ongoingLiveClasses = allLiveClasses.filter((liveClass: any) => {
    const startDateTime = new Date(liveClass.startDate);
    const [startHours, startMinutes] = liveClass.startTime.split(":").map(Number);
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    const endDateTime = new Date(liveClass.endDate);
    const [endHours, endMinutes] = liveClass.endTime.split(":").map(Number);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    return startDateTime <= now && endDateTime >= now;
  });

  // Apply pagination
  const total = ongoingLiveClasses.length;
  const liveClasses = ongoingLiveClasses.slice(skip, skip + limit);

  const totalPages = Math.ceil(total / limit);

  return {
    liveClasses: liveClasses as LiveClass[],
    total,
    page,
    totalPages,
  };
};

// ===================
// Get Instructor's Course Live Classes
// ===================
export const getInstructorLiveClassesService = async (
  instructorId: string,
  page: number = 1,
  limit: number = 10,
  courseId?: string
): Promise<{
  liveClasses: LiveClass[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  const skip = (page - 1) * limit;

  // Build filter
  const filter: any = { instructor: instructorId };
  if (courseId) {
    filter.course = courseId;
  }

  const liveClasses = await LiveClassModel.find(filter)
    .populate("course", "title thumbnail slug")
    .sort({ startDate: 1, startTime: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await LiveClassModel.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  return {
    liveClasses: liveClasses as LiveClass[],
    total,
    page,
    totalPages,
  };
};

// ===================
// Get Student's Enrolled Course Live Classes
// ===================
export const getStudentLiveClassesService = async (
  studentId: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  liveClasses: LiveClass[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  const skip = (page - 1) * limit;

  // Get all courses the student is enrolled in with ELITE plan only
  const enrollments = await EnrollmentModel.find({
    userId: studentId,
    status: { $in: ["active", "completed"] },
    planType: "elite", // Only elite plan enrollments
  }).select("courseId");

  const enrolledCourseIds = enrollments.map(
    (enrollment) => enrollment.courseId
  );

  if (enrolledCourseIds.length === 0) {
    return {
      liveClasses: [],
      total: 0,
      page,
      totalPages: 0,
    };
  }

  // Get live classes for enrolled courses
  const liveClasses = await LiveClassModel.find({
    course: { $in: enrolledCourseIds },
  })
    .populate("instructor", "firstName lastName email profilePicture")
    .populate("course", "title thumbnail slug")
    .sort({ startDate: 1, startTime: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await LiveClassModel.countDocuments({
    course: { $in: enrolledCourseIds },
  });

  const totalPages = Math.ceil(total / limit);

  return {
    liveClasses: liveClasses as LiveClass[],
    total,
    page,
    totalPages,
  };
};

// ===================
// Get Live Class By ID
// ===================
export const getLiveClassByIdService = async (
  liveClassId: string
): Promise<LiveClass | null> => {
  if (!mongoose.Types.ObjectId.isValid(liveClassId)) {
    return null;
  }

  const liveClass = await LiveClassModel.findById(liveClassId)
    .populate("instructor", "firstName lastName email profilePicture")
    .populate("course", "title thumbnail slug description")
    .lean();

  return liveClass as LiveClass | null;
};

// ===================
// Delete Live Class
// ===================
export const deleteLiveClassService = async (
  liveClassId: string
): Promise<boolean> => {
  if (!mongoose.Types.ObjectId.isValid(liveClassId)) {
    throw new AppError("Invalid live class ID", 400);
  }

  const liveClass = await LiveClassModel.findById(liveClassId).lean();
  if (!liveClass) {
    throw new AppError("Live class not found", 404);
  }

  // Delete image from S3 in background (non-blocking)
  if (liveClass.imageUrl) {
    const key = extractS3KeyFromUrl(liveClass.imageUrl);
    if (key) {
      deleteFilesFromS3([key]).catch((err) =>
        console.error("[DeleteLiveClass] S3 cleanup failed:", err)
      );
    }
  }

  await LiveClassModel.findByIdAndDelete(liveClassId);
  return true;
};
