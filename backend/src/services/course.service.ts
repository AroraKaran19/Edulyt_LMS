import { Course } from '../types/course';
import { CourseModel } from '../models';
import { v4 as uuidv4 } from 'uuid';

export class CourseService {
  /**
   * Create a new course
   * @param courseData - Course data to create
   * @returns Promise<Course> - Created course
   */
  async createCourse(courseData: Partial<Course>): Promise<Course> {
    try {
      // Generate unique ID and slug if not provided
      const courseId = courseData.id || uuidv4();
      const slug = courseData.slug || this.generateSlug(courseData.title || '');
      
      // Set default values
      const courseToCreate: Partial<Course> = {
        ...courseData,
        id: courseId,
        slug,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: courseData.isActive !== undefined ? courseData.isActive : true,
        enrolledCount: 0,
        totalRatings: 0,
        totalLectures: this.calculateTotalLectures(courseData.modules || []),
        // Set default instructor if not provided
        instructor: courseData.instructor || [],
        // Set default values for required fields
        isCertified: courseData.isCertified !== undefined ? courseData.isCertified : false,
        language: courseData.language || 'English',
        skillLevel: courseData.skillLevel || 'Beginner',
        lastUpdated: new Date(),
        modules: courseData.modules || [],
        whatYouWillLearn: courseData.whatYouWillLearn || [],
        whoShouldJoin: courseData.whoShouldJoin || '',
        featuredReviews: courseData.featuredReviews || [],
        features: courseData.features || [],
        faqs: courseData.faqs || [],
        plan: courseData.plan || {
          professionals: { price: 0, features: [] },
          collegeStudents: { price: 0, features: [] }
        }
      };

      // Create the course
      const course = new CourseModel(courseToCreate);
      const savedCourse = await course.save();
      
      return savedCourse.toObject();
    } catch (error) {
      console.error('Error creating course:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create course: ${error.message}`);
      }
      throw new Error('Failed to create course');
    }
  }

  /**
   * Generate a slug from title
   * @param title - Course title
   * @returns string - Generated slug
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single
  }

  /**
   * Calculate total lectures from modules
   * @param modules - Course modules
   * @returns number - Total lectures count
   */
  private calculateTotalLectures(modules: any[]): number {
    return modules.reduce((total, module) => {
      return total + (module.lessons?.length || 0);
    }, 0);
  }

  /**
   * Get all featured courses
   * @returns Promise<Course[]> - Array of featured courses
   */
  async getFeaturedCourses(): Promise<Course[]> {
    try {
      const featuredCourses = await CourseModel.find({ 
        isFeatured: true, 
        isActive: true 
      })
      .select('-__v') // Exclude version field
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean(); // Return plain JavaScript objects instead of Mongoose documents

      return featuredCourses;
    } catch (error) {
      console.error('Error fetching featured courses:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch featured courses: ${error.message}`);
      }
      throw new Error('Failed to fetch featured courses');
    }
  }

  /**
   * Get all courses with pagination
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10)
   * @param category - Filter by categories (comma-separated string like "1,2,3" or single category)
   * @param search - Search term for title or description (optional)
   * @returns Promise<{courses: Course[], total: number, page: number, totalPages: number}>
   */
  async getAllCourses(
    page: number = 1, 
    limit: number = 10, 
    category?: string, 
    search?: string
  ): Promise<{
    courses: Course[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      // Build query object
      const query: any = { isActive: true };

      // Add category filter if provided
      if (category && category.trim()) {
        // Split comma-separated categories and trim whitespace
        const categories = category.split(',').map(cat => cat.trim()).filter(cat => cat);
        
        if (categories.length > 0) {
          if (categories.length === 1) {
            // Single category - use regex for case-insensitive matching
            query.category = { $regex: categories[0], $options: 'i' };
          } else {
            // Multiple categories - use $in with regex for each category
            query.category = { 
              $in: categories.map(cat => new RegExp(cat, 'i')) 
            };
          }
        }
      }

      // Add search filter if provided
      if (search && search.trim()) {
        const searchTerm = search.trim();
        query.$or = [
          { title: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { shortDescription: { $regex: searchTerm, $options: 'i' } }
        ];
      }

      // Calculate skip value for pagination
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const total = await CourseModel.countDocuments(query);

      // Get courses with pagination
      const courses = await CourseModel.find(query)
        .select('-__v') // Exclude version field
        .sort({ createdAt: -1 }) // Sort by newest first
        .skip(skip)
        .limit(limit)
        .lean(); // Return plain JavaScript objects instead of Mongoose documents

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      return {
        courses,
        total,
        page,
        totalPages
      };
    } catch (error) {
      console.error('Error fetching all courses:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch courses: ${error.message}`);
      }
      throw new Error('Failed to fetch courses');
    }
  }

  /**
   * Validate course data
   * @param courseData - Course data to validate
   * @returns boolean - Whether course data is valid
   */
  validateCourseData(courseData: Partial<Course>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields validation
    if (!courseData.title?.trim()) {
      errors.push('Course title is required');
    }

    if (!courseData.description?.trim()) {
      errors.push('Course description is required');
    }

    if (!courseData.category?.trim()) {
      errors.push('Course category is required');
    }

    if (!courseData.thumbnail?.trim()) {
      errors.push('Course thumbnail is required');
    }

    if (!courseData.previewVideoUrl?.trim()) {
      errors.push('Preview video URL is required');
    }

    if (!courseData.createdBy?.trim()) {
      errors.push('Created by field is required');
    }

    // Validate plan prices
    if (courseData.plan) {
      if (courseData.plan.professionals?.price < 0) {
        errors.push('Professional plan price must be 0 or greater');
      }
      if (courseData.plan.collegeStudents?.price < 0) {
        errors.push('College students plan price must be 0 or greater');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 