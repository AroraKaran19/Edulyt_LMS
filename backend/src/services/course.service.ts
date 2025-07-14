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
          professionals: { 
            elite: { price: 0, features: [] },
            essential: { price: 0, features: [] }
          },
          collegeStudents: { 
            elite: { price: 0, features: [] },
            essential: { price: 0, features: [] }
          }
        },
        discount: courseData.discount || 0,
        discountEndDate: courseData.discountEndDate,
        scholarship: courseData.scholarship || false,
        scholarshipDescription: courseData.scholarshipDescription,
        scholarshipLink: courseData.scholarshipLink
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
   * @param filters - Array of filters to apply (optional)
   * @param search - Search term for title or description (optional)
   * @returns Promise<{courses: Course[], total: number, page: number, totalPages: number}>
   */
  async getAllCourses(
    page: number = 1, 
    limit: number = 10, 
    filters?: string[], 
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

      // Add filters if provided
      if (filters && filters.length > 0) {
        query.category = { 
          $in: filters.map(filter => new RegExp(filter, 'i'))
        };
      }

      // Add search filter if provided
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      console.log('getAllCourses query:', JSON.stringify(query, null, 2));

      // Calculate skip value for pagination
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const total = await CourseModel.countDocuments(query);
      console.log('Total courses found:', total);

      // Get courses with pagination
      const courses = await CourseModel.find(query)
        .select('-__v') // Exclude version field
        .sort({ createdAt: -1 }) // Sort by newest first
        .skip(skip)
        .limit(limit)
        .lean(); // Return plain JavaScript objects instead of Mongoose documents

      console.log('Courses returned:', courses.length);

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
   * Get a course by slug
   * @param slug - Course slug
   * @returns Promise<Course | null> - Course data or null if not found
   */
  async getCourseBySlug(slug: string): Promise<Course | null> {
    try {
      if (!slug?.trim()) {
        throw new Error('Course slug is required');
      }

      const course = await CourseModel.findOne({ 
        slug: slug.trim(),
        isActive: true 
      })
      .select('-__v') // Exclude version field
      .lean(); // Return plain JavaScript object instead of Mongoose document

      return course;
    } catch (error) {
      console.error('Error fetching course by slug:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch course: ${error.message}`);
      }
      throw new Error('Failed to fetch course');
    }
  }

  /**
   * Get all courses with pagination (Admin version - includes inactive courses)
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10)
   * @param filters - Array of filters to apply (optional)
   * @param search - Search term for title or description (optional)
   * @returns Promise<{courses: Course[], total: number, page: number, totalPages: number}>
   */
  async getAllCoursesAdmin(
    page: number = 1, 
    limit: number = 10, 
    filters?: string[], 
    search?: string
  ): Promise<{
    courses: Course[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      // Build query object (no isActive filter for admin)
      const query: any = {};

      // Add filters if provided
      if (filters && filters.length > 0) {
        query.category = { 
          $in: filters.map(filter => new RegExp(filter, 'i'))
        };
      }

      // Add search filter if provided
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
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
      console.error('Error fetching all courses (admin):', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch courses: ${error.message}`);
      }
      throw new Error('Failed to fetch courses');
    }
  }

  /**
   * Update course status (activate/deactivate)
   * @param courseId - Course ID
   * @param isActive - New active status
   * @returns Promise<Course | null> - Updated course or null if not found
   */
  async updateCourseStatus(courseId: string, isActive: boolean): Promise<Course | null> {
    try {
      if (!courseId?.trim()) {
        throw new Error('Course ID is required');
      }

      const updatedCourse = await CourseModel.findOneAndUpdate(
        { id: courseId.trim() },
        { 
          isActive,
          updatedAt: new Date()
        },
        { 
          new: true, // Return updated document
          runValidators: true // Run schema validators
        }
      )
      .select('-__v') // Exclude version field
      .lean(); // Return plain JavaScript object

      return updatedCourse;
    } catch (error) {
      console.error('Error updating course status:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to update course status: ${error.message}`);
      }
      throw new Error('Failed to update course status');
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
      if (courseData.plan.professionals?.elite?.price < 0) {
        errors.push('Professional elite plan price must be 0 or greater');
      }
      if (courseData.plan.professionals?.essential?.price < 0) {
        errors.push('Professional essential plan price must be 0 or greater');
      }
      if (courseData.plan.collegeStudents?.elite?.price < 0) {
        errors.push('College students elite plan price must be 0 or greater');
      }
      if (courseData.plan.collegeStudents?.essential?.price < 0) {
        errors.push('College students essential plan price must be 0 or greater');
      }
    }

    // Validate discount
    if (courseData.discount !== undefined && (courseData.discount < 0 || courseData.discount > 100)) {
      errors.push('Discount must be between 0 and 100');
    }

          return {
        isValid: errors.length === 0,
        errors
      };
    }

    /**
     * Debug method to get all courses without any filters
     * @returns Promise<Course[]> - All courses in database
     */
    async debugGetAllCourses(): Promise<Course[]> {
      try {
        const allCourses = await CourseModel.find({})
          .select('-__v')
          .sort({ createdAt: -1 })
          .lean();

        return allCourses;
      } catch (error) {
        console.error('Error fetching all courses (debug):', error);
        if (error instanceof Error) {
          throw new Error(`Failed to fetch courses: ${error.message}`);
        }
        throw new Error('Failed to fetch courses');
      }
    }
  } 