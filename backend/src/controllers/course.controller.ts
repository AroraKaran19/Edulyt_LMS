import { CourseService } from "../services/course.service";
import { JobService } from "../services/job.service";
import { Request, Response } from "express";
import dotenv from "dotenv";
import { Course } from "../types/course";
dotenv.config();

export class CourseController {
  private courseService: CourseService;
  private jobService: JobService;

  constructor() {
    this.courseService = new CourseService();
    this.jobService = new JobService();
  }

  /**
   * Get all courses with pagination and filtering
   * @query page - Page number (default: 1)
   * @query limit - Items per page (default: 10, max: 100)
   * @query filter - Filter by categories (can be used multiple times: "?filter=web&filter=app&filter=ml")
   * @query category - Filter by categories (comma-separated: "programming,design,business") - alternative to filter
   * @query audience - Filter by target audience ("college-students" or "professionals")
   * @query search - Search term for title/description
   * @query dataLevel - Data level: 'summary' | 'basic' | 'full' (default: 'basic')
   * @query fields - Specific fields to include (comma-separated)
   */
  getAllCourses = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const dataLevel =
        (req.query.dataLevel as "summary" | "basic" | "full") || "basic";

      // Handle fields parameter
      let fields: string[] | undefined;
      if (req.query.fields) {
        fields = (req.query.fields as string)
          .split(",")
          .map((field) => field.trim());
      }

      // Handle multiple filter parameters
      let filters: string[] = [];

      // Support both 'filter' and 'category' parameters for backward compatibility
      if (req.query.filter) {
        if (Array.isArray(req.query.filter)) {
          filters = req.query.filter as string[];
        } else {
          filters = [req.query.filter as string];
        }
      } else if (req.query.category) {
        // Handle category parameter (can be comma-separated or single value)
        if (Array.isArray(req.query.category)) {
          filters = req.query.category as string[];
        } else {
          // Split by comma if it's a comma-separated string
          filters = (req.query.category as string)
            .split(",")
            .map((cat) => cat.trim());
        }
      }

      // Handle audience parameter for filtering by target audience
      let audienceFilter: string | undefined;
      if (req.query.audience) {
        audienceFilter = req.query.audience as string;
      }

      // Validate pagination parameters
      if (page < 1) {
        res.status(400).json({
          success: false,
          message: "Page number must be greater than 0",
        });
        return;
      }

      if (limit < 1 || limit > 100) {
        res.status(400).json({
          success: false,
          message: "Limit must be between 1 and 100",
        });
        return;
      }

      // Validate dataLevel parameter
      if (!["summary", "basic", "full"].includes(dataLevel)) {
        res.status(400).json({
          success: false,
          message: "dataLevel must be one of: summary, basic, full",
        });
        return;
      }

      const result = await this.courseService.getAllCourses(
        page,
        limit,
        search,
        filters,
        audienceFilter,
        dataLevel,
        fields
      );

      if (result.total === 0) {
        res.status(200).json({
          success: true,
          message: "No courses found",
          data: {
            courses: [],
            total: 0,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Courses fetched successfully",
        data: {
          courses: result.courses,
          pagination: {
            total: result.total,
            page: page,
            totalPages: Math.ceil(result.total / limit),
            limit: limit,
            hasNext: page < Math.ceil(result.total / limit),
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      console.error("Error in getAllCourses controller:", error);

      // Generic error response
      res.status(500).json({
        success: false,
        message: "Internal server error while fetching courses",
        error:
          process.env.NODE_ENV === "development"
            ? error
            : "Something went wrong",
      });
    }
  };

  /**
   * Create a new course (async processing)
   * @param req - Express request object
   * @param res - Express response object
   */
  createCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseData: Partial<Course> = req.body;

      const cleanedData = await this.courseService.cleanCourseData(courseData);

      // Validate course data
      const validation = this.courseService.validateCourseData(cleanedData);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
        return;
      }

      // Start async course creation job
      const jobId = await this.jobService.createCourseJob(cleanedData);

      // Return job ID for tracking
      res.status(202).json({
        success: true,
        message: "Course creation started. Use the job ID to track progress.",
        data: {
          jobId: jobId,
          status: "processing",
          trackingUrl: `/api/jobs/${jobId}/status`,
        },
      });
    } catch (error: any) {
      console.error("Error in createCourse controller:", error);

      // Handle MongoDB duplicate key errors (E11000)
      if (error.code === 11000) {
        // Extract field name from error message for better user experience
        let field = "data";
        if (error.message.includes("slug")) {
          field = "course slug";
        }

        res.status(409).json({
          success: false,
          message: `A course with this ${field} already exists`,
        });
        return;
      }

      // Handle validation errors
      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map(
          (err: any) => err.message
        );
        res.status(400).json({
          success: false,
          message: "Invalid course data",
          errors: validationErrors,
        });
        return;
      }

      // Generic error response
      res.status(500).json({
        success: false,
        message: "Internal server error while creating course",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Something went wrong",
      });
    }
  };

  /**
   * Get featured courses
   * @param req - Express request object
   * @param res - Express response object
   */
  getFeaturedCourses = async (req: Request, res: Response): Promise<void> => {
    try {
      // Get featured courses
      const featuredCourses = await this.courseService.getFeaturedCourses();

      // Return success response
      res.status(200).json({
        success: true,
        message: "Featured courses retrieved successfully",
        data: {
          courses: featuredCourses,
          total: featuredCourses.length,
        },
      });
    } catch (error) {
      console.error("Error in getFeaturedCourses controller:", error);

      // Generic error response
      res.status(500).json({
        success: false,
        message: "Internal server error while fetching featured courses",
        error:
          process.env.NODE_ENV === "development"
            ? error
            : "Something went wrong",
      });
    }
  };

  /**
   * Get a course by slug
   * @param req - Express request object
   * @param res - Express response object
   * @param slug - Course slug from URL parameters
   */
  getCourseBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
      const { slug } = req.params;

      // Validate slug parameter
      if (!slug?.trim()) {
        res.status(400).json({
          success: false,
          message: "Course slug is required",
        });
        return;
      }

      // Get course by slug
      const course = await this.courseService.getCourseBySlug(slug);

      // Handle course not found
      if (!course) {
        res.status(404).json({
          success: false,
          message: "Course not found",
        });
        return;
      }

      // Return success response
      res.status(200).json({
        success: true,
        message: "Course retrieved successfully",
        data: {
          course,
        },
      });
    } catch (error) {
      console.error("Error in getCourseBySlug controller:", error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes("Course slug is required")) {
          res.status(400).json({
            success: false,
            message: "Invalid course slug",
            error: error.message,
          });
          return;
        }
      }

      // Generic error response
      res.status(500).json({
        success: false,
        message: "Internal server error while fetching course",
        error:
          process.env.NODE_ENV === "development"
            ? error
            : "Something went wrong",
      });
    }
  };

  /**
   * Get a course by ID
   * @param req - Express request object
   * @param res - Express response object
   * @param courseId - Course ID from URL parameters
   */
  getCourseById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { courseId } = req.params;

      // Validate courseId parameter
      if (!courseId?.trim()) {
        res.status(400).json({
          success: false,
          message: "Course ID is required",
        });
        return;
      }

      // Get course by ID
      const course = await this.courseService.getCourseById(courseId);

      // Handle course not found
      if (!course) {
        res.status(404).json({
          success: false,
          message: "Course not found",
        });
        return;
      }

      // Return success response
      res.status(200).json({
        success: true,
        message: "Course retrieved successfully",
        data: {
          course,
        },
      });
    } catch (error) {
      console.error("Error in getCourseById controller:", error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes("Course ID is required")) {
          res.status(400).json({
            success: false,
            message: "Invalid course ID",
            error: error.message,
          });
          return;
        }
      }

      // Generic error response
      res.status(500).json({
        success: false,
        message: "Internal server error while fetching course",
        error:
          process.env.NODE_ENV === "development"
            ? error
            : "Something went wrong",
      });
    }
  };

  /**
   * Update a course by ID
   * @param req - Express request object
   * @param res - Express response object
   * @param courseId - Course ID from URL parameters
   */
  updateCourseById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { courseId } = req.params;
      const courseData: Partial<Course> = req.body;

      // Validate course data
      const validation = this.courseService.validateCourseData(courseData);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
        return;
      }

      // Update the course
      const updatedCourse = await this.courseService.updateCourse(
        courseId,
        courseData
      );

      // Return success response
      res.status(200).json({
        success: true,
        message: "Course updated successfully",
        data: {
          course: updatedCourse,
        },
      });
    } catch (error) {
      console.error("Error in updateCourseById controller:", error);
    }
  };

  /**
   * Update course status
   * @param req - Express request object
   * @param res - Express response object
   * @param courseId - Course ID from URL parameters
   */
  updateCourseStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { courseId } = req.params;
      const { isActive } = req.body;

      // Update course status
      const updatedCourse = await this.courseService.updateCourseStatus(
        courseId,
        isActive
      );

      // Return success response
      res.status(200).json({
        success: true,
        message: "Course status updated successfully",
        data: {
          course: updatedCourse,
        },
      });
    } catch (error) {
      console.error("Error in updateCourseStatus controller:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while updating course status",
      });
    }
  };

  /**
   * Update course status in bulk
   * @param req - Express request object
   * @param res - Express response object
   */
  updateCourseStatusBulk = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const courses = req.body.courses;
      const isActive = req.body.isActive;

      // Update course status in bulk
      await this.courseService.updateCourseStatusBulk(courses, isActive);

      // Return success response
      res.status(200).json({
        success: true,
        message: "Course status updated successfully in bulk",
      });
    } catch (error) {
      console.error("Error in updateCourseStatusBulk controller:", error);
    }
  };

  /**
   * Delete a course by ID
   * @param req - Express request object
   * @param res - Express response object
   * @param courseId - Course ID from URL parameters
   */
  deleteCourseById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { courseId } = req.params;

      // Delete the course
      await this.courseService.deleteCourse(courseId);

      // Return success response
      res.status(200).json({
        success: true,
        message: "Course deleted successfully",
      });
    } catch (error) {
      console.error("Error in deleteCourseById controller:", error);

      res.status(500).json({
        success: false,
        message: "Internal server error while deleting course",
      });
    }
  };

  /**
   * Get a course by ID (Admin version - includes inactive courses)
   * @param req - Express request object
   * @param res - Express response object
   * @param courseId - Course ID from URL parameters
   */
  getCourseByIdAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
      const { courseId } = req.params;

      // Validate courseId parameter
      if (!courseId?.trim()) {
        res.status(400).json({
          success: false,
          message: "Course ID is required",
        });
        return;
      }

      // Get course by ID (admin version - includes inactive courses)
      const course = await this.courseService.getCourseByIdAdmin(courseId);

      // Handle course not found
      if (!course) {
        res.status(404).json({
          success: false,
          message: "Course not found",
        });
        return;
      }

      // Return success response
      res.status(200).json({
        success: true,
        message: "Course retrieved successfully",
        data: {
          course,
        },
      });
    } catch (error) {
      console.error("Error in getCourseByIdAdmin controller:", error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes("Course ID is required")) {
          res.status(400).json({
            success: false,
            message: "Invalid course ID",
            error: error.message,
          });
          return;
        }
      }

      // Generic error response
      res.status(500).json({
        success: false,
        message: "Internal server error while fetching course",
        error:
          process.env.NODE_ENV === "development"
            ? error
            : "Something went wrong",
      });
    }
  };

  /**
   * Create course metadata (first step of chunked creation)
   * @param req - Express request object
   * @param res - Express response object
   */
  createCourseMetadata = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseMetadata: Partial<Course> = req.body;

      // Remove modules from metadata if present
      const { modules, ...metadataOnly } = courseMetadata;

      const cleanedData = await this.courseService.cleanCourseData(
        metadataOnly
      );

      // Validate course metadata
      const validation = this.courseService.validateCourseMetadata(cleanedData);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
        return;
      }

      // Create the course with metadata only
      const createdCourse = await this.courseService.createCourseMetadata(
        cleanedData
      );

      // Return success response
      res.status(201).json({
        success: true,
        message: "Course metadata created successfully",
        data: {
          courseId: createdCourse._id,
          course: createdCourse,
        },
      });
    } catch (error: any) {
      console.error("Error in createCourseMetadata controller:", error);

      // Handle MongoDB duplicate key errors (E11000)
      if (error.code === 11000) {
        let field = "data";
        if (error.message.includes("slug")) {
          field = "course slug";
        }

        res.status(409).json({
          success: false,
          message: `A course with this ${field} already exists`,
        });
        return;
      }

      // Handle validation errors
      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map(
          (err: any) => err.message
        );
        res.status(400).json({
          success: false,
          message: "Invalid course metadata",
          errors: validationErrors,
        });
        return;
      }

      // Generic error response
      res.status(500).json({
        success: false,
        message: "Internal server error while creating course metadata",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Something went wrong",
      });
    }
  };

  /**
   * Add modules to an existing course (chunked creation)
   * @param req - Express request object
   * @param res - Express response object
   */
  addCourseModules = async (req: Request, res: Response): Promise<void> => {
    try {
      const { courseId } = req.params;
      const modules = req.body;

      if (!courseId) {
        res.status(400).json({
          success: false,
          message: "Course ID is required",
        });
        return;
      }

      if (!Array.isArray(modules) || modules.length === 0) {
        res.status(400).json({
          success: false,
          message: "Modules array is required and cannot be empty",
        });
        return;
      }

      // Add modules to the course
      const result = await this.courseService.addModulesToCourse(
        courseId,
        modules
      );

      res.status(200).json({
        success: true,
        message: "Modules added successfully",
        data: {
          moduleIds: result.moduleIds,
          addedCount: result.addedCount,
        },
      });
    } catch (error: any) {
      console.error("Error in addCourseModules controller:", error);

      if (error.message.includes("Course not found")) {
        res.status(404).json({
          success: false,
          message: "Course not found",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Internal server error while adding modules",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Something went wrong",
      });
    }
  };

  /**
   * Add lessons to course modules (chunked creation)
   * @param req - Express request object
   * @param res - Express response object
   */
  addCourseLessons = async (req: Request, res: Response): Promise<void> => {
    try {
      const { courseId } = req.params;
      const { moduleId, lessons } = req.body;

      if (!courseId) {
        res.status(400).json({
          success: false,
          message: "Course ID is required",
        });
        return;
      }

      if (!moduleId) {
        res.status(400).json({
          success: false,
          message: "Module ID is required",
        });
        return;
      }

      if (!Array.isArray(lessons) || lessons.length === 0) {
        res.status(400).json({
          success: false,
          message: "Lessons array is required and cannot be empty",
        });
        return;
      }

      // Add lessons to the module
      const result = await this.courseService.addLessonsToModule(
        courseId,
        moduleId,
        lessons
      );

      res.status(200).json({
        success: true,
        message: "Lessons added successfully",
        data: {
          lessonIds: result.lessonIds,
          addedCount: result.addedCount,
        },
      });
    } catch (error: any) {
      console.error("Error in addCourseLessons controller:", error);

      if (error.message.includes("Course not found")) {
        res.status(404).json({
          success: false,
          message: "Course not found",
        });
        return;
      }

      if (error.message.includes("Module not found")) {
        res.status(404).json({
          success: false,
          message: "Module not found",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Internal server error while adding lessons",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Something went wrong",
      });
    }
  };

  /**
   * Finalize chunked course creation
   * @param req - Express request object
   * @param res - Express response object
   */
  finalizeCourseCreation = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { courseId } = req.params;

      if (!courseId) {
        res.status(400).json({
          success: false,
          message: "Course ID is required",
        });
        return;
      }

      // Finalize the course creation
      const finalizedCourse = await this.courseService.finalizeCourseCreation(
        courseId
      );

      res.status(200).json({
        success: true,
        message: "Course creation finalized successfully",
        data: {
          course: finalizedCourse,
        },
      });
    } catch (error: any) {
      console.error("Error in finalizeCourseCreation controller:", error);

      if (error.message.includes("Course not found")) {
        res.status(404).json({
          success: false,
          message: "Course not found",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Internal server error while finalizing course creation",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Something went wrong",
      });
    }
  };

  /**
   * Get job status for async operations
   * @param req - Express request object
   * @param res - Express response object
   */
  getJobStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { jobId } = req.params;

      if (!jobId) {
        res.status(400).json({
          success: false,
          message: "Job ID is required",
        });
        return;
      }

      const jobStatus = this.jobService.getJobStatus(jobId);

      if (!jobStatus) {
        res.status(404).json({
          success: false,
          message: "Job not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Job status retrieved successfully",
        data: jobStatus,
      });
    } catch (error: any) {
      console.error("Error in getJobStatus controller:", error);

      res.status(500).json({
        success: false,
        message: "Internal server error while retrieving job status",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Something went wrong",
      });
    }
  };

  /**
   * Cancel a running job
   * @param req - Express request object
   * @param res - Express response object
   */
  cancelJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const { jobId } = req.params;

      if (!jobId) {
        res.status(400).json({
          success: false,
          message: "Job ID is required",
        });
        return;
      }

      const cancelled = this.jobService.cancelJob(jobId);

      if (!cancelled) {
        res.status(404).json({
          success: false,
          message: "Job not found or cannot be cancelled",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Job cancelled successfully",
      });
    } catch (error: any) {
      console.error("Error in cancelJob controller:", error);

      res.status(500).json({
        success: false,
        message: "Internal server error while cancelling job",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Something went wrong",
      });
    }
  };
}
