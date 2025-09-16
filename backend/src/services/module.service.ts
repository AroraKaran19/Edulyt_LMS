import { 
  CourseModuleModel, 
  CourseLessonModel, 
  ContentModel 
} from "../models/course-module.schema";
import { CourseModel } from "../models/course.schema";
import { CourseModule, CourseLesson, Content } from "../types/course";
import { AppError } from "../middlewares/error.middleware";
import mongoose from "mongoose";

/**
 * Get all modules with pagination
 * @param page - Page number
 * @param limit - Items per page
 * @param courseId - Filter by course ID
 * @param search - Search term for module title
 * @returns Promise<{modules: CourseModule[], total: number, page: number, totalPages: number}>
 */
export const getAllModules = async (
  page: number = 1,
  limit: number = 10,
  courseId?: string,
  search?: string
): Promise<{
  modules: CourseModule[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  try {
    // Build query object
    const query: any = {};

    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      // Find course and get its module IDs
      const course = await CourseModel.findById(courseId).select('modules').lean();
      if (course && course.modules) {
        query._id = { $in: course.modules };
      } else {
        // Course not found or has no modules
        return {
          modules: [],
          total: 0,
          page,
          totalPages: 0,
        };
      }
    }

    // Add search filter if provided
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await CourseModuleModel.countDocuments(query);

    const modules = await CourseModuleModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('lessons', 'title description isLocked')
      .lean();

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      modules,
      total,
      page,
      totalPages,
    };
  } catch (error) {
    console.error("Database error in getAllModules:", error);
    throw new AppError("Failed to fetch modules from database", 500);
  }
};

/**
 * Get module by ID
 * @param moduleId - Module ID
 * @returns Promise<CourseModule | null>
 */
export const getModuleById = async (moduleId: string): Promise<CourseModule | null> => {
  try {
    // Validate moduleId format
    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      throw new AppError("Invalid module ID format", 400);
    }

    const module = await CourseModuleModel.findById(moduleId)
      .populate('lessons')
      .lean();

    return module;
  } catch (error) {
    console.error("Database error in getModuleById:", error);
    throw new AppError("Failed to fetch module from database", 500);
  }
};

/**
 * Create a new module
 * @param moduleData - Module data
 * @returns Promise<{success: boolean, moduleId: string, message: string}>
 */
export const createModule = async (moduleData: Partial<CourseModule>) => {
  try {
    // Validate required fields
    if (!moduleData.title) {
      throw new AppError("Module title is required", 400);
    }

    // Validate field lengths
    if (moduleData.title.trim().length < 3) {
      throw new AppError("Module title must be at least 3 characters long", 400);
    }

    if (moduleData.title.trim().length > 200) {
      throw new AppError("Module title cannot exceed 200 characters", 400);
    }

    const newModule = new CourseModuleModel({
      title: moduleData.title.trim(),
      description: moduleData.description?.trim() || "",
      thumbnailUrl: moduleData.thumbnailUrl || "",
      lessons: [],
      isLocked: moduleData.isLocked || false,
      isActive: moduleData.isActive !== undefined ? moduleData.isActive : true,
    });

    await newModule.validate();
    await newModule.save();

    return {
      success: true,
      moduleId: newModule._id,
      message: "Module created successfully",
    };
  } catch (error) {
    console.error("Database error in createModule:", error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(field => 
        `${field}: ${error.errors[field].message}`
      ).join(', ');
      throw new AppError(`Validation failed: ${validationErrors}`, 400);
    }
    
    throw new AppError("Failed to create module", 500);
  }
};

/**
 * Update module
 * @param moduleId - Module ID
 * @param updateData - Module update data
 * @returns Promise<{success: boolean, message: string}>
 */
export const updateModule = async (
  moduleId: string,
  updateData: Partial<CourseModule>
): Promise<{success: boolean, message: string}> => {
  try {
    // Validate moduleId format
    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      throw new AppError("Invalid module ID format", 400);
    }

    // Remove fields that shouldn't be updated
    const { _id, lessons, createdAt, ...allowedUpdateData } = updateData;

    if (Object.keys(allowedUpdateData).length === 0) {
      throw new AppError("No valid fields provided for update", 400);
    }

    // Validate field lengths if provided
    if (allowedUpdateData.title) {
      if (allowedUpdateData.title.trim().length < 3) {
        throw new AppError("Module title must be at least 3 characters long", 400);
      }
      if (allowedUpdateData.title.trim().length > 200) {
        throw new AppError("Module title cannot exceed 200 characters", 400);
      }
      allowedUpdateData.title = allowedUpdateData.title.trim();
    }

    if (allowedUpdateData.description) {
      allowedUpdateData.description = allowedUpdateData.description.trim();
    }

    const updateResult = await CourseModuleModel.findByIdAndUpdate(
      moduleId,
      {
        ...allowedUpdateData,
        updatedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updateResult) {
      throw new AppError("Module not found", 404);
    }

    return {
      success: true,
      message: "Module updated successfully",
    };
  } catch (error) {
    console.error("Database error in updateModule:", error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(field => 
        `${field}: ${error.errors[field].message}`
      ).join(', ');
      throw new AppError(`Validation failed: ${validationErrors}`, 400);
    }
    
    throw new AppError("Failed to update module", 500);
  }
};

/**
 * Delete module
 * @param moduleId - Module ID
 * @returns Promise<{success: boolean, message: string}>
 */
export const deleteModule = async (moduleId: string): Promise<{success: boolean, message: string}> => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Validate moduleId format
      if (!mongoose.Types.ObjectId.isValid(moduleId)) {
        throw new AppError("Invalid module ID format", 400);
      }

      // Get module to check if it exists and get lesson IDs
      const module = await CourseModuleModel.findById(moduleId).session(session);
      if (!module) {
        throw new AppError("Module not found", 404);
      }

      // Delete all lessons associated with this module
      if (module.lessons && module.lessons.length > 0) {
        await CourseLessonModel.deleteMany(
          { _id: { $in: module.lessons } },
          { session }
        );
      }

      // Delete the module
      await CourseModuleModel.findByIdAndDelete(moduleId, { session });

      // Remove module reference from any courses
      await CourseModel.updateMany(
        { modules: moduleId },
        { $pull: { modules: moduleId } },
        { session }
      );
    });

    return {
      success: true,
      message: "Module and associated lessons deleted successfully",
    };
  } catch (error) {
    console.error("Database error in deleteModule:", error);
    throw new AppError("Failed to delete module", 500);
  } finally {
    await session.endSession();
  }
};

/**
 * Get all lessons with pagination
 * @param page - Page number
 * @param limit - Items per page
 * @param moduleId - Filter by module ID
 * @param search - Search term for lesson title
 * @returns Promise<{lessons: CourseLesson[], total: number, page: number, totalPages: number}>
 */
export const getAllLessons = async (
  page: number = 1,
  limit: number = 10,
  moduleId?: string,
  search?: string
): Promise<{
  lessons: CourseLesson[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  try {
    // Build query object
    const query: any = {};

    if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
      // Find module and get its lesson IDs
      const module = await CourseModuleModel.findById(moduleId).select('lessons').lean();
      if (module && module.lessons) {
        query._id = { $in: module.lessons };
      } else {
        // Module not found or has no lessons
        return {
          lessons: [],
          total: 0,
          page,
          totalPages: 0,
        };
      }
    }

    // Add search filter if provided
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await CourseLessonModel.countDocuments(query);

    const lessons = await CourseLessonModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('contentIds', 'title type')
      .lean();

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      lessons,
      total,
      page,
      totalPages,
    };
  } catch (error) {
    console.error("Database error in getAllLessons:", error);
    throw new AppError("Failed to fetch lessons from database", 500);
  }
};

/**
 * Get lesson by ID
 * @param lessonId - Lesson ID
 * @returns Promise<CourseLesson | null>
 */
export const getLessonById = async (lessonId: string): Promise<CourseLesson | null> => {
  try {
    // Validate lessonId format
    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      throw new AppError("Invalid lesson ID format", 400);
    }

    const lesson = await CourseLessonModel.findById(lessonId)
      .populate('contentIds')
      .lean();

    return lesson;
  } catch (error) {
    console.error("Database error in getLessonById:", error);
    throw new AppError("Failed to fetch lesson from database", 500);
  }
};

/**
 * Create a new lesson
 * @param lessonData - Lesson data
 * @returns Promise<{success: boolean, lessonId: string, message: string}>
 */
export const createLesson = async (lessonData: Partial<CourseLesson>) => {
  try {
    // Validate required fields
    if (!lessonData.title) {
      throw new AppError("Lesson title is required", 400);
    }

    // Validate field lengths
    if (lessonData.title.trim().length < 3) {
      throw new AppError("Lesson title must be at least 3 characters long", 400);
    }

    if (lessonData.title.trim().length > 200) {
      throw new AppError("Lesson title cannot exceed 200 characters", 400);
    }

    const newLesson = new CourseLessonModel({
      title: lessonData.title.trim(),
      description: lessonData.description?.trim() || "",
      contentIds: [],
      isLocked: lessonData.isLocked || false,
    });

    await newLesson.validate();
    await newLesson.save();

    return {
      success: true,
      lessonId: newLesson._id,
      message: "Lesson created successfully",
    };
  } catch (error) {
    console.error("Database error in createLesson:", error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(field => 
        `${field}: ${error.errors[field].message}`
      ).join(', ');
      throw new AppError(`Validation failed: ${validationErrors}`, 400);
    }
    
    throw new AppError("Failed to create lesson", 500);
  }
};

/**
 * Update lesson
 * @param lessonId - Lesson ID
 * @param updateData - Lesson update data
 * @returns Promise<{success: boolean, message: string}>
 */
export const updateLesson = async (
  lessonId: string,
  updateData: Partial<CourseLesson>
): Promise<{success: boolean, message: string}> => {
  try {
    // Validate lessonId format
    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      throw new AppError("Invalid lesson ID format", 400);
    }

    // Remove fields that shouldn't be updated
    const { _id, contentIds, createdAt, ...allowedUpdateData } = updateData;

    if (Object.keys(allowedUpdateData).length === 0) {
      throw new AppError("No valid fields provided for update", 400);
    }

    // Validate field lengths if provided
    if (allowedUpdateData.title) {
      if (allowedUpdateData.title.trim().length < 3) {
        throw new AppError("Lesson title must be at least 3 characters long", 400);
      }
      if (allowedUpdateData.title.trim().length > 200) {
        throw new AppError("Lesson title cannot exceed 200 characters", 400);
      }
      allowedUpdateData.title = allowedUpdateData.title.trim();
    }

    if (allowedUpdateData.description) {
      allowedUpdateData.description = allowedUpdateData.description.trim();
    }

    const updateResult = await CourseLessonModel.findByIdAndUpdate(
      lessonId,
      {
        ...allowedUpdateData,
        updatedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updateResult) {
      throw new AppError("Lesson not found", 404);
    }

    return {
      success: true,
      message: "Lesson updated successfully",
    };
  } catch (error) {
    console.error("Database error in updateLesson:", error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(field => 
        `${field}: ${error.errors[field].message}`
      ).join(', ');
      throw new AppError(`Validation failed: ${validationErrors}`, 400);
    }
    
    throw new AppError("Failed to update lesson", 500);
  }
};

/**
 * Delete lesson
 * @param lessonId - Lesson ID
 * @returns Promise<{success: boolean, message: string}>
 */
export const deleteLesson = async (lessonId: string): Promise<{success: boolean, message: string}> => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Validate lessonId format
      if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        throw new AppError("Invalid lesson ID format", 400);
      }

      // Get lesson to check if it exists and get content IDs
      const lesson = await CourseLessonModel.findById(lessonId).session(session);
      if (!lesson) {
        throw new AppError("Lesson not found", 404);
      }

      // Delete all content associated with this lesson
      if (lesson.contentIds && lesson.contentIds.length > 0) {
        await ContentModel.deleteMany(
          { _id: { $in: lesson.contentIds } },
          { session }
        );
      }

      // Delete the lesson
      await CourseLessonModel.findByIdAndDelete(lessonId, { session });

      // Remove lesson reference from any modules
      await CourseModuleModel.updateMany(
        { lessons: lessonId },
        { $pull: { lessons: lessonId } },
        { session }
      );
    });

    return {
      success: true,
      message: "Lesson and associated content deleted successfully",
    };
  } catch (error) {
    console.error("Database error in deleteLesson:", error);
    throw new AppError("Failed to delete lesson", 500);
  } finally {
    await session.endSession();
  }
};
