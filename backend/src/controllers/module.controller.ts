import { Request, Response } from "express";
import {
  getAllModules as getAllModulesService,
  getModuleById as getModuleByIdService,
  createModule as createModuleService,
  updateModule as updateModuleService,
  deleteModule as deleteModuleService,
  getAllLessons as getAllLessonsService,
  getLessonById as getLessonByIdService,
  createLesson as createLessonService,
  updateLesson as updateLessonService,
  deleteLesson as deleteLessonService,
} from "../services/module.service";
import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";

// ===================
// Module Controllers
// ===================

/**
 * Get all modules with pagination
 */
export const getAllModules = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { 
      page = 1, 
      limit = 10, 
      courseId, 
      search 
    } = req.query;

    const modules = await getAllModulesService(
      Number(page),
      Number(limit),
      courseId as string,
      search as string
    );

    sendSuccessResponse(res, modules, "Modules retrieved successfully", 200);
  }
);

/**
 * Get module by ID
 */
export const getModuleById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { moduleId } = req.params;

    if (!moduleId) {
      throw new AppError("Module ID is required", 400);
    }

    const module = await getModuleByIdService(moduleId);

    if (!module) {
      throw new AppError("Module not found", 404);
    }

    sendSuccessResponse(res, { module }, "Module retrieved successfully", 200);
  }
);

/**
 * Create a new module
 */
export const createModule = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const moduleData = req.body;

    if (!moduleData) {
      throw new AppError("Module data is required", 400);
    }

    console.log("📝 Creating module:", {
      title: moduleData.title,
      hasDescription: !!moduleData.description
    });

    const result = await createModuleService(moduleData);

    sendSuccessResponse(
      res,
      { moduleId: result.moduleId },
      result.message,
      201
    );
  }
);

/**
 * Update module
 */
export const updateModule = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { moduleId } = req.params;
    const updateData = req.body;

    if (!moduleId) {
      throw new AppError("Module ID is required", 400);
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      throw new AppError("Update data is required", 400);
    }

    console.log("📝 Updating module:", moduleId);

    const result = await updateModuleService(moduleId, updateData);

    sendSuccessResponse(
      res,
      { moduleId, updated: true },
      result.message,
      200
    );
  }
);

/**
 * Delete module
 */
export const deleteModule = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { moduleId } = req.params;

    if (!moduleId) {
      throw new AppError("Module ID is required", 400);
    }

    console.log("🗑️ Deleting module:", moduleId);

    const result = await deleteModuleService(moduleId);

    sendSuccessResponse(
      res,
      { moduleId, deleted: true },
      result.message,
      200
    );
  }
);

// ===================
// Lesson Controllers
// ===================

/**
 * Get all lessons with pagination
 */
export const getAllLessons = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { 
      page = 1, 
      limit = 10, 
      moduleId, 
      search 
    } = req.query;

    const lessons = await getAllLessonsService(
      Number(page),
      Number(limit),
      moduleId as string,
      search as string
    );

    sendSuccessResponse(res, lessons, "Lessons retrieved successfully", 200);
  }
);

/**
 * Get lesson by ID
 */
export const getLessonById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { lessonId } = req.params;

    if (!lessonId) {
      throw new AppError("Lesson ID is required", 400);
    }

    const lesson = await getLessonByIdService(lessonId);

    if (!lesson) {
      throw new AppError("Lesson not found", 404);
    }

    sendSuccessResponse(res, { lesson }, "Lesson retrieved successfully", 200);
  }
);

/**
 * Create a new lesson
 */
export const createLesson = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const lessonData = req.body;

    if (!lessonData) {
      throw new AppError("Lesson data is required", 400);
    }

    console.log("📝 Creating lesson:", {
      title: lessonData.title,
      hasDescription: !!lessonData.description
    });

    const result = await createLessonService(lessonData);

    sendSuccessResponse(
      res,
      { lessonId: result.lessonId },
      result.message,
      201
    );
  }
);

/**
 * Update lesson
 */
export const updateLesson = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { lessonId } = req.params;
    const updateData = req.body;

    if (!lessonId) {
      throw new AppError("Lesson ID is required", 400);
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      throw new AppError("Update data is required", 400);
    }

    console.log("📝 Updating lesson:", lessonId);

    const result = await updateLessonService(lessonId, updateData);

    sendSuccessResponse(
      res,
      { lessonId, updated: true },
      result.message,
      200
    );
  }
);

/**
 * Delete lesson
 */
export const deleteLesson = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { lessonId } = req.params;

    if (!lessonId) {
      throw new AppError("Lesson ID is required", 400);
    }

    console.log("🗑️ Deleting lesson:", lessonId);

    const result = await deleteLessonService(lessonId);

    sendSuccessResponse(
      res,
      { lessonId, deleted: true },
      result.message,
      200
    );
  }
);

/**
 * Get module statistics
 */
export const getModuleStats = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.query;

    const modules = await getAllModulesService(1, 1, courseId as string);
    const lessons = await getAllLessonsService(1, 1);

    sendSuccessResponse(
      res,
      {
        totalModules: modules.total,
        totalLessons: lessons.total,
        modulesByFilter: courseId ? modules.total : undefined
      },
      "Module statistics retrieved successfully",
      200
    );
  }
);
