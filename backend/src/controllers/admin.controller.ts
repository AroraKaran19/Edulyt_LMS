import { Request, Response } from 'express';
import { CourseService } from '../services/course.service';
import { Course, CourseModule, CourseLesson, LessonContent, Discount } from '../types/course';

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

    } catch (error) {
      console.error('Error in addCourse admin controller:', error);

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

        if (error.message.includes('E11000')) {
          res.status(409).json({
            success: false,
            message: 'Course with this title or slug already exists',
            error: 'Duplicate course detected'
          });
          return;
        }
      }

      // Generic error response
      res.status(500).json({
        success: false,
        message: 'Internal server error while adding course',
        error: process.env.NODE_ENV === 'development' ? error : 'Something went wrong'
      });
    }
  };

  /**
   * Transform frontend data format to course schema format
   * @param frontendData - Data from frontend
   * @returns Partial<Course> - Transformed course data
   */
  private transformFrontendDataToCourse(frontendData: any): Partial<Course> {
    // Generate unique IDs
    const generateId = (): string => {
      return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    };

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
      return lessons?.map((lesson, index) => ({
        _id: lesson.id || generateId(),
        title: lesson.title || '',
        duration: lesson.duration || 0,
        description: lesson.description || '',
        content: [], // Will need to be populated with LessonContent
        order: index,
        isCompleted: lesson.completed || false,
        isLocked: lesson.isForCollegeStudent || false,
        createdAt: new Date(),
        updatedAt: new Date()
      })) || [];
    };

    // Transform modules with proper CourseModule structure
    const transformModules = (modules: any[]): CourseModule[] => {
      return modules?.map((module, index) => ({
        _id: module.id || generateId(),
        title: module.title || '',
        thumbnailUrl: module.thumbnailUrl,
        description: module.description || '',
        lessons: transformLessons(module.lessons || []),
        order: index,
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
      const plans: { elite?: any[], essential?: any[] } = {};
      
      if (pricingData?.professionals?.elite) {
        plans.elite = [{
          _id: generateId(),
          title: 'Elite Plan',
          type: 'elite' as const,
          price: pricingData.professionals.elite.price || 0,
          features: pricingData.professionals.elite.features?.map((feature: any, index: number) => ({
            title: typeof feature === 'string' ? feature : feature.title || '',
            provided: true,
            description: typeof feature === 'object' ? feature.description : '',
            order: index
          })) || [],
          billingPeriod: 'lifetime' as const,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }];
      }

      if (pricingData?.professionals?.essential) {
        plans.essential = [{
          _id: generateId(),
          title: 'Essential Plan',
          type: 'essential' as const,
          price: pricingData.professionals.essential.price || 0,
          features: pricingData.professionals.essential.features?.map((feature: any, index: number) => ({
            title: typeof feature === 'string' ? feature : feature.title || '',
            provided: true,
            description: typeof feature === 'object' ? feature.description : '',
            order: index
          })) || [],
          billingPeriod: 'lifetime' as const,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }];
      }

      return plans;
    };

    // Create proper discount structure
    const createDiscount = (): Discount | undefined => {
      return {
        discount: 'percentage',
        value: 0,
        isActive: false
      };
    };

    const courseTitle = frontendData.basicInfo?.courseTitle || '';
    const slug = generateSlug(courseTitle);
    const courseId = generateId();

    return {
      _id: courseId,
      title: courseTitle,
      subtitle: frontendData.basicInfo?.subtitle,
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
      plans: transformPlans(frontendData.pricing),
      
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
      
      // Proper discount structure
      discount: createDiscount(),
      
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