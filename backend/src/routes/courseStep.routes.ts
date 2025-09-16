import { Router } from "express";
import {
  saveBasicInfo,
  saveLearningObjectives,
  saveMedia,
  saveAudienceRequirements,
  savePricing,
  saveAdditionalContent,
  saveCourseContent,
  finalizeCourse,
  getCourseStep,
} from "../controllers/courseStep.controller";
// import { verifyAdmin } from "../middlewares/admin.middleware";

const router = Router();

// ===================
// Step-by-Step Course Creation Routes
// ===================

/**
 * @route   POST /api/courses/step/basic-info
 * @desc    Save basic course information (Step 1)
 * @access  Admin/Instructor
 * @body    Basic course data
 * @example
 *   POST /api/courses/step/basic-info
 *   Body: {
 *     "title": "New Course",
 *     "description": "Course description",
 *     "category": "programming",
 *     "audience": "professionals"
 *   }
 */
router.post("/basic-info", saveBasicInfo);

/**
 * @route   PUT /api/courses/step/:courseId/learning-objectives
 * @desc    Save learning objectives (Step 2)
 * @access  Admin/Instructor
 * @params  courseId - Course ID
 * @body    Learning objectives data
 * @example
 *   PUT /api/courses/step/64a1b2c3d4e5f6789012345/learning-objectives
 *   Body: {
 *     "whatYouWillLearn": "You will learn...",
 *     "skills": ["JavaScript", "React"],
 *     "highlights": [{"title": "Feature", "description": "Desc"}]
 *   }
 */
router.put("/:courseId/learning-objectives", saveLearningObjectives);

/**
 * @route   PUT /api/courses/step/:courseId/media
 * @desc    Save media information (Step 3)
 * @access  Admin/Instructor
 * @params  courseId - Course ID
 * @body    Media data
 * @example
 *   PUT /api/courses/step/64a1b2c3d4e5f6789012345/media
 *   Body: {
 *     "thumbnail": "https://...",
 *     "previewVideoUrl": "https://..."
 *   }
 */
router.put("/:courseId/media", saveMedia);

/**
 * @route   PUT /api/courses/step/:courseId/audience
 * @desc    Save audience and requirements (Step 4)
 * @access  Admin/Instructor
 * @params  courseId - Course ID
 * @body    Audience requirements data
 * @example
 *   PUT /api/courses/step/64a1b2c3d4e5f6789012345/audience
 *   Body: {
 *     "skillLevel": "beginner",
 *     "whoShouldJoin": "Anyone interested in...",
 *     "prerequisites": ["Basic computer skills"],
 *     "careerPaths": ["Web Developer"]
 *   }
 */
router.put("/:courseId/audience", saveAudienceRequirements);


/**
 * @route   PUT /api/courses/step/:courseId/pricing
 * @desc    Save pricing information (Step 5)
 * @access  Admin/Instructor
 * @params  courseId - Course ID
 * @body    Pricing data
 * @example
 *   PUT /api/courses/step/64a1b2c3d4e5f6789012345/pricing
 *   Body: {
 *     "plans": {
 *       "essential": {...},
 *       "elite": {...}
 *     },
 *     "discount": {...}
 *   }
 */
router.put("/:courseId/pricing", savePricing);

/**
 * @route   PUT /api/courses/step/:courseId/additional-content
 * @desc    Save additional content (Step 6)
 * @access  Admin/Instructor
 * @params  courseId - Course ID
 * @body    Additional content data
 * @example
 *   PUT /api/courses/step/64a1b2c3d4e5f6789012345/additional-content
 *   Body: {
 *     "testimonials": [...],
 *     "faqs": [...],
 *     "prerequisites": [...]
 *   }
 */
router.put("/:courseId/additional-content", saveAdditionalContent);

/**
 * @route   PUT /api/courses/step/:courseId/content
 * @desc    Save course content - modules and lessons (Step 7)
 * @access  Admin/Instructor
 * @params  courseId - Course ID
 * @body    Course content data
 * @example
 *   PUT /api/courses/step/64a1b2c3d4e5f6789012345/content
 *   Body: {
 *     "modules": [...]
 *   }
 */
router.put("/:courseId/content", saveCourseContent);

/**
 * @route   PUT /api/courses/step/:courseId/finalize
 * @desc    Finalize course creation (Step 8)
 * @access  Admin/Instructor
 * @params  courseId - Course ID
 * @body    Finalization data
 * @example
 *   PUT /api/courses/step/64a1b2c3d4e5f6789012345/finalize
 *   Body: {
 *     "isActive": true
 *   }
 */
router.put("/:courseId/finalize", finalizeCourse);

/**
 * @route   GET /api/courses/step/:courseId
 * @desc    Get course data for step-by-step editing
 * @access  Admin/Instructor
 * @params  courseId - Course ID
 * @example
 *   GET /api/courses/step/64a1b2c3d4e5f6789012345
 */
router.get("/:courseId", getCourseStep);

export default router;
