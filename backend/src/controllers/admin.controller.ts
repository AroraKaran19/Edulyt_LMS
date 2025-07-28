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

         // Check if data is in the new direct Course format or old nested format
     const isDirectFormat = frontendData.title !== undefined;
     
     const courseTitle = isDirectFormat ? frontendData.title : (frontendData.basicInfo?.courseTitle || '');
     const slug = courseTitle ? generateSlug(courseTitle) : undefined;

         const transformedData: Partial<Course> = {};
     
     // Handle both direct Course format and legacy nested format
     if (isDirectFormat) {
       // New direct format - data is already in Course schema format, just pass it through
       // Remove any fields that shouldn't be updated (like _id, createdAt)
       const { _id, createdAt, ...courseFields } = frontendData;
       Object.assign(transformedData, courseFields);
       
       // Ensure slug is generated from title if needed
       if (transformedData.title && !transformedData.slug) {
         transformedData.slug = generateSlug(transformedData.title as string);
       }
     } else {
       // Legacy nested format
       if (courseTitle && courseTitle.trim()) transformedData.title = courseTitle.trim();
       if (frontendData.basicInfo?.courseDescription && frontendData.basicInfo.courseDescription.trim()) {
         transformedData.description = frontendData.basicInfo.courseDescription.trim();
       }
       if (frontendData.basicInfo?.shortDescription && frontendData.basicInfo.shortDescription.trim()) {
         transformedData.shortDescription = frontendData.basicInfo.shortDescription.trim();
       }
       if (frontendData.courseDetails?.category && frontendData.courseDetails.category.trim()) {
         transformedData.category = frontendData.courseDetails.category.trim();
       }
       if (frontendData.courseDetails?.subcategory && frontendData.courseDetails.subcategory.trim()) {
         transformedData.subcategory = frontendData.courseDetails.subcategory.trim();
       }
       if (frontendData.media?.courseThumbnailUrl && frontendData.media.courseThumbnailUrl.trim()) {
         transformedData.thumbnail = frontendData.media.courseThumbnailUrl.trim();
       }
       if (frontendData.media?.promotionalVideoUrl && frontendData.media.promotionalVideoUrl.trim()) {
         transformedData.previewVideoUrl = frontendData.media.promotionalVideoUrl.trim();
       }
     }
     
     // For legacy format only, handle the nested structure conversion
     if (!isDirectFormat) {
       // Legacy nested format
       if (frontendData.courseDetails?.courseDuration && frontendData.courseDetails.courseDuration.trim()) {
         transformedData.duration = frontendData.courseDetails.courseDuration.trim();
       }
       if (frontendData.courseDetails?.skillLevel && frontendData.courseDetails.skillLevel.trim()) {
         transformedData.skillLevel = frontendData.courseDetails.skillLevel.trim();
       }
       if (frontendData.courseDetails?.totalLectures) transformedData.totalLectures = parseInt(frontendData.courseDetails.totalLectures) || 0;
        
       // Learning info - legacy format
       if (frontendData.learningOutcomes?.whatYoullLearn && frontendData.learningOutcomes.whatYoullLearn.trim()) {
         transformedData.whatYouWillLearn = parseWhatYoullLearn(frontendData.learningOutcomes.whatYoullLearn);
       }
       if (frontendData.learningOutcomes?.targetAudience && frontendData.learningOutcomes.targetAudience.trim()) {
         transformedData.whoShouldJoin = frontendData.learningOutcomes.targetAudience.trim();
       }
       if (frontendData.learningOutcomes?.prerequisites) {
         transformedData.prerequisites = frontendData.learningOutcomes.prerequisites.split(',').map((p: string) => p.trim());
       }
       
       // Course features (legacy format)
       if (frontendData.courseFeatures?.keyFeatures) {
         transformedData.skills = parseFeatures(frontendData.courseFeatures.keyFeatures);
         transformedData.keyFeatures = parseFeatures(frontendData.courseFeatures.keyFeatures).map((feature) => ({
           title: feature,
           description: feature
         }));
         transformedData.features = parseFeatures(frontendData.courseFeatures.keyFeatures);
       }
       if (frontendData.courseFeatures?.careerPaths) {
         transformedData.careerPaths = parseFeatures(frontendData.courseFeatures.careerPaths);
       }
       if (frontendData.courseFeatures?.courseTags) {
         transformedData.tags = parseFeatures(frontendData.courseFeatures.courseTags);
       }
       
       // Pricing (legacy format)
       if (frontendData.pricing) {
         transformedData.plans = transformPlans(frontendData.pricing) as { elite?: Plan, essential?: Plan };
       }
       
       // Settings (legacy format)
       if (frontendData.settings?.courseStatus?.featuredCourse !== undefined) {
         transformedData.isFeatured = frontendData.settings.courseStatus.featuredCourse;
       }
       if (frontendData.settings?.courseStatus?.certifiedCourse !== undefined) {
         transformedData.isCertified = frontendData.settings.courseStatus.certifiedCourse;
       }
       
       // SEO (legacy format)
       if (frontendData.seoSettings?.metaTitle) transformedData.metaTitle = frontendData.seoSettings.metaTitle;
       if (frontendData.seoSettings?.metaDescription) transformedData.metaDescription = frontendData.seoSettings.metaDescription;
       if (frontendData.seoSettings?.focusKeywords || frontendData.seoSettings?.secondaryKeywords) {
         transformedData.keywords = [
           ...(frontendData.seoSettings?.focusKeywords ? 
             frontendData.seoSettings.focusKeywords.split(',').map((k: string) => k.trim()) : []),
           ...(frontendData.seoSettings?.secondaryKeywords ? 
             frontendData.seoSettings.secondaryKeywords.split(',').map((k: string) => k.trim()) : [])
         ];
       }
       
       // Administrative (legacy format)
       if (frontendData.settings?.administrativeDetails?.courseCreator) {
         transformedData.createdBy = frontendData.settings.administrativeDetails.courseCreator;
       }
       
       // Content modules (legacy format)
       if (frontendData.courseModules) {
         transformedData.modules = transformModules(frontendData.courseModules);
       }
       
       // Discount (legacy format)
       if (frontendData.discount && typeof frontendData.discount === 'object' && frontendData.discount.value > 0) {
         transformedData.discount = createDiscount();
       }
     }
     
     // Always update the timestamp
     transformedData.updatedAt = new Date();
     
     return transformedData;
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
      console.log('🔄 Admin updateCourse called');
      console.log('Method:', req.method);
      console.log('Params:', req.params);
      console.log('Body keys:', Object.keys(req.body));

      const { courseId } = req.params;
      const frontendData = req.body;

      // Validate course ID
      if (!courseId?.trim()) {
        console.log('❌ Course ID validation failed');
        res.status(400).json({
          success: false,
          message: 'Course ID is required'
        });
        return;
      }

      // Validate request body
      if (!frontendData || Object.keys(frontendData).length === 0) {
        console.log('❌ Request body validation failed');
        res.status(400).json({
          success: false,
          message: 'Course data is required'
        });
        return;
      }

             // Transform frontend data to course schema format (same as in addCourse)
       let courseData: Partial<Course>;
       try {
         courseData = this.transformFrontendDataToCourse(frontendData);
         console.log('✅ Data transformation successful');
       } catch (transformError) {
         console.error('❌ Data transformation failed:', transformError);
         res.status(400).json({
           success: false,
           message: 'Failed to transform course data',
           error: process.env.NODE_ENV === 'development' ? (transformError instanceof Error ? transformError.message : transformError) : 'Invalid data format'
         });
         return;
       }

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
        data: updatedCourse // Return course directly for consistency with getCourseById
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
         error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : error) : 'Something went wrong'
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

      // Cleanup AWS S3 assets asynchronously to avoid blocking the response
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
      const { S3Service } = await import('../services/s3.service');
      const s3Service = new S3Service();

      console.log(`🧹 Starting cleanup for course: ${course.title || course._id}`);

      // Try both cleanup methods for maximum coverage
      const results = await Promise.allSettled([
        // Method 1: Clean up by individual asset URLs (works with both old and new structure)
        s3Service.cleanupCourseAssets(course),
        // Method 2: Clean up entire course folder (works with new folder structure)
        course.title ? s3Service.deleteCourseFolder(course.title) : Promise.resolve({ totalDeleted: 0, successful: [], failed: [] })
      ]);

      // Process results
      const assetCleanup = results[0].status === 'fulfilled' ? results[0].value : null;
      const folderCleanup = results[1].status === 'fulfilled' ? results[1].value : null;

      // Log results
      if (assetCleanup) {
        console.log(`📊 Asset cleanup: ${assetCleanup.successful.length}/${assetCleanup.totalAssets} files deleted`);
        if (assetCleanup.failed.length > 0) {
          console.warn(`⚠️ Failed to delete ${assetCleanup.failed.length} assets:`, assetCleanup.failed);
        }
      }

      if (folderCleanup && folderCleanup.totalDeleted > 0) {
        console.log(`📁 Folder cleanup: ${folderCleanup.totalDeleted} files deleted from course folder`);
        if (folderCleanup.failed.length > 0) {
          console.warn(`⚠️ Failed to delete ${folderCleanup.failed.length} folder files:`, folderCleanup.failed);
        }
      }

      // Calculate total cleanup
      const totalDeleted = (assetCleanup?.successful.length || 0) + (folderCleanup?.totalDeleted || 0);
      const totalFailed = (assetCleanup?.failed.length || 0) + (folderCleanup?.failed.length || 0);

      if (totalDeleted > 0) {
        console.log(`✅ Course cleanup completed: ${totalDeleted} files deleted, ${totalFailed} failed`);
      } else {
        console.log(`📭 No assets found to clean up for course: ${course.title || course._id}`);
      }

      // Log any errors from failed promises
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const method = index === 0 ? 'asset cleanup' : 'folder cleanup';
          console.error(`❌ ${method} failed:`, result.reason);
        }
      });

    } catch (error) {
      console.error('❌ Critical error in cleanupCourseAssets:', error);
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

  /**
   * Manually cleanup S3 assets for a specific course (Admin utility)
   * @param req - Express request object
   * @param res - Express response object
   */
  cleanupCourseS3Assets = async (req: Request, res: Response): Promise<void> => {
    try {
      const { courseId } = req.params;

      if (!courseId?.trim()) {
        res.status(400).json({
          success: false,
          message: 'Course ID is required'
        });
        return;
      }

      // Get the course
      const course = await this.courseService.getCourseById(courseId);
      
      if (!course) {
        res.status(404).json({
          success: false,
          message: 'Course not found'
        });
        return;
      }

      // Perform cleanup
      const { S3Service } = await import('../services/s3.service');
      const s3Service = new S3Service();

      const [assetCleanup, folderCleanup] = await Promise.allSettled([
        s3Service.cleanupCourseAssets(course),
        course.title ? s3Service.deleteCourseFolder(course.title) : Promise.resolve({ totalDeleted: 0, successful: [], failed: [] })
      ]);

      // Process results
      const assetResult = assetCleanup.status === 'fulfilled' ? assetCleanup.value : null;
      const folderResult = folderCleanup.status === 'fulfilled' ? folderCleanup.value : null;

      const totalDeleted = (assetResult?.successful.length || 0) + (folderResult?.totalDeleted || 0);
      const totalFailed = (assetResult?.failed.length || 0) + (folderResult?.failed.length || 0);

      res.status(200).json({
        success: true,
        message: 'S3 cleanup completed',
        data: {
          courseId,
          courseTitle: course.title,
          summary: {
            totalDeleted,
            totalFailed
          },
          assetCleanup: assetResult ? {
            totalAssets: assetResult.totalAssets,
            successful: assetResult.successful.length,
            failed: assetResult.failed.length,
            failedFiles: assetResult.failed
          } : null,
          folderCleanup: folderResult ? {
            totalDeleted: folderResult.totalDeleted,
            successful: folderResult.successful.length,
            failed: folderResult.failed.length,
            failedFiles: folderResult.failed
          } : null
        }
      });

    } catch (error) {
      console.error('Error in cleanupCourseS3Assets:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while cleaning up S3 assets',
        error: process.env.NODE_ENV === 'development' ? error : 'Something went wrong'
      });
    }
  };
} 