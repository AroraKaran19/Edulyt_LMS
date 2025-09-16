import { Request, Response } from "express";
import { asyncHandler, AppError, sendSuccessResponse } from "../middlewares/error.middleware";
import { CreateCourseMetadata, UpdateCourseMetadata } from "../services/course.service";
import { CourseModel } from "../models/course.schema";

// ===================
// Step 1: Basic Course Information
// ===================

/**
 * Create course with basic information (Step 1)
 */
export const saveBasicInfo = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const {
      title,
      description,
      shortDescription,
      category,
      subcategory,
      audience,
      language,
      duration,
      curriculum,
      // Note: curriculumSource and curriculumS3Key are frontend-only fields
    } = req.body;

    if (!title || !description || !category) {
      throw new AppError("Title, description, and category are required", 400);
    }

    console.log("📝 Creating course with basic info:", {
      title,
      category,
      audience,
      language
    });

    // Create course metadata using existing service
    const result = await CreateCourseMetadata({
      title,
      description,
      shortDescription,
      category,
      subcategory,
      audience: audience || "college-students",
      language: language || "English",
      duration,
      curriculum,
      // Set initial status as inactive (will be activated in finalize step)
      isActive: false,
    });

    sendSuccessResponse(
      res,
      { 
        courseId: result.courseId,
        step: "basic-info"
      },
      "Basic course information saved successfully",
      201
    );
  }
);

// ===================
// Step 2: Learning Objectives
// ===================

/**
 * Update course with learning objectives (Step 2)
 */
export const saveLearningObjectives = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;
    const { whatYouWillLearn, skills, highlights, features } = req.body;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    console.log(`📝 Updating course ${courseId} with learning objectives`);

    const result = await UpdateCourseMetadata(courseId, {
      whatYouWillLearn,
      skills,
      highlights,
      features,
    });

    sendSuccessResponse(
      res,
      { 
        courseId,
        updated: true,
        step: "learning-objectives"
      },
      "Learning objectives saved successfully",
      200
    );
  }
);

// ===================
// Step 3: Media
// ===================

/**
 * Update course with media (Step 3)
 */
export const saveMedia = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;
    const { 
      thumbnail, 
      previewVideoUrl,
      // Note: Source and S3Key fields are frontend-only
    } = req.body;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    console.log(`📝 Updating course ${courseId} with media`);

    const result = await UpdateCourseMetadata(courseId, {
      thumbnail,
      previewVideoUrl,
    });

    sendSuccessResponse(
      res,
      { 
        courseId,
        updated: true,
        step: "media"
      },
      "Media information saved successfully",
      200
    );
  }
);

// ===================
// Step 4: Audience & Requirements
// ===================

/**
 * Update course with audience and requirements (Step 4)
 */
export const saveAudienceRequirements = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;
    const { skillLevel, whoShouldJoin, prerequisites, careerPaths } = req.body;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    console.log(`📝 Updating course ${courseId} with audience requirements`);

    const result = await UpdateCourseMetadata(courseId, {
      skillLevel,
      whoShouldJoin,
      prerequisites,
      careerPaths,
    });

    sendSuccessResponse(
      res,
      { 
        courseId,
        updated: true,
        step: "audience-requirements"
      },
      "Audience requirements saved successfully",
      200
    );
  }
);

// ===================
// Step 5: Pricing
// ===================

/**
 * Update course with pricing (Step 5)
 */
export const savePricing = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;
    const { plans, discount, scholarship, scholarshipDescription } = req.body;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    console.log(`📝 Updating course ${courseId} with pricing`);

    const result = await UpdateCourseMetadata(courseId, {
      plans,
      discount,
      scholarship,
      scholarshipDescription,
    });

    sendSuccessResponse(
      res,
      { 
        courseId,
        updated: true,
        step: "pricing"
      },
      "Pricing information saved successfully",
      200
    );
  }
);

// ===================
// Step 6: Additional Content
// ===================

/**
 * Update course with additional content (Step 6)
 */
export const saveAdditionalContent = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;
    const { testimonials, faqs, prerequisites } = req.body;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    console.log(`📝 Updating course ${courseId} with additional content`);

    const result = await UpdateCourseMetadata(courseId, {
      testimonials,
      faqs,
      prerequisites, // Can also be updated here if needed
    });

    sendSuccessResponse(
      res,
      { 
        courseId,
        updated: true,
        step: "additional-content"
      },
      "Additional content saved successfully",
      200
    );
  }
);

// ===================
// Step 7: Course Content (Modules & Lessons)
// ===================

/**
 * Update course with modules and lessons (Step 7)
 */
export const saveCourseContent = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;
    const { modules } = req.body;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    console.log(`📝 Updating course ${courseId} with content (${modules?.length || 0} modules)`);

    // For now, use the metadata service to save modules
    // In the future, this could use the specific module creation services
    const result = await UpdateCourseMetadata(courseId, {
      modules,
    });

    sendSuccessResponse(
      res,
      { 
        courseId,
        updated: true,
        step: "course-content",
        modulesCount: modules?.length || 0
      },
      "Course content saved successfully",
      200
    );
  }
);

// ===================
// Step 8: Finalize Course
// ===================

/**
 * Finalize course creation (Step 8)
 */
export const finalizeCourse = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;
    const { isActive = true } = req.body;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    console.log(`📝 Finalizing course ${courseId}`);

    // Set course as active
    const result = await UpdateCourseMetadata(courseId, {
      isActive,
    });

    sendSuccessResponse(
      res,
      { 
        courseId,
        updated: true,
        isActive,
        step: "finalized"
      },
      "Course finalized successfully",
      200
    );
  }
);

// ===================
// Utility: Get Course Step Data
// ===================

/**
 * Get course data for step-by-step editing
 */
export const getCourseStep = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    console.log(`📖 Getting course step data for ${courseId}`);

    const course = await CourseModel.findById(courseId); // Allow inactive courses

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    sendSuccessResponse(
      res,
      { course },
      "Course step data retrieved successfully",
      200
    );
  }
);
