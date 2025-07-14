import { Request, Response } from 'express';
import { CourseService } from '../services/course.service';
import { Course } from '../types/course';

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

      // Transform frontend data to course schema format
      const courseData: Partial<Course> = this.transformFrontendDataToCourse(frontendData);

      // Create the course
      const createdCourse = await this.courseService.createCourse(courseData);

      // Return success response
      res.status(201).json({
        success: true,
        message: 'Course added successfully',
        data: {
          course: createdCourse
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

    // Transform lessons
    const transformLessons = (lessons: any[]) => {
      return lessons?.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        duration: lesson.duration,
        videoUrl: lesson.videoUrl,
        thumbnailUrl: lesson.thumbnailUrl,
        description: lesson.description || '',
        materials: transformMaterials(lesson.materials || []),
        completed: lesson.completed || false,
        isForCollegeStudent: lesson.isForCollegeStudent || false
      })) || [];
    };

    // Transform modules
    const transformModules = (modules: any[]) => {
      return modules?.map(module => ({
        id: module.id,
        title: module.title,
        thumbnailUrl: module.thumbnailUrl,
        duration: module.duration,
        description: module.description || '',
        lessons: transformLessons(module.lessons || [])
      })) || [];
    };

    // Parse features and tags
    const parseFeatures = (features: string): string[] => {
      if (!features) return [];
      return features.split(',').map(f => f.trim()).filter(f => f.length > 0);
    };

    // Parse whatYoullLearn
    const parseWhatYoullLearn = (learningText: string): string[] => {
      if (!learningText) return [];
      return learningText.split('\n').map(item => item.trim()).filter(item => item.length > 0);
    };

    const courseTitle = frontendData.basicInfo?.courseTitle || '';
    const slug = generateSlug(courseTitle);

    return {
      title: courseTitle,
      subtitle: frontendData.basicInfo?.subtitle,
      description: frontendData.basicInfo?.courseDescription,
      shortDescription: frontendData.basicInfo?.shortDescription,
      category: frontendData.courseDetails?.category,
      subcategory: frontendData.courseDetails?.subcategory,
      thumbnail: frontendData.media?.courseThumbnailUrl,
      previewVideoUrl: frontendData.media?.promotionalVideoUrl,
      slug: slug,
      
      // Course details
      language: frontendData.courseDetails?.language || 'English',
      skillLevel: frontendData.courseDetails?.skillLevel || 'Beginner',
      duration: frontendData.courseDetails?.courseDuration,
      totalLectures: parseInt(frontendData.courseDetails?.totalLectures) || 0,
      
      // Pricing
      plan: frontendData.pricing || {
        professionals: { 
          elite: { price: 0, features: [] },
          essential: { price: 0, features: [] }
        },
        collegeStudents: { 
          elite: { price: 0, features: [] },
          essential: { price: 0, features: [] }
        }
      },
      
      // Learning outcomes
      whoShouldJoin: frontendData.learningOutcomes?.targetAudience || '',
      prerequisites: frontendData.learningOutcomes?.prerequisites ? 
        frontendData.learningOutcomes.prerequisites.split(',').map((p: string) => p.trim()) : [],
      whatYouWillLearn: parseWhatYoullLearn(frontendData.learningOutcomes?.whatYoullLearn || ''),
      
      // Features and tags
      features: parseFeatures(frontendData.courseFeatures?.keyFeatures || ''),
      tags: parseFeatures(frontendData.courseFeatures?.courseTags || ''),
      
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
      
      // Content
      modules: transformModules(frontendData.courseModules || []),
      
      // Default empty arrays
      featuredReviews: [],
      faqs: [],
      instructor: [], // This should be populated separately
      
      // Additional fields
      discount: 0,
      scholarship: false
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
            id: course.id,
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