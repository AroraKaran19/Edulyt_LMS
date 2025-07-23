import { Course, CourseModule, Discount } from '../types/course';
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
      const courseId = courseData._id || uuidv4();
      const slug = courseData.slug || this.generateSlug(courseData.title || '');
      
      // Set default values according to Course schema
      const courseToCreate: Partial<Course> = {
        ...courseData,
        _id: courseId,
        slug,
        createdAt: new Date(),
        updatedAt: new Date(),
        
        // Required fields with defaults
        title: courseData.title || '',
        description: courseData.description || '',
        category: courseData.category || '',
        thumbnail: courseData.thumbnail || '',
        previewVideoUrl: courseData.previewVideoUrl || '',
        
        // Administrative defaults
        isActive: courseData.isActive !== undefined ? courseData.isActive : true,
        enrolledCount: courseData.enrolledCount || 0,
        totalRatings: courseData.totalRatings || 0,
        totalLectures: courseData.totalLectures || this.calculateTotalLectures(courseData.modules || []),
        createdBy: courseData.createdBy || 'admin',
        
        // Flags
        isFeatured: courseData.isFeatured || false,
        isCertified: courseData.isCertified || false,
        
        // Learning info
        whatYouWillLearn: courseData.whatYouWillLearn || '',
        skillLevel: courseData.skillLevel || 'Beginner',
        whoShouldJoin: courseData.whoShouldJoin || '',
        prerequisites: courseData.prerequisites || [],
        
        // Content arrays
        skills: courseData.skills || [],
        keyFeatures: courseData.keyFeatures || [],
        features: courseData.features || [],
        careerPaths: courseData.careerPaths || [],
        modules: courseData.modules || [],
        instructor: courseData.instructor || [],
        reviews: courseData.reviews || [],
        featuredReviews: courseData.featuredReviews || [],
        faqs: courseData.faqs || [],
        tags: courseData.tags || [],
        
        // Pricing plans with proper structure
        plans: courseData.plans || {
          elite: [],
          essential: []
        },
        
        // SEO fields
        metaTitle: courseData.metaTitle,
        metaDescription: courseData.metaDescription,
        keywords: courseData.keywords || [],
        
        // Audience
        audience: courseData.audience || 'professionals',
        
        // Duration
        duration: courseData.duration || '1 month',
        
        // Scholarship
        scholarship: courseData.scholarship || false,
        scholarshipDescription: courseData.scholarshipDescription,
        
        // Discount with proper Discount type
        discount: courseData.discount || {
          discount: 'percentage',
          value: 0,
          isActive: false
        }
      };

      // Validate required fields
      const validation = this.validateCourseData(courseToCreate);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

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
  private calculateTotalLectures(modules: CourseModule[]): number {
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
          { description: { $regex: search, $options: 'i' } },
          { shortDescription: { $regex: search, $options: 'i' } }
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
   * Get a course by ID
   * @param courseId - Course ID
   * @returns Promise<Course | null> - Course data or null if not found
   */
  async getCourseById(courseId: string): Promise<Course | null> {
    try {
      if (!courseId?.trim()) {
        throw new Error('Course ID is required');
      }

      const course = await CourseModel.findOne({ 
        _id: courseId.trim(),
        isActive: true 
      })
      .select('-__v') // Exclude version field
      .lean(); // Return plain JavaScript object instead of Mongoose document

      return course;
    } catch (error) {
      console.error('Error fetching course by ID:', error);
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
          { description: { $regex: search, $options: 'i' } },
          { shortDescription: { $regex: search, $options: 'i' } }
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
        { _id: courseId.trim() },
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
   * Update course
   * @param courseId - Course ID
   * @param updateData - Data to update
   * @returns Promise<Course | null> - Updated course or null if not found
   */
  async updateCourse(courseId: string, updateData: Partial<Course>): Promise<Course | null> {
    try {
      if (!courseId?.trim()) {
        throw new Error('Course ID is required');
      }

      // Add updated timestamp
      const dataToUpdate = {
        ...updateData,
        updatedAt: new Date()
      };

      const updatedCourse = await CourseModel.findOneAndUpdate(
        { _id: courseId.trim() },
        dataToUpdate,
        { 
          new: true, // Return updated document
          runValidators: true // Run schema validators
        }
      )
      .select('-__v') // Exclude version field
      .lean(); // Return plain JavaScript object

      return updatedCourse;
    } catch (error) {
      console.error('Error updating course:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to update course: ${error.message}`);
      }
      throw new Error('Failed to update course');
    }
  }

  /**
   * Delete course
   * @param courseId - Course ID
   * @returns Promise<boolean> - Success status
   */
  async deleteCourse(courseId: string): Promise<boolean> {
    try {
      if (!courseId?.trim()) {
        throw new Error('Course ID is required');
      }

      const result = await CourseModel.deleteOne({ _id: courseId.trim() });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting course:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to delete course: ${error.message}`);
      }
      throw new Error('Failed to delete course');
    }
  }

  /**
   * Get courses by category
   * @param category - Course category
   * @param limit - Number of courses to return
   * @returns Promise<Course[]> - Array of courses
   */
  async getCoursesByCategory(category: string, limit: number = 10): Promise<Course[]> {
    try {
      if (!category?.trim()) {
        throw new Error('Category is required');
      }

      const courses = await CourseModel.find({
        category: new RegExp(category.trim(), 'i'),
        isActive: true
      })
      .select('-__v')
      .sort({ enrolledCount: -1, createdAt: -1 }) // Sort by popularity then newest
      .limit(limit)
      .lean();

      return courses;
    } catch (error) {
      console.error('Error fetching courses by category:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch courses by category: ${error.message}`);
      }
      throw new Error('Failed to fetch courses by category');
    }
  }

  /**
   * Search courses
   * @param searchTerm - Search term
   * @param page - Page number
   * @param limit - Items per page
   * @returns Promise with search results
   */
  async searchCourses(
    searchTerm: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    courses: Course[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      if (!searchTerm?.trim()) {
        throw new Error('Search term is required');
      }

      const query = {
        isActive: true,
        $or: [
          { title: { $regex: searchTerm.trim(), $options: 'i' } },
          { description: { $regex: searchTerm.trim(), $options: 'i' } },
          { shortDescription: { $regex: searchTerm.trim(), $options: 'i' } },
          { category: { $regex: searchTerm.trim(), $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm.trim(), 'i')] } },
          { skills: { $in: [new RegExp(searchTerm.trim(), 'i')] } }
        ]
      };

      const skip = (page - 1) * limit;
      const total = await CourseModel.countDocuments(query);
      
      const courses = await CourseModel.find(query)
        .select('-__v')
        .sort({ enrolledCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const totalPages = Math.ceil(total / limit);

      return {
        courses,
        total,
        page,
        totalPages
      };
    } catch (error) {
      console.error('Error searching courses:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to search courses: ${error.message}`);
      }
      throw new Error('Failed to search courses');
    }
  }

  /**
   * Validate course data
   * @param courseData - Course data to validate
   * @returns Validation result with errors
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

    if (!courseData.audience || !['college-students', 'professionals'].includes(courseData.audience)) {
      errors.push('Valid audience is required (college-students or professionals)');
    }

    if (!courseData.skillLevel || !['Beginner', 'Intermediate', 'Advanced'].includes(courseData.skillLevel)) {
      errors.push('Valid skill level is required (Beginner, Intermediate, or Advanced)');
    }

    // Validate plans if provided
    if (courseData.plans) {
      if (courseData.plans.elite) {
        courseData.plans.elite.forEach((plan, index) => {
          if (plan.price < 0) {
            errors.push(`Elite plan ${index + 1} price must be 0 or greater`);
          }
        });
      }
      if (courseData.plans.essential) {
        courseData.plans.essential.forEach((plan, index) => {
          if (plan.price < 0) {
            errors.push(`Essential plan ${index + 1} price must be 0 or greater`);
          }
        });
      }
    }

    // Validate discount if provided
    if (courseData.discount && typeof courseData.discount === 'object') {
      if (courseData.discount.value < 0 || courseData.discount.value > 100) {
        errors.push('Discount value must be between 0 and 100');
      }
      if (!['percentage', 'fixed'].includes(courseData.discount.discount)) {
        errors.push('Discount type must be either "percentage" or "fixed"');
      }
    }

    // Validate modules if provided
    if (courseData.modules && Array.isArray(courseData.modules)) {
      courseData.modules.forEach((module, moduleIndex) => {
        if (!module._id) {
          errors.push(`Module ${moduleIndex + 1} must have an ID`);
        }
        if (!module.title?.trim()) {
          errors.push(`Module ${moduleIndex + 1} must have a title`);
        }
        if (typeof module.order !== 'number' || module.order < 0) {
          errors.push(`Module ${moduleIndex + 1} must have a valid order number`);
        }
      });
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

  /**
   * Get course statistics
   * @returns Promise with course statistics
   */
  async getCourseStats(): Promise<{
    totalCourses: number;
    activeCourses: number;
    inactiveCourses: number;
    featuredCourses: number;
    totalEnrollments: number;
    categoriesCount: { [key: string]: number };
  }> {
    try {
      const [
        totalCourses,
        activeCourses,
        inactiveCourses,
        featuredCourses,
        enrollmentStats,
        categoryStats
      ] = await Promise.all([
        CourseModel.countDocuments({}),
        CourseModel.countDocuments({ isActive: true }),
        CourseModel.countDocuments({ isActive: false }),
        CourseModel.countDocuments({ isFeatured: true, isActive: true }),
        CourseModel.aggregate([
          { $group: { _id: null, totalEnrollments: { $sum: '$enrolledCount' } } }
        ]),
        CourseModel.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 } } }
        ])
      ]);

      const totalEnrollments = enrollmentStats[0]?.totalEnrollments || 0;
      const categoriesCount = categoryStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as { [key: string]: number });

      return {
        totalCourses,
        activeCourses,
        inactiveCourses,
        featuredCourses,
        totalEnrollments,
        categoriesCount
      };
    } catch (error) {
      console.error('Error fetching course stats:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch course stats: ${error.message}`);
      }
      throw new Error('Failed to fetch course stats');
    }
  }
} 