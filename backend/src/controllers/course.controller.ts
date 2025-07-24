import { Request, Response } from 'express';
import { CourseService } from '../services/course.service';
import { Course } from '../types/course';

export class CourseController {
  private courseService: CourseService;

  constructor() {
    this.courseService = new CourseService();
  }

  /**
   * Create a new course
   * @param req - Express request object
   * @param res - Express response object
   */
  createCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseData: Partial<Course> = req.body;

      console.log('📝 Received course creation request:', {
        title: courseData.title,
        category: courseData.category,
        language: courseData.language,
        audience: courseData.audience,
        createdBy: courseData.createdBy,
        hasPlans: !!courseData.plans,
        planTypes: courseData.plans ? Object.keys(courseData.plans) : [],
        dataKeys: Object.keys(courseData).slice(0, 10) // First 10 keys for debugging
      });

      // Validate course data
      const validation = this.courseService.validateCourseData(courseData);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
        return;
      }

      // Create the course
      const createdCourse = await this.courseService.createCourse(courseData);

      // Return success response
      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: {
          course: createdCourse
        }
      });

    } catch (error) {
      console.error('Error in createCourse controller:', error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('duplicate key')) {
          res.status(409).json({
            success: false,
            message: 'Course with this ID or slug already exists',
            error: error.message
          });
          return;
        }

        if (error.message.includes('validation')) {
          res.status(400).json({
            success: false,
            message: 'Invalid course data',
            error: error.message
          });
          return;
        }
      }

      // Generic error response
      res.status(500).json({
        success: false,
        message: 'Internal server error while creating course',
        error: process.env.NODE_ENV === 'development' ? error : 'Something went wrong'
      });
    }
  };

  /**
   * Get all featured courses
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
        message: 'Featured courses retrieved successfully',
        data: {
          courses: featuredCourses,
          total: featuredCourses.length
        }
      });

    } catch (error) {
      console.error('Error in getFeaturedCourses controller:', error);
      
      // Generic error response
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching featured courses',
        error: process.env.NODE_ENV === 'development' ? error : 'Something went wrong'
      });
    }
  };

  /**
   * Get all courses with pagination and filtering
   * @param req - Express request object
   * @param res - Express response object
   * @query page - Page number (default: 1)
   * @query limit - Items per page (default: 10, max: 100)
   * @query filter - Filter by categories (can be used multiple times: "?filter=web&filter=app&filter=ml")
   * @query search - Search term for title/description
   */
  getAllCourses = async (req: Request, res: Response): Promise<void> => {
    try {
      // Extract query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      
      // Handle multiple filter parameters
      let filters: string[] = [];
      if (req.query.filter) {
        if (Array.isArray(req.query.filter)) {
          filters = req.query.filter as string[];
        } else {
          filters = [req.query.filter as string];
        }
      }

      // Validate pagination parameters
      if (page < 1) {
        res.status(400).json({
          success: false,
          message: 'Page number must be greater than 0'
        });
        return;
      }

      if (limit < 1 || limit > 100) {
        res.status(400).json({
          success: false,
          message: 'Limit must be between 1 and 100'
        });
        return;
      }

      // Get courses with pagination
      const result = await this.courseService.getAllCourses(page, limit, filters, search);

      // Handle empty results case
      if (result.total === 0) {
        res.status(200).json({
          success: true,
          message: 'No courses found',
          data: {
            courses: [],
            total: 0
          }
        });
        return;
      }

      // Return success response with results
      res.status(200).json({
        success: true,
        message: 'Courses retrieved successfully',
        data: {
          courses: result.courses,
          pagination: {
            total: result.total,
            page: result.page,
            totalPages: result.totalPages,
            limit: limit,
            hasNext: result.page < result.totalPages,
            hasPrev: result.page > 1
          }
        }
      });

    } catch (error) {
      console.error('Error in getAllCourses controller:', error);
      
      // Generic error response
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching courses',
        error: process.env.NODE_ENV === 'development' ? error : 'Something went wrong'
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
          message: 'Course slug is required'
        });
        return;
      }

      // Get course by slug
      const course = await this.courseService.getCourseBySlug(slug);

      // Handle course not found
      if (!course) {
        res.status(404).json({
          success: false,
          message: 'Course not found'
        });
        return;
      }

      // Return success response
      res.status(200).json({
        success: true,
        message: 'Course retrieved successfully',
        data: {
          course
        }
      });

    } catch (error) {
      console.error('Error in getCourseBySlug controller:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('Course slug is required')) {
          res.status(400).json({
            success: false,
            message: 'Invalid course slug',
            error: error.message
          });
          return;
        }
      }

      // Generic error response
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching course',
        error: process.env.NODE_ENV === 'development' ? error : 'Something went wrong'
      });
    }
  };

} 