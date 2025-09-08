import { Course } from "../types";
import CourseModel from "../models/course.schema";
import { CourseLessonModel, CourseModuleModel, VideoContentModel, QuizContentModel } from "../models/course-module.schema";

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

      // Set default values according to Upcoming Course schema
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
        highlights: courseData.highlights || [],
        features: courseData.features || [],
        careerPaths: courseData.careerPaths || [],
        skillLevel: courseData.skillLevel || "Beginner",
        whoShouldJoin: courseData.whoShouldJoin || "",
        prerequisites: courseData.prerequisites || [],

        duration: courseData.duration || "",

        // Content
        modules: courseData.modules || [],

        // Instructor - ensure it's an array of ObjectIds or empty array
        instructor: Array.isArray(courseData.instructor) ? courseData.instructor : [],

        // Pricing Plans - ensure it has the correct structure
        plans: courseData.plans || {
          elite: undefined,
          essential: undefined
        },

        // Reviews
        reviews: courseData.reviews || [],
        testimonials: courseData.testimonials || [],

        // FAQs
        faqs: courseData.faqs || [],

        // Administrative
        isActive: courseData.isActive !== undefined ? courseData.isActive : true,
        createdBy: courseData.createdBy || "Admin",
        tags: courseData.tags || [],
        audience: courseData.audience || "college-students",

        // SEO
        metaTitle: courseData.metaTitle || "",
        metaDescription: courseData.metaDescription || "",
        keywords: courseData.keywords || [],

        // Scholarship
        scholarship: courseData.scholarship !== undefined ? courseData.scholarship : false,
        scholarshipDescription: courseData.scholarshipDescription || "",

        // Language - ensure it's a valid enum value
        language: courseData.language || "en",
      };

      const savedModuleIds: string[] = [];
      
      // Process modules sequentially to avoid race conditions
      if (courseToCreate.modules && Array.isArray(courseToCreate.modules) && courseToCreate.modules.length > 0) {
        for (const module of courseToCreate.modules) {
          const savedLessonIds: string[] = [];
          
          // Process lessons sequentially
          if (module.lessons && Array.isArray(module.lessons)) {
            for (const lesson of module.lessons) {
              const savedContentIds: string[] = [];
              
              // Process contents sequentially
              if (lesson.contents && Array.isArray(lesson.contents)) {
                for (const content of lesson.contents) {
                  try {
                    let savedContent;
                    
                    // Prepare content data by flattening the nested structure
                    const contentData = {
                      title: content.title,
                      description: content.description,
                      type: content.type,
                      readingMaterials: content.readingMaterials || [],
                      isLocked: content.isLocked || false,
                      // Handle both nested and direct content structures
                      ...((content as any).content || {}),
                      // Also include direct properties for backward compatibility
                      ...(content.type === 'video' ? {
                        sources: (content as any).sources,
                        thumbnailUrl: (content as any).thumbnailUrl,
                        duration: (content as any).duration
                      } : {}),
                      ...(content.type === 'quiz' ? {
                        questions: (content as any).questions,
                        passingScore: (content as any).passingScore,
                        maxAttempts: (content as any).maxAttempts
                      } : {})
                    };
                    
                    // Handle different content types using discriminators
                    if (contentData.type === "video") {
                      savedContent = new VideoContentModel(contentData);
                    } else if (contentData.type === "quiz") {
                      savedContent = new QuizContentModel(contentData);
                    } else {
                      throw new Error(`Invalid content type: ${content.title || 'Untitled'}`);
                    }
                    
                    await savedContent.save();
                    savedContentIds.push(savedContent._id.toString());
                  } catch (error) {
                    console.error(`❌ Error saving content ${content.title || 'Untitled'}:`, error);
                    throw new Error(`Failed to save content: ${content.title || 'Untitled'}`);
                  }
                }
              }
              
              // Create lesson with content references
              try {
                const lessonData = {
                  ...lesson,
                  contentIds: savedContentIds,
                };
                // Remove nested contents to avoid schema conflicts
                delete (lessonData as any).contents;
                
                const savedLesson = new CourseLessonModel(lessonData);
                await savedLesson.save();
                savedLessonIds.push(savedLesson._id.toString());
              } catch (error) {
                console.error(`❌ Error saving lesson ${lesson.title || 'Untitled'}:`, error);
                throw new Error(`Failed to save lesson: ${lesson.title || 'Untitled'}`);
              }
            }
          }
          
          // Create module with lesson references
          try {
            const moduleData = {
              ...module,
              lessonIds: savedLessonIds,
            };
            // Remove nested lessons to avoid schema conflicts
            delete (moduleData as any).lessons;
            
            const savedModule = new CourseModuleModel(moduleData);
            await savedModule.save();
            savedModuleIds.push(savedModule._id.toString());
          } catch (error) {
            console.error(`❌ Error saving module ${module.title || 'Untitled'}:`, error);
            throw new Error(`Failed to save module: ${module.title || 'Untitled'}`);
          }
        }
      }

      // Update course data to use module references  
      (courseToCreate as any).modules = savedModuleIds;

      // Validate that we have at least one module
      if (savedModuleIds.length === 0) {
        throw new Error("Course must have at least one module");
      }

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
    filters?: string[],
    audienceFilter?: string
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

      // Add audience filter if provided
      if (audienceFilter) {
        query.audience = audienceFilter;
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
        .populate({
          path: "modules",
          select: "-__v",
          populate: {
            path: "lessonIds",
            select: "-__v",
            populate: {
              path: "contentIds",
              select: "-__v"
            }
          }
        })
        .populate({
          path: "instructor",
          select: "-__v",
        })
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
        .lean() // Return plain JavaScript object instead of Mongoose document
        .populate({
          path: "modules",
          select: "-__v",
          populate: {
            path: "lessonIds",
            select: "-__v",
            populate: {
              path: "contentIds",
              select: "-__v"
            }
          }
        })
        .populate({
          path: "instructor",
          select: "-__v",
        });

      // Transform field names after population
      if (course) {
        // Transform modules.lessonIds to modules.lessons
        if (course.modules) {
          course.modules.forEach((module: any) => {
            if (module.lessonIds) {
              module.lessons = module.lessonIds;
              delete module.lessonIds;
              
              // Transform lessons.contentIds to lessons.contents
              if (module.lessons) {
                module.lessons.forEach((lesson: any) => {
                  if (lesson.contentIds) {
                    lesson.contents = lesson.contentIds;
                    delete lesson.contentIds;
                  }
                });
              }
            }
          });
        }
      }

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
        .lean() // Return plain JavaScript object instead of Mongoose document
        .populate({
          path: "modules",
          select: "-__v",
          populate: {
            path: "lessonIds",
            select: "-__v",
            populate: {
              path: "contentIds",
              select: "-__v"
            }
          }
        })
        .populate({
          path: "instructor",
          select: "-__v",
        });

      // Transform field names after population
      if (course) {
        // Transform modules.lessonIds to modules.lessons
        if (course.modules) {
          course.modules.forEach((module: any) => {
            if (module.lessonIds) {
              module.lessons = module.lessonIds;
              delete module.lessonIds;
              
              // Transform lessons.contentIds to lessons.contents
              if (module.lessons) {
                module.lessons.forEach((lesson: any) => {
                  if (lesson.contentIds) {
                    lesson.contents = lesson.contentIds;
                    delete lesson.contentIds;
                  }
                });
              }
            }
          });
        }
      }

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
   * Get a course by ID (Admin version - includes inactive courses)
   * @param courseId - Course ID
   * @returns Promise<Course | null> - Course data or null if not found
   */
  async getCourseByIdAdmin(courseId: string): Promise<Course | null> {
    try {
      if (!courseId?.trim()) {
        throw new Error("Course ID is required");
      }

      const course = await CourseModel.findOne({
        _id: courseId.trim(),
      })
        .select("-__v") // Exclude version field
        .lean() // Return plain JavaScript object instead of Mongoose document
        .populate({
          path: "modules",
          select: "-__v",
          populate: {
            path: "lessonIds",
            select: "-__v",
            populate: {
              path: "contentIds",
              select: "-__v"
            }
          }
        })
        .populate({
          path: "instructor",
          select: "-__v",
        });

      // Transform field names after population
      if (course) {
        // Transform modules.lessonIds to modules.lessons
        if (course.modules) {
          course.modules.forEach((module: any) => {
            if (module.lessonIds) {
              module.lessons = module.lessonIds;
              delete module.lessonIds;
              
              // Transform lessons.contentIds to lessons.contents
              if (module.lessons) {
                module.lessons.forEach((lesson: any) => {
                  if (lesson.contentIds) {
                    lesson.contents = lesson.contentIds;
                    delete lesson.contentIds;
                  }
                });
              }
            }
          });
        }
      }

      return course;
    } catch (error) {
      console.error("Error fetching course by ID (admin):", error);
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
        .populate({
          path: "modules",
          select: "-__v",
          populate: {
            path: "lessonIds",
            select: "-__v",
            populate: {
              path: "contentIds",
              select: "-__v"
            }
          }
        })
        .populate({
          path: "instructor",
          select: "-__v",
        })
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
        .populate({
          path: "modules",
          select: "-__v",
          populate: {
            path: "lessonIds",
            select: "-__v",
            populate: {
              path: "contentIds",
              select: "-__v"
            }
          }
        })
        .populate({
          path: "instructor",
          select: "-__v",
        })
        .lean(); // Return plain JavaScript object

      if (!updatedCourse) {
        throw new Error("Failed to update course status");
      }

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
   * Update course status in bulk
   * @param courses - Array of courses
   * @returns Promise<boolean> - Success status
   */
  async updateCourseStatusBulk(courses: Course["_id"][], isActive: boolean): Promise<boolean> {
    try {
      const updatedCourses = await CourseModel.updateMany({ _id: { $in: courses } }, { isActive: isActive });
      if (!updatedCourses) {
        throw new Error("Failed to update course status in bulk");
      }
      return true;
    } catch (error) {
      console.error("Error updating course status in bulk:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to update course status in bulk: ${error.message}`);
      }
      throw new Error("Failed to update course status in bulk");
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

      const existingCourse = await CourseModel.findById(courseId);
      if (!existingCourse) {
        throw new Error("Course not found");
      }

      // Process modules to handle new and existing ones
      if (updateData.modules && Array.isArray(updateData.modules)) {
        const processedModules: any[] = [];
        
        // Process modules sequentially to avoid race conditions
        for (const module of updateData.modules) {
          const isNewModule = module._id && module._id.toString().startsWith('temp_');
          
          if (isNewModule) {
            // Create new module
            console.log(`Creating new module: ${module.title}`);
            const newModuleData = { ...module };
            delete newModuleData._id; // Remove temp_ _id for new module
            
            const newModule = new CourseModuleModel({
              ...newModuleData,
              lessonIds: [], // Will be populated below
              createdAt: new Date(),
              updatedAt: new Date()
            });

            // Process lessons for this module
            if (module.lessons && Array.isArray(module.lessons)) {
              const processedLessons: any[] = [];
              
              // Process lessons sequentially
              for (const lesson of module.lessons) {
                const isNewLesson = lesson._id && lesson._id.toString().startsWith('temp_');
                
                if (isNewLesson) {
                  // Create new lesson
                  const newLessonData = { ...lesson };
                  delete newLessonData._id; // Remove temp_ _id for new lesson
                  
                  const newLesson = new CourseLessonModel({
                    ...newLessonData,
                    contentIds: [], // Will be populated below
                    createdAt: new Date(),
                    updatedAt: new Date()
                  });

                  // Process contents for this lesson
                  if (lesson.contents && Array.isArray(lesson.contents)) {
                    const processedContents: any[] = [];
                    
                    // Process contents sequentially
                    for (const content of lesson.contents) {
                      const isNewContent = content._id && content._id.toString().startsWith('temp_');
                      
                      if (isNewContent) {
                        // Create new content
                        console.log(`Creating new content: ${(content as any).title}`);
                        const newContentData = { ...content };
                        delete newContentData._id; // Remove temp_ _id for new content
                        
                        let newContent: any;
                        
                        if ((content as any).type === 'video') {
                          newContent = new VideoContentModel({
                            ...newContentData,
                            createdAt: new Date(),
                            updatedAt: new Date()
                          });
                        } else if ((content as any).type === 'quiz') {
                          newContent = new QuizContentModel({
                            ...newContentData,
                            createdAt: new Date(),
                            updatedAt: new Date()
                          });
                        } else {
                          // Default to video content
                          newContent = new VideoContentModel({
                            ...newContentData,
                            type: 'video',
                            createdAt: new Date(),
                            updatedAt: new Date()
                          });
                        }
                        
                        // Save the new content
                        await newContent.save();
                        processedContents.push(newContent._id);
                      } else {
                        // Existing content - preserve the _id reference
                        processedContents.push((content as any)._id);
                      }
                    }
                    
                    newLesson.contentIds = processedContents;
                  }
                  
                  // Save the new lesson
                  await newLesson.save();
                  processedLessons.push(newLesson._id);
                } else {
                  // Existing lesson - update it
                  const lessonId = lesson._id;
                  const lessonUpdateData = { ...lesson };
                  
                  // Update lesson
                  await CourseLessonModel.findByIdAndUpdate(
                    lessonId,
                    {
                      ...lessonUpdateData,
                      updatedAt: new Date()
                    },
                    { new: true, runValidators: false }
                  );
                  
                  processedLessons.push(lessonId);
                }
              }
              
              newModule.lessonIds = processedLessons;
            }
            
            // Save the new module
            await newModule.save();
            processedModules.push(newModule._id);
          } else {
            // Existing module - update it
            const moduleId = module._id;
            const moduleUpdateData = { ...module };
            
            // Update module
            await CourseModuleModel.findByIdAndUpdate(
              moduleId,
              {
                ...moduleUpdateData,
                updatedAt: new Date()
              },
              { new: true, runValidators: false }
            );
            
            processedModules.push(moduleId);
          }
        }
        
        // Save the processed module IDs to the correct schema field
        updateData.moduleIds = processedModules;
      }

      // Add updated timestamp
      const dataToUpdate = {
        ...updateData,
        updatedAt: new Date(),
      };

      const updatedCourse = await CourseModel.findByIdAndUpdate(
        courseId,
        dataToUpdate,
        {
          new: true, // Return updated document
          runValidators: false, // Skip validators for partial updates
        }
      )
        .select("-__v") // Exclude version field
        .lean() // Return plain JavaScript object
        .populate({
          path: "modules",
          select: "-__v",
          populate: {
            path: "lessonIds",
            select: "-__v",
            populate: {
              path: "contentIds",
              select: "-__v"
            }
          }
        })
        .populate({
          path: "instructor",
          select: "-__v",
        });

      if (!updatedCourse) {
        throw new Error("Failed to update course");
      }

      // Transform field names after population
      if (updatedCourse) {
        // Transform modules.lessonIds to modules.lessons
        if (updatedCourse.modules) {
          updatedCourse.modules.forEach((module: any) => {
            if (module.lessonIds) {
              module.lessons = module.lessonIds;
              delete module.lessonIds;
              
              // Transform lessons.contentIds to lessons.contents
              if (module.lessons) {
                module.lessons.forEach((lesson: any) => {
                  if (lesson.contentIds) {
                    lesson.contents = lesson.contentIds;
                    delete lesson.contentIds;
                  }
                });
              }
            }
          });
        }
      }

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
        .lean()
        .populate({
          path: "modules",
          select: "-__v",
          populate: {
            path: "lessonIds",
            select: "-__v",
            populate: {
              path: "contentIds",
              select: "-__v"
            }
          }
        })
        .populate({
          path: "instructor",
          select: "-__v",
        });

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
        .populate({
          path: "instructor",
          select: "-__v",
        })
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
    } else if (courseData.title.trim().length < 5) {
      errors.push("Course title must be at least 5 characters long");
    } else if (courseData.title.trim().length > 100) {
      errors.push("Course title cannot exceed 100 characters");
    }

    if (!courseData.description?.trim()) {
      errors.push("Course description is required");
    } else if (courseData.description.trim().length < 25) {
      errors.push("Course description must be at least 25 characters long");
    } else if (courseData.description.trim().length > 1000) {
      errors.push("Course description cannot exceed 1000 characters");
    }

    if (!courseData.shortDescription?.trim()) {
      errors.push("Course short description is required");
    } else if (courseData.shortDescription.trim().length < 10) {
      errors.push("Course short description must be at least 10 characters long");
    } else if (courseData.shortDescription.trim().length > 100) {
      errors.push("Course short description cannot exceed 100 characters");
    }

    if (!courseData.category?.trim()) {
      errors.push("Course category is required");
    }

    if (!courseData.thumbnail?.trim()) {
      errors.push("Course thumbnail is required");
    }

    // Preview video URL is optional

    if (!courseData.whatYouWillLearn?.trim()) {
      errors.push("What you will learn is required");
    }

    if (!courseData.skills || !Array.isArray(courseData.skills) || courseData.skills.length === 0) {
      errors.push("Skills array is required and must not be empty");
    }

    if (!courseData.highlights || !Array.isArray(courseData.highlights) || courseData.highlights.length === 0) {
      errors.push("Highlights array is required and must not be empty");
    }

    // Features array is optional

    if (!courseData.careerPaths || !Array.isArray(courseData.careerPaths) || courseData.careerPaths.length === 0) {
      errors.push("Career paths array is required and must not be empty");
    }

    if (!courseData.skillLevel?.trim()) {
      errors.push("Skill level is required");
    } else if (!["Beginner", "Intermediate", "Advanced"].includes(courseData.skillLevel)) {
      errors.push("Valid skill level is required (Beginner, Intermediate, or Advanced)");
    }

    if (!courseData.whoShouldJoin?.trim()) {
      errors.push("Who should join is required");
    }

    if (!courseData.duration?.trim()) {
      errors.push("Duration is required");
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

    if (!courseData.language?.trim()) {
      errors.push("Language is required");
    } else if (!["en", "es", "fr", "de", "pt", "it", "ru", "zh", "ja", "ko", "hi", "ar"].includes(courseData.language)) {
      errors.push("Language must be a valid language code (en, es, fr, de, pt, it, ru, zh, ja, ko, hi, ar)");
    }

    // Validate plans structure
    if (!courseData.plans) {
      errors.push("Plans are required");
    } else {
      const plans = courseData.plans as any;
      if (!plans.elite && !plans.essential) {
        errors.push("At least one plan (elite or essential) is required");
      }
    }

    // if (!courseData.createdBy?.trim()) {
    //   errors.push("Created by field is required");
    // }

    // if (!courseData.instructor || !Array.isArray(courseData.instructor) || courseData.instructor.length === 0) {
    //   errors.push("Course must have at least one instructor");
    // }

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

    // Validate modules - at least one is required
    if (!courseData.modules || !Array.isArray(courseData.modules) || courseData.modules.length === 0) {
      errors.push("Course must have at least one module");
    } else {
      courseData.modules.forEach((module: any, moduleIndex) => {
        if (!module) {
          errors.push(`Module ${moduleIndex + 1} is required`);
          return;
        }

        // Check if module has required fields
        if (typeof module === 'object' && module !== null) {
          if (!module.title || typeof module.title !== 'string' || !module.title.trim()) {
            errors.push(`Module ${moduleIndex + 1}: Title is required`);
          }

          // Validate thumbnailUrl if present
          if (module.thumbnailUrl && typeof module.thumbnailUrl === 'string') {
            const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
            if (!urlPattern.test(module.thumbnailUrl)) {
              errors.push(`Module ${moduleIndex + 1}: Invalid thumbnail URL format`);
            }
          }

          // Validate lessons if they exist (for nested structure)
          if (module.lessons && Array.isArray(module.lessons)) {
            if (module.lessons.length === 0) {
              errors.push(`Module ${moduleIndex + 1}: Must contain at least one lesson`);
            } else {
              module.lessons.forEach((lesson: any, lessonIndex: number) => {
                if (!lesson) {
                  errors.push(`Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}: Lesson is required`);
                  return;
                }

                if (!lesson.title || typeof lesson.title !== 'string' || !lesson.title.trim()) {
                  errors.push(`Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}: Title is required`);
                }

                // Validate contents if they exist
                if (lesson.contents && Array.isArray(lesson.contents)) {
                  if (lesson.contents.length === 0) {
                    errors.push(`Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}: Must contain at least one content item`);
                  } else {
                    lesson.contents.forEach((content: any, contentIndex: number) => {
                      if (!content) {
                        errors.push(`Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}, Content ${contentIndex + 1}: Content is required`);
                        return;
                      }

                      if (!content.title || typeof content.title !== 'string' || !content.title.trim()) {
                        errors.push(`Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}, Content ${contentIndex + 1}: Title is required`);
                      }

                      if (!content.type || !['video', 'quiz'].includes(content.type)) {
                        errors.push(`Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}, Content ${contentIndex + 1}: Type must be 'video' or 'quiz'`);
                      }

                      // Validate video content
                      if (content.type === 'video' && content.content) {
                        if (!content.content.sources || !Array.isArray(content.content.sources) || content.content.sources.length === 0) {
                          errors.push(`Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}, Content ${contentIndex + 1}: Video must have at least one source`);
                        } else {
                          content.content.sources.forEach((source: any, sourceIndex: number) => {
                            if (!source.quality || !['1080p', '720p', '480p', '360p'].includes(source.quality)) {
                              errors.push(`Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}, Content ${contentIndex + 1}, Source ${sourceIndex + 1}: Invalid quality. Must be 1080p, 720p, 480p, or 360p`);
                            }
                            if (!source.videoUrl || typeof source.videoUrl !== 'string' || !source.videoUrl.trim()) {
                              errors.push(`Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}, Content ${contentIndex + 1}, Source ${sourceIndex + 1}: Video URL is required`);
                            } else {
                              const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
                              if (!urlPattern.test(source.videoUrl)) {
                                errors.push(`Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}, Content ${contentIndex + 1}, Source ${sourceIndex + 1}: Invalid video URL format`);
                              }
                            }
                          });
                        }

                        // Validate video thumbnail is required
                        if (!content.content.thumbnailUrl || typeof content.content.thumbnailUrl !== 'string' || !content.content.thumbnailUrl.trim()) {
                          errors.push(`Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}, Content ${contentIndex + 1}: Video thumbnail URL is required`);
                        } else {
                          const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
                          if (!urlPattern.test(content.content.thumbnailUrl)) {
                            errors.push(`Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}, Content ${contentIndex + 1}: Invalid thumbnail URL format`);
                          }
                        }

                        // Validate video duration if present
                        if (content.content.duration !== undefined && (typeof content.content.duration !== 'number' || content.content.duration < 0)) {
                          errors.push(`Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}, Content ${contentIndex + 1}: Duration must be a positive number`);
                        }
                      }

                      // Validate quiz content
                      if (content.type === 'quiz' && content.content) {
                        if (!content.content.questions || !Array.isArray(content.content.questions) || content.content.questions.length === 0) {
                          errors.push(`Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}, Content ${contentIndex + 1}: Quiz must have at least one question`);
                        } else {
                          content.content.questions.forEach((question: any, questionIndex: number) => {
                            if (!question.question || typeof question.question !== 'string' || !question.question.trim()) {
                              errors.push(`Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}, Content ${contentIndex + 1}, Question ${questionIndex + 1}: Question text is required`);
                            }
                            if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
                              errors.push(`Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}, Content ${contentIndex + 1}, Question ${questionIndex + 1}: Must have at least 2 options`);
                            }
                            if (!question.correctAnswer || !Array.isArray(question.correctAnswer) || question.correctAnswer.length === 0) {
                              errors.push(`Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}, Content ${contentIndex + 1}, Question ${questionIndex + 1}: Must have at least one correct answer`);
                            }
                          });
                        }
                      }

                      // Validate reading materials if present
                      if (content.readingMaterials && Array.isArray(content.readingMaterials)) {
                        content.readingMaterials.forEach((material: any, materialIndex: number) => {
                          if (!material.content || !['pdf', 'docx'].includes(material.content)) {
                            errors.push(`Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}, Content ${contentIndex + 1}, Reading Material ${materialIndex + 1}: Content type must be 'pdf' or 'docx'`);
                          }
                          if (material.estimatedReadTime !== undefined && (typeof material.estimatedReadTime !== 'number' || material.estimatedReadTime < 0)) {
                            errors.push(`Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}, Content ${contentIndex + 1}, Reading Material ${materialIndex + 1}: Estimated read time must be a positive number`);
                          }
                        });
                      }
                    });
                  }
                }
              });
            }
          }
          
          // Validate lessonIds if using reference structure
          else if (module.lessonIds && Array.isArray(module.lessonIds)) {
            if (module.lessonIds.length === 0) {
              errors.push(`Module ${moduleIndex + 1}: Must contain at least one lesson ID`);
            }
          }
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

  async cleanCourseData(courseData: Partial<Course>): Promise<Partial<Course>> {
    // Deep clone to avoid mutating the original course data
    const cleanedData = JSON.parse(JSON.stringify(courseData));

    // Remove any _id field from the top level
    if ("_id" in cleanedData) {
      delete cleanedData._id;
    }

    // Remove any id field that might conflict with MongoDB's _id
    if ("id" in cleanedData) {
      delete cleanedData.id;
    }

    // Remove all manual _id fields from nested objects - let MongoDB auto-generate them
    this.removeManualIds(cleanedData);

    return cleanedData;
  }
}
