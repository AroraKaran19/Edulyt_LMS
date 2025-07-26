import { Request, Response } from 'express';
import { CourseService } from '../services/course.service';
import { Course, CourseModule, CourseLesson, Content, Discount, Plan } from '../types/course';

export class AdminController {
  private courseService: CourseService;

  constructor() {
    this.courseService = new CourseService();
  }

  /**
   * Add a new course to the database (Admin only)
   * @param req - Express request object
   * @param res - Express response object
   */
  addCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const frontendData = req.body;

      // Validate required fields
      if (!frontendData.basicInfo?.courseTitle || !frontendData.basicInfo?.courseDescription) {
        res.status(400).json({
          success: false,
          message: 'Course title and description are required'
        });
        return;
      }

      // Transform frontend data to course schema format
      const courseData: Partial<Course> = this.transformFrontendDataToCourse(frontendData);

      // Validate transformed data
      if (!courseData.title || !courseData.description || !courseData.category) {
        res.status(400).json({
          success: false,
          message: 'Missing required course data after transformation'
        });
        return;
      }

      // Create the course
      const createdCourse = await this.courseService.createCourse(courseData);

      // Return success response
      res.status(201).json({
        success: true,
        message: 'Course added successfully',
        data: {
          course: createdCourse,
          courseId: createdCourse._id,
          slug: createdCourse.slug
        }
      });

    } catch (error: any) {
      console.error('Error in addCourse admin controller:', error);

      // Handle MongoDB duplicate key errors (E11000)
      if (error.code === 11000) {
        // Extract field name from error message for better user experience
        let field = 'data';
        if (error.message.includes('slug')) {
          field = 'course slug';
        }
        
        res.status(409).json({
          success: false,
          message: `A course with this ${field} already exists`
        });
        return;
      }

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err: any) => err.message);
        res.status(400).json({
          success: false,
          message: 'Invalid course data',
          errors: validationErrors
        });
        return;
      }

      // Generic error response
      res.status(500).json({
        success: false,
        message: 'Internal server error while adding course',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  };

  /**
   * Transform frontend data format to course schema format
   * @param frontendData - Data from frontend
   * @returns Partial<Course> - Transformed course data
   */
  private transformFrontendDataToCourse(frontendData: any): Partial<Course> {


    // Generate slug from course title
    const generateSlug = (title: string): string => {
      return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with single
    };

    // Transform materials array format
    const transformMaterials = (materials: any[]): string[] => {
      return materials?.map(material => material.name || material) || [];
    };

    // Transform lessons with proper structure
    const transformLessons = (lessons: any[]): CourseLesson[] => {
      return lessons?.map((lesson) => ({
        title: lesson.title || '',
        description: lesson.description || '',
        content: [], // Will need to be populated with LessonContent
        isCompleted: lesson.completed || false,
        isLocked: lesson.isForCollegeStudent || false,
        createdAt: new Date(),
        updatedAt: new Date()
      })) || [];
    };

    // Transform modules with proper CourseModule structure
    const transformModules = (modules: any[]): CourseModule[] => {
      return modules?.map((module) => ({
        title: module.title || '',
        thumbnailUrl: module.thumbnailUrl,
        description: module.description || '',
        lessons: transformLessons(module.lessons || []),
        isCompleted: false,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })) || [];
    };

    // Parse features and tags
    const parseFeatures = (features: string): string[] => {
      if (!features) return [];
      return features.split(',').map(f => f.trim()).filter(f => f.length > 0);
    };

    // Parse whatYoullLearn as a single string (not array)
    const parseWhatYoullLearn = (learningText: string): string => {
      if (!learningText) return '';
      return learningText.trim();
    };

    // Transform pricing to proper Plan structure
    const transformPlans = (pricingData: any) => {
      const plans: { elite?: Plan, essential?: Plan } = {};
      
      if (pricingData?.professionals?.elite) {
        plans.elite = {
          title: 'Elite Plan',
          type: 'elite' as const,
          price: pricingData.professionals.elite.price || 0,
          features: pricingData.professionals.elite.features?.map((feature: any, index: number) => ({
            title: typeof feature === 'string' ? feature : feature.title || '',
            provided: true
          })) || [],
          billingPeriod: 'lifetime' as const,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      if (pricingData?.professionals?.essential) {
        plans.essential = {
          title: 'Essential Plan',
          type: 'essential' as const,
          price: pricingData.professionals.essential.price || 0,
          features: pricingData.professionals.essential.features?.map((feature: any, index: number) => ({
            title: typeof feature === 'string' ? feature : feature.title || '',
            provided: true
          })) || [],
          billingPeriod: 'lifetime' as const,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      return plans;
    };

    // Create proper discount structure from frontend data
    const createDiscount = (): Discount => {
      const discountData = frontendData.discount;
      
      // If frontend sends discount as object, use it
      if (discountData && typeof discountData === 'object') {
        return {
          discount: discountData.discount || "percentage",
          value: Number(discountData.value) || 0,
          startDate: discountData.startDate ? new Date(discountData.startDate) : undefined,
          endDate: discountData.endDate ? new Date(discountData.endDate) : undefined,
          isActive: Boolean(discountData.isActive) || false
        };
      }
      
      // Default discount structure
      return {
        discount: "percentage",
        value: 0,
        isActive: false
      };
    };

    const courseTitle = frontendData.basicInfo?.courseTitle || '';
    const slug = generateSlug(courseTitle);

    return {
      title: courseTitle,
      description: frontendData.basicInfo?.courseDescription || '',
      shortDescription: frontendData.basicInfo?.shortDescription,
      category: frontendData.courseDetails?.category || '',
      subcategory: frontendData.courseDetails?.subcategory,
      thumbnail: frontendData.media?.courseThumbnailUrl || '',
      previewVideoUrl: frontendData.media?.promotionalVideoUrl || '',
      slug: slug,
      
      // Course details
      duration: frontendData.courseDetails?.courseDuration || '1 month',
      skillLevel: frontendData.courseDetails?.skillLevel || 'Beginner',
      totalLectures: parseInt(frontendData.courseDetails?.totalLectures) || 0,
      
      // Learning info - whatYouWillLearn should be a string, not array
      whatYouWillLearn: parseWhatYoullLearn(frontendData.learningOutcomes?.whatYoullLearn || ''),
      whoShouldJoin: frontendData.learningOutcomes?.targetAudience || '',
      prerequisites: frontendData.learningOutcomes?.prerequisites ? 
        frontendData.learningOutcomes.prerequisites.split(',').map((p: string) => p.trim()) : [],
      
      // Required arrays with proper structure
      skills: parseFeatures(frontendData.courseFeatures?.keyFeatures || ''),
      keyFeatures: parseFeatures(frontendData.courseFeatures?.keyFeatures || '').map((feature, index) => ({
        title: feature,
        description: feature
      })),
      careerPaths: parseFeatures(frontendData.courseFeatures?.careerPaths || ''),
      features: parseFeatures(frontendData.courseFeatures?.keyFeatures || ''),
      tags: parseFeatures(frontendData.courseFeatures?.courseTags || ''),
      
      // Pricing with proper Plan structure
      plans: transformPlans(frontendData.pricing) as { elite?: Plan, essential?: Plan },
      
      // Settings
      isActive: true,
      isFeatured: frontendData.settings?.courseStatus?.featuredCourse || false,
      isCertified: frontendData.settings?.courseStatus?.certifiedCourse || false,
      
      // SEO
      metaTitle: frontendData.seoSettings?.metaTitle,
      metaDescription: frontendData.seoSettings?.metaDescription,
      keywords: [
        ...(frontendData.seoSettings?.focusKeywords ? 
          frontendData.seoSettings.focusKeywords.split(',').map((k: string) => k.trim()) : []),
        ...(frontendData.seoSettings?.secondaryKeywords ? 
          frontendData.seoSettings.secondaryKeywords.split(',').map((k: string) => k.trim()) : [])
      ],
      
      // Administrative
      createdBy: frontendData.settings?.administrativeDetails?.courseCreator || 'admin',
      enrolledCount: 0,
      totalRatings: 0,
      audience: 'professionals', // Default value, should be determined by logic
      
      // Content with proper CourseModule structure
      modules: transformModules(frontendData.courseModules || []),
      
      // Required empty arrays
      instructor: [], // This should be populated separately
      reviews: [],
      featuredReviews: [],
      faqs: [],
      
      // Proper discount structure - only set if there's actual discount data
      ...(frontendData.discount && typeof frontendData.discount === 'object' && frontendData.discount.value > 0 
          ? { discount: createDiscount() } 
          : {}),
      
      // Scholarship
      scholarship: false,
      
      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get all courses for admin (including inactive ones)
   * @param req - Express request object
   * @param res - Express response object
   */
  getAllCoursesAdmin = async (req: Request, res: Response): Promise<void> => {
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

      // Get courses with pagination (admin version - includes inactive courses)
      const result = await this.courseService.getAllCoursesAdmin(page, limit, filters, search);

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
      console.error('Error in getAllCoursesAdmin controller:', error);
      
      // Generic error response
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching courses',
        error: process.env.NODE_ENV === 'development' ? error : 'Something went wrong'
      });
    }
  };

  /**
   * Get a specific course by ID for admin view (including inactive courses)
   * @param req - Express request object
   * @param res - Express response object
   */
  getCourseByIdAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
      const { courseId } = req.params;

      // Validate course ID
      if (!courseId?.trim()) {
        res.status(400).json({
          success: false,
          message: 'Course ID is required'
        });
        return;
      }

      // Get course by ID (admin version - includes inactive courses)
      const course = await this.courseService.getCourseById(courseId);

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
        data: course // Return course directly instead of wrapping it
      });

    } catch (error) {
      console.error('Error in getCourseByIdAdmin controller:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('Invalid ObjectId')) {
          res.status(400).json({
            success: false,
            message: 'Invalid course ID format'
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

  /**
   * Update a course by ID (Admin only)
   * @param req - Express request object
   * @param res - Express response object
   */
  updateCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const { courseId } = req.params;
      const frontendData = req.body;

      // Validate course ID
      if (!courseId?.trim()) {
        res.status(400).json({
          success: false,
          message: 'Course ID is required'
        });
        return;
      }

      // Validate request body
      if (!frontendData || Object.keys(frontendData).length === 0) {
        res.status(400).json({
          success: false,
          message: 'Course data is required'
        });
        return;
      }

      // Transform frontend data to course schema format (same as in addCourse)
      const courseData: Partial<Course> = this.transformFrontendDataToCourse(frontendData);

      // Update the course using the service
      const updatedCourse = await this.courseService.updateCourse(courseId, courseData);

      if (!updatedCourse) {
        res.status(404).json({
          success: false,
          message: 'Course not found'
        });
        return;
      }

      // Return success response
      res.status(200).json({
        success: true,
        message: 'Course updated successfully',
        data: {
          course: updatedCourse,
          courseId: updatedCourse._id,
          slug: updatedCourse.slug
        }
      });

    } catch (error) {
      console.error('Error in updateCourse admin controller:', error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('validation')) {
          res.status(400).json({
            success: false,
            message: 'Invalid course data',
            error: error.message
          });
          return;
        }

        if (error.message.includes('Invalid ObjectId')) {
          res.status(400).json({
            success: false,
            message: 'Invalid course ID format'
          });
          return;
        }
      }

      // Generic error response
      res.status(500).json({
        success: false,
        message: 'Internal server error while updating course',
        error: process.env.NODE_ENV === 'development' ? error : 'Something went wrong'
      });
    }
  };

  /**
   * Delete course by ID (Admin only)
   * @param req - Express request object
   * @param res - Express response object
   */
  deleteCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const { courseId } = req.params;

      // Validate course ID
      if (!courseId?.trim()) {
        res.status(400).json({
          success: false,
          message: 'Course ID is required'
        });
        return;
      }

      // First, get the course to retrieve associated files for cleanup
      const course = await this.courseService.getCourseById(courseId);
      
      if (!course) {
        res.status(404).json({
          success: false,
          message: 'Course not found'
        });
        return;
      }

      // Delete the course from database
      const deleteResult = await this.courseService.deleteCourse(courseId);

      if (!deleteResult) {
        res.status(500).json({
          success: false,
          message: 'Failed to delete course from database'
        });
        return;
      }

      // TODO: Implement AWS S3 file cleanup for course assets
      // This should be done asynchronously to avoid blocking the response
      this.cleanupCourseAssets(course).catch(error => {
        console.error('Error cleaning up course assets:', error);
        // Log error but don't fail the request since course is already deleted
      });

      // Return success response
      res.status(200).json({
        success: true,
        message: 'Course deleted successfully',
        data: { courseId }
      });

    } catch (error) {
      console.error('Error in deleteCourse admin controller:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('Invalid ObjectId')) {
          res.status(400).json({
            success: false,
            message: 'Invalid course ID format'
          });
          return;
        }
      }
      
      // Generic error response
      res.status(500).json({
        success: false,
        message: 'Internal server error while deleting course',
        error: process.env.NODE_ENV === 'development' ? error : 'Something went wrong'
      });
    }
  };

  /**
   * Cleanup AWS S3 assets associated with a course
   * @param course - Course object with asset URLs
   */
  private async cleanupCourseAssets(course: any): Promise<void> {
    try {
      const s3Service = new (await import('../services/s3.service')).S3Service();
      const assetsToDelete: string[] = [];

      // Extract S3 key from URL helper function
      const extractS3Key = (url: string): string | null => {
        if (!url) return null;
        
        // Handle different S3 URL formats
        const s3UrlPattern = /https:\/\/.*\.s3\..*\.amazonaws\.com\/(.+)/;
        const match = url.match(s3UrlPattern);
        
        if (match) {
          return decodeURIComponent(match[1]);
        }
        
        // If it's already a key (not a full URL), return as is
        if (!url.startsWith('http')) {
          return url;
        }
        
        return null;
      };

      // Add course thumbnail
      if (course.thumbnail) {
        const thumbnailKey = extractS3Key(course.thumbnail);
        if (thumbnailKey) assetsToDelete.push(thumbnailKey);
      }

      // Add preview video
      if (course.previewVideoUrl) {
        const videoKey = extractS3Key(course.previewVideoUrl);
        if (videoKey) assetsToDelete.push(videoKey);
      }

      // Add module lesson videos
      if (course.modules && Array.isArray(course.modules)) {
        course.modules.forEach((module: any) => {
          if (module.lessons && Array.isArray(module.lessons)) {
            module.lessons.forEach((lesson: any) => {
              if (lesson.videoUrl) {
                const lessonVideoKey = extractS3Key(lesson.videoUrl);
                if (lessonVideoKey) assetsToDelete.push(lessonVideoKey);
              }
            });
          }
        });
      }

      // Delete all assets in parallel
      if (assetsToDelete.length > 0) {
        console.log(`Cleaning up ${assetsToDelete.length} assets for course ${course._id}`);
        
        const deletePromises = assetsToDelete.map(async (key) => {
          try {
            await s3Service.deleteFile(key);
            console.log(`✅ Deleted asset: ${key}`);
          } catch (error) {
            console.error(`❌ Failed to delete asset ${key}:`, error);
            // Continue with other deletions even if one fails
          }
        });

        await Promise.allSettled(deletePromises);
        console.log(`✅ Completed cleanup for course ${course._id}`);
      } else {
        console.log(`No assets to clean up for course ${course._id}`);
      }

    } catch (error) {
      console.error('Error in cleanupCourseAssets:', error);
      throw error;
    }
  }

  /**
   * Update course status (activate/deactivate)
   * @param req - Express request object
   * @param res - Express response object
   */
  updateCourseStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { courseId } = req.params;
      const { isActive } = req.body;

      // Validate parameters
      if (!courseId?.trim()) {
        res.status(400).json({
          success: false,
          message: 'Course ID is required'
        });
        return;
      }

      if (typeof isActive !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'isActive must be a boolean value'
        });
        return;
      }

      // Update course status
      const updatedCourse = await this.courseService.updateCourseStatus(courseId, isActive);

      if (!updatedCourse) {
        res.status(404).json({
          success: false,
          message: 'Course not found'
        });
        return;
      }

      // Return success response
      res.status(200).json({
        success: true,
        message: `Course ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: {
          course: updatedCourse
        }
      });

    } catch (error) {
      console.error('Error in updateCourseStatus admin controller:', error);
      
      // Generic error response
      res.status(500).json({
        success: false,
        message: 'Internal server error while updating course status',
        error: process.env.NODE_ENV === 'development' ? error : 'Something went wrong'
      });
    }
  };

  /**
   * Debug endpoint to check all courses in database (regardless of status)
   * @param req - Express request object
   * @param res - Express response object
   */
  debugAllCourses = async (req: Request, res: Response): Promise<void> => {
    try {
      // Get ALL courses from database without any filters
      const allCourses = await this.courseService.debugGetAllCourses();

      // Return all courses with their status
      res.status(200).json({
        success: true,
        message: 'All courses in database (debug)',
        data: {
          totalCourses: allCourses.length,
          courses: allCourses.map((course: any) => ({
            id: course._id,
            title: course.title,
            slug: course.slug,
            isActive: course.isActive,
            isFeatured: course.isFeatured,
            category: course.category,
            createdAt: course.createdAt
          }))
        }
      });

    } catch (error) {
      console.error('Error in debugAllCourses:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching debug courses',
        error: process.env.NODE_ENV === 'development' ? error : 'Something went wrong'
      });
    }
  };
} 