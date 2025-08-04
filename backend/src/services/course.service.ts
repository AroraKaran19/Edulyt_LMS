import { Course } from "../types/course";
import CourseModel from "../models/course.schema";

export class CourseService {
  /**
   * Create a new course
   * @param courseData - Course data to create
   * @returns Promise<Course> - Created course
   */
  async createCourse(courseData: Partial<Course>): Promise<Course> {
    try {
      // Fix database indexes if needed
      await this.ensureProperIndexes();

      // Generate unique slug from title if not provided
      const slug =
        courseData.slug ||
        (await this.generateUniqueSlug(courseData.title || ""));

      // Set default values according to Course schema
      const courseToCreate: Partial<Course> = {
        ...courseData,
        slug,

        // Required fields with defaults
        title: courseData.title || "",
        description: courseData.description || "",
        shortDescription: courseData.shortDescription || "",
        category: courseData.category || "",
        subcategory: courseData.subcategory || "",
        thumbnail: courseData.thumbnail || "",
        previewVideoUrl: courseData.previewVideoUrl || "",
        isFeatured: courseData.isFeatured || false,
        isCertified: courseData.isCertified || false,

        // Metrics
        enrolledCount: courseData.enrolledCount || 0,
        totalRatings: courseData.totalRatings || 0,

        // UI & Learning Info
        whatYouWillLearn: courseData.whatYouWillLearn || "",
        skills: courseData.skills || [],
        courseTestimonials: courseData.courseTestimonials || [],
        features: courseData.features || [],
        careerPaths: courseData.careerPaths || [],
        skillLevel: courseData.skillLevel || "",
        whoShouldJoin: courseData.whoShouldJoin || "",
        prerequisites: courseData.prerequisites || [],
        fakeDiscount: courseData.fakeDiscount || 0,
        duration: courseData.duration || "",

        // Content
        modules: courseData.modules || [],

        // Instructor
        instructor: courseData.instructor || [],

        // Pricing Plans
        plans: courseData.plans || {},

        // Reviews
        reviews: courseData.reviews || [],
        testimonials: courseData.testimonials || [],

        // FAQs
        faqs: courseData.faqs || [],

        // Administrative
        isActive: courseData.isActive || true,
        createdBy: courseData.createdBy || "Admin",
        tags: courseData.tags || [],
        audience: courseData.audience || "professionals",

        // SEO
        metaTitle: courseData.metaTitle || "",
        metaDescription: courseData.metaDescription || "",
        keywords: courseData.keywords || [],

        // Scholarship
        scholarship: courseData.scholarship || false,
        scholarshipDescription: courseData.scholarshipDescription || "",
        // scholarshipQuiz?: Quiz[];

        // Language
        language: courseData.language || "English",
      };

      // Remove any _id if provided - let MongoDB generate it
      if ("_id" in courseToCreate) {
        delete courseToCreate._id;
      }

      // Remove any id field that might conflict with MongoDB's _id
      if ("id" in courseToCreate) {
        delete (courseToCreate as any).id;
      }

      // Remove all manual _id fields from nested objects - let MongoDB auto-generate them
      this.removeManualIds(courseToCreate);

      // Debug: Check for any remaining problematic fields
      if (process.env.NODE_ENV === "development") {
        const hasId = JSON.stringify(courseToCreate).includes('"_id":');
        if (hasId) {
          console.warn(
            '⚠️  Warning: Course data still contains "_id" fields after cleaning'
          );
        }
      }

      // Validate required fields
      const validation = this.validateCourseData(courseToCreate);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }

      // Create the course
      console.log("Creating course with data:", {
        title: courseToCreate.title,
        language: courseToCreate.language,
        plansStructure: typeof courseToCreate.plans,
        hasElitePlan: !!courseToCreate.plans?.elite,
        hasEssentialPlan: !!courseToCreate.plans?.essential,
      });

      const course = new CourseModel(courseToCreate);
      const savedCourse = await course.save();

      console.log("✅ Course saved successfully:", savedCourse._id);
      return savedCourse.toObject();
    } catch (error) {
      console.error("Error creating course:", error);

      // Log specific validation errors
      if (error && typeof error === "object" && "name" in error) {
        if ((error as any).name === "ValidationError") {
          console.error("Mongoose validation errors:", (error as any).errors);
        }
        if ((error as any).name === "MongoServerError") {
          console.error("MongoDB server error:", (error as any).message);
        }
      }

      if (error instanceof Error) {
        throw new Error(`Failed to create course: ${error.message}`);
      }
      throw new Error("Failed to create course");
    }
  }

  /**
   * Generate a unique slug from title
   * @param title - Course title
   * @returns Promise<string> - Generated unique slug
   */
  private async generateUniqueSlug(title: string): Promise<string> {
    if (!title?.trim()) {
      // Generate a random slug if no title provided
      return `course-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }

    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

    // If baseSlug is empty after cleaning, generate a random one
    if (!baseSlug) {
      return `course-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 7)}`;
    }

    // Check if base slug is unique
    try {
      const existingCourse = await CourseModel.findOne({ slug: baseSlug });
      if (!existingCourse) {
        return baseSlug;
      }

      // If not unique, append a timestamp and counter
      const timestamp = Date.now();
      let counter = 1;
      let uniqueSlug = `${baseSlug}-${timestamp}-${counter}`;

      // Keep trying until we find a unique slug
      while (await CourseModel.findOne({ slug: uniqueSlug })) {
        counter++;
        uniqueSlug = `${baseSlug}-${timestamp}-${counter}`;

        // Safety break to prevent infinite loop
        if (counter > 1000) {
          uniqueSlug = `${baseSlug}-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 10)}`;
          break;
        }
      }

      return uniqueSlug;
    } catch (error) {
      console.error("Error generating unique slug:", error);
      // Fallback to timestamp-based slug
      return `course-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 10)}`;
    }
  }

  /**
   * Get all featured courses
   * @returns Promise<Course[]> - Array of featured courses
   */
  async getFeaturedCourses(): Promise<Course[]> {
    try {
      const featuredCourses = await CourseModel.find({
        isFeatured: true,
        isActive: true,
      })
        .select("-__v") // Exclude version field
        .sort({ createdAt: -1 }) // Sort by newest first
        .lean(); // Return plain JavaScript objects instead of Mongoose documents

      return featuredCourses;
    } catch (error) {
      console.error("Error fetching featured courses:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch featured courses: ${error.message}`);
      }
      throw new Error("Failed to fetch featured courses");
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
    search?: string,
    filters?: string[]
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
          $in: filters.map((filter) => new RegExp(filter, "i")),
        };
      }

      // Add search filter if provided
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { shortDescription: { $regex: search, $options: "i" } },
        ];
      }

      console.log("getAllCourses query:", JSON.stringify(query, null, 2));

      // Calculate skip value for pagination
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const total = await CourseModel.countDocuments(query);
      console.log("Total courses found:", total);

      // Get courses with pagination
      const courses = await CourseModel.find(query)
        .select("-__v") // Exclude version field
        .sort({ createdAt: -1 }) // Sort by newest first
        .skip(skip)
        .limit(limit)
        .lean(); // Return plain JavaScript objects instead of Mongoose documents

      console.log("Courses returned:", courses.length);

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      return {
        courses,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      console.error("Error fetching all courses:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch courses: ${error.message}`);
      }
      throw new Error("Failed to fetch courses");
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
        throw new Error("Course slug is required");
      }

      const course = await CourseModel.findOne({
        slug: slug.trim(),
        isActive: true,
      })
        .select("-__v") // Exclude version field
        .lean(); // Return plain JavaScript object instead of Mongoose document

      return course;
    } catch (error) {
      console.error("Error fetching course by slug:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch course: ${error.message}`);
      }
      throw new Error("Failed to fetch course");
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
        throw new Error("Course ID is required");
      }

      const course = await CourseModel.findOne({
        _id: courseId.trim(),
        isActive: true,
      })
        .select("-__v") // Exclude version field
        .lean(); // Return plain JavaScript object instead of Mongoose document

      return course;
    } catch (error) {
      console.error("Error fetching course by ID:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch course: ${error.message}`);
      }
      throw new Error("Failed to fetch course");
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
          $in: filters.map((filter) => new RegExp(filter, "i")),
        };
      }

      // Add search filter if provided
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { shortDescription: { $regex: search, $options: "i" } },
        ];
      }

      // Calculate skip value for pagination
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const total = await CourseModel.countDocuments(query);

      // Get courses with pagination
      const courses = await CourseModel.find(query)
        .select("-__v") // Exclude version field
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
        totalPages,
      };
    } catch (error) {
      console.error("Error fetching all courses (admin):", error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch courses: ${error.message}`);
      }
      throw new Error("Failed to fetch courses");
    }
  }

  /**
   * Update course status (activate/deactivate)
   * @param courseId - Course ID
   * @param isActive - New active status
   * @returns Promise<Course | null> - Updated course or null if not found
   */
  async updateCourseStatus(
    courseId: string,
    isActive: boolean
  ): Promise<Course | null> {
    try {
      if (!courseId?.trim()) {
        throw new Error("Course ID is required");
      }

      const updatedCourse = await CourseModel.findOneAndUpdate(
        { _id: courseId.trim() },
        {
          isActive,
          updatedAt: new Date(),
        },
        {
          new: true, // Return updated document
          runValidators: true, // Run schema validators
        }
      )
        .select("-__v") // Exclude version field
        .lean(); // Return plain JavaScript object

      return updatedCourse;
    } catch (error) {
      console.error("Error updating course status:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to update course status: ${error.message}`);
      }
      throw new Error("Failed to update course status");
    }
  }

  /**
   * Update course
   * @param courseId - Course ID
   * @param updateData - Data to update
   * @returns Promise<Course | null> - Updated course or null if not found
   */
  async updateCourse(
    courseId: string,
    updateData: Partial<Course>
  ): Promise<Course | null> {
    try {
      if (!courseId?.trim()) {
        throw new Error("Course ID is required");
      }

      // Remove any _id if provided - let MongoDB generate it
      if ("_id" in updateData) {
        delete updateData._id;
      }

      // Remove any id field that might conflict with MongoDB's _id
      if ("id" in updateData) {
        delete (updateData as any).id;
      }

      // Remove all manual _id fields from nested objects - let MongoDB auto-generate them
      this.removeManualIds(updateData);

      // Debug: Check for any remaining problematic fields
      if (process.env.NODE_ENV === "development") {
        const hasId = JSON.stringify(updateData).includes('"_id":');
        if (hasId) {
          console.warn(
            '⚠️  Warning: Update data still contains "_id" fields after cleaning'
          );
        }
      }

      // Add updated timestamp
      const dataToUpdate = {
        ...updateData,
        updatedAt: new Date(),
      };

      console.log("Updating course with ID:", courseId);
      console.log("Update data keys:", Object.keys(dataToUpdate));
      console.log("Update data sample:", {
        title: dataToUpdate.title,
        description: dataToUpdate.description?.substring(0, 50) + "...",
        category: dataToUpdate.category,
        thumbnail: dataToUpdate.thumbnail,
        previewVideoUrl: dataToUpdate.previewVideoUrl,
        whatYouWillLearn:
          dataToUpdate.whatYouWillLearn?.substring(0, 50) + "...",
        whoShouldJoin: dataToUpdate.whoShouldJoin,
      });

      const updatedCourse = await CourseModel.findOneAndUpdate(
        { _id: courseId.trim() },
        dataToUpdate,
        {
          new: true, // Return updated document
          runValidators: false, // Skip validators for partial updates
        }
      )
        .select("-__v") // Exclude version field
        .lean(); // Return plain JavaScript object

      console.log("Course updated successfully:", !!updatedCourse);
      return updatedCourse;
    } catch (error) {
      console.error("Error updating course:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to update course: ${error.message}`);
      }
      throw new Error("Failed to update course");
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
        throw new Error("Course ID is required");
      }

      const result = await CourseModel.deleteOne({ _id: courseId.trim() });
      return result.deletedCount > 0;
    } catch (error) {
      console.error("Error deleting course:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to delete course: ${error.message}`);
      }
      throw new Error("Failed to delete course");
    }
  }

  /**
   * Get courses by category
   * @param category - Course category
   * @param limit - Number of courses to return
   * @returns Promise<Course[]> - Array of courses
   */
  async getCoursesByCategory(
    category: string,
    limit: number = 10
  ): Promise<Course[]> {
    try {
      if (!category?.trim()) {
        throw new Error("Category is required");
      }

      const courses = await CourseModel.find({
        category: new RegExp(category.trim(), "i"),
        isActive: true,
      })
        .select("-__v")
        .sort({ enrolledCount: -1, createdAt: -1 }) // Sort by popularity then newest
        .limit(limit)
        .lean();

      return courses;
    } catch (error) {
      console.error("Error fetching courses by category:", error);
      if (error instanceof Error) {
        throw new Error(
          `Failed to fetch courses by category: ${error.message}`
        );
      }
      throw new Error("Failed to fetch courses by category");
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
        throw new Error("Search term is required");
      }

      const query = {
        isActive: true,
        $or: [
          { title: { $regex: searchTerm.trim(), $options: "i" } },
          { description: { $regex: searchTerm.trim(), $options: "i" } },
          { shortDescription: { $regex: searchTerm.trim(), $options: "i" } },
          { category: { $regex: searchTerm.trim(), $options: "i" } },
          { tags: { $in: [new RegExp(searchTerm.trim(), "i")] } },
          { skills: { $in: [new RegExp(searchTerm.trim(), "i")] } },
        ],
      };

      const skip = (page - 1) * limit;
      const total = await CourseModel.countDocuments(query);

      const courses = await CourseModel.find(query)
        .select("-__v")
        .sort({ enrolledCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const totalPages = Math.ceil(total / limit);

      return {
        courses,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      console.error("Error searching courses:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to search courses: ${error.message}`);
      }
      throw new Error("Failed to search courses");
    }
  }

  /**
   * Validate course data
   * @param courseData - Course data to validate
   * @returns Validation result with errors
   */
  validateCourseData(courseData: Partial<Course>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Required fields validation
    if (!courseData.title?.trim()) {
      errors.push("Course title is required");
    }

    if (!courseData.description?.trim()) {
      errors.push("Course description is required");
    }

    if (!courseData.category?.trim()) {
      errors.push("Course category is required");
    }

    if (!courseData.thumbnail?.trim()) {
      errors.push("Course thumbnail is required");
    }

    if (!courseData.previewVideoUrl?.trim()) {
      errors.push("Preview video URL is required");
    }

    if (!courseData.createdBy?.trim()) {
      errors.push("Created by field is required");
    }

    if (
      !courseData.audience ||
      !["college-students", "professionals"].includes(courseData.audience)
    ) {
      errors.push(
        "Valid audience is required (college-students or professionals)"
      );
    }

    if (
      !courseData.skillLevel ||
      !["Beginner", "Intermediate", "Advanced"].includes(courseData.skillLevel)
    ) {
      errors.push(
        "Valid skill level is required (Beginner, Intermediate, or Advanced)"
      );
    }

    if (!courseData.language?.trim()) {
      errors.push("Language is required");
    }

    // Validate plans
    if (courseData.plans) {
      if (courseData.plans.elite) {
        if (
          typeof courseData.plans.elite.price !== "number" ||
          courseData.plans.elite.price < 0
        ) {
          errors.push("Elite plan price must be a valid number 0 or greater");
        }
        if (!courseData.plans.elite.title?.trim()) {
          errors.push("Elite plan title is required");
        }
        if (
          !courseData.plans.elite.features ||
          courseData.plans.elite.features.length === 0
        ) {
          errors.push("Elite plan features must be atleast 1");
        }
      }
      if (courseData.plans.essential) {
        if (
          typeof courseData.plans.essential.price !== "number" ||
          courseData.plans.essential.price < 0
        ) {
          errors.push(
            "Essential plan price must be a valid number 0 or greater"
          );
        }
        if (!courseData.plans.essential.title?.trim()) {
          errors.push("Essential plan title is required");
        }
        if (
          !courseData.plans.essential.features ||
          courseData.plans.essential.features.length === 0
        ) {
          errors.push("Essential plan features must be atleast 1");
        }
      }
    }

    // Validate modules if provided
    if (
      courseData.modules &&
      Array.isArray(courseData.modules) &&
      courseData.modules.length > 0
    ) {
      courseData.modules.forEach((module, moduleIndex) => {
        if (!module) {
          errors.push(`Module ${moduleIndex + 1} is required`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Debug method to get all courses without any filters
   * @returns Promise<Course[]> - All courses in database
   */
  async debugGetAllCourses(): Promise<Course[]> {
    try {
      const allCourses = await CourseModel.find({})
        .select("-__v")
        .sort({ createdAt: -1 })
        .lean();

      return allCourses;
    } catch (error) {
      console.error("Error fetching all courses (debug):", error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch courses: ${error.message}`);
      }
      throw new Error("Failed to fetch courses");
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
        categoryStats,
      ] = await Promise.all([
        CourseModel.countDocuments({}),
        CourseModel.countDocuments({ isActive: true }),
        CourseModel.countDocuments({ isActive: false }),
        CourseModel.countDocuments({ isFeatured: true, isActive: true }),
        CourseModel.aggregate([
          {
            $group: { _id: null, totalEnrollments: { $sum: "$enrolledCount" } },
          },
        ]),
        CourseModel.aggregate([
          { $group: { _id: "$category", count: { $sum: 1 } } },
        ]),
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
        categoriesCount,
      };
    } catch (error) {
      console.error("Error fetching course stats:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch course stats: ${error.message}`);
      }
      throw new Error("Failed to fetch course stats");
    }
  }

  /**
   * Ensure proper database indexes and fix any problematic ones
   */
  private async ensureProperIndexes(): Promise<void> {
    try {
      const collection = CourseModel.collection;

      // Check if problematic id_1 index exists and drop it
      try {
        const indexes = await collection.getIndexes();
        if (indexes["id_1"]) {
          console.log("🔧 Dropping problematic id_1 index...");
          await collection.dropIndex("id_1");
          console.log("✅ Dropped id_1 index successfully");
        }
      } catch (error) {
        // Index doesn't exist or can't be dropped, that's fine
        console.log("ℹ️  No problematic id_1 index found");
      }

      // Ensure slug index exists and is unique
      try {
        await collection.createIndex(
          { slug: 1 },
          { unique: true, sparse: true }
        );
        console.log("✅ Ensured slug index exists");
      } catch (error) {
        // Index might already exist, that's fine
        console.log("ℹ️  Slug index already exists");
      }
    } catch (error) {
      console.warn("⚠️  Could not ensure proper indexes:", error);
      // Don't throw error, just warn - the app should still work
    }
  }

  /**
   * Recursively remove all manual _id and id fields from an object
   * Let MongoDB auto-generate ObjectIds for nested documents
   * @param obj - Object to clean
   */
  private removeManualIds(obj: any): void {
    if (!obj || typeof obj !== "object") {
      return;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      obj.forEach((item) => this.removeManualIds(item));
      return;
    }

    // Remove _id from current object if it exists
    if ("_id" in obj) {
      delete obj._id;
    }

    // Remove id from current object if it exists (to prevent conflicts)
    if ("id" in obj) {
      delete obj.id;
    }

    // Recursively process all properties
    Object.keys(obj).forEach((key) => {
      if (obj[key] && typeof obj[key] === "object") {
        this.removeManualIds(obj[key]);
      }
    });
  }
}
