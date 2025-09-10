import { Course, CourseModule } from "../types";
import CourseModel from "../models/course.schema";
import {
  CourseLessonModel,
  CourseModuleModel,
  VideoContentModel,
  QuizContentModel,
} from "../models/course-module.schema";

export class CourseService {
  /**
   * Create a new course
   * @param courseData - Course data to create
   * @returns Promise<Course> - Created course
   */
  async createCourse(courseData: Partial<Course>): Promise<Course> {
    const startTime = Date.now();
    const performanceMetrics = {
      totalContents: 0,
      totalLessons: 0,
      totalModules: 0,
      contentCreationTime: 0,
      lessonCreationTime: 0,
      moduleCreationTime: 0,
      courseCreationTime: 0,
      totalTime: 0,
    };

    try {
      // Fix database indexes if needed
      await this.ensureProperIndexes();

      // Check if course is too large for current memory constraints
      const totalContents = this.countTotalContents(courseData.modules || []);
      performanceMetrics.totalContents = totalContents;
      performanceMetrics.totalModules = courseData.modules?.length || 0;
      performanceMetrics.totalLessons =
        courseData.modules?.reduce(
          (acc, module) => acc + (module.lessons?.length || 0),
          0
        ) || 0;

      console.log("📊 Course size analysis:", {
        title: courseData.title,
        moduleCount: performanceMetrics.totalModules,
        lessonCount: performanceMetrics.totalLessons,
        totalContents: performanceMetrics.totalContents,
        estimatedMemoryUsage: `${(totalContents * 0.5).toFixed(1)}MB`,
        currentMemory: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`
      });

      if (totalContents > 500) {
        console.warn(
          `⚠️ Large course detected: ${totalContents} contents. Consider breaking into smaller courses.`
        );
      }

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
        instructor: Array.isArray(courseData.instructor)
          ? courseData.instructor
          : [],

        // Pricing Plans - ensure it has the correct structure
        plans: courseData.plans || {
          elite: undefined,
          essential: undefined,
        },

        // Reviews
        reviews: courseData.reviews || [],
        testimonials: courseData.testimonials || [],

        // FAQs
        faqs: courseData.faqs || [],

        // Administrative
        isActive:
          courseData.isActive !== undefined ? courseData.isActive : true,
        createdBy: courseData.createdBy || "Admin",
        tags: courseData.tags || [],
        audience: courseData.audience || "college-students",

        // SEO
        metaTitle: courseData.metaTitle || "",
        metaDescription: courseData.metaDescription || "",
        keywords: courseData.keywords || [],

        // Scholarship
        scholarship:
          courseData.scholarship !== undefined ? courseData.scholarship : false,
        scholarshipDescription: courseData.scholarshipDescription || "",

        // Language - ensure it's a valid enum value
        language: courseData.language || "en",
      };

      const savedModuleIds: string[] = [];

      // Process modules with batch operations for better memory efficiency
      if (
        courseToCreate.modules &&
        Array.isArray(courseToCreate.modules) &&
        courseToCreate.modules.length > 0
      ) {
        // Collect all contents first for batch processing
        const allContents: any[] = [];
        const contentToLessonMap: Map<
          number,
          { moduleIndex: number; lessonIndex: number }
        > = new Map();
        let contentIndex = 0;

        // First pass: collect all contents
        courseToCreate.modules.forEach((module, moduleIndex) => {
          if (module.lessons && Array.isArray(module.lessons)) {
            module.lessons.forEach((lesson, lessonIndex) => {
              if (lesson.contents && Array.isArray(lesson.contents)) {
                lesson.contents.forEach((content) => {
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
                    ...(content.type === "video"
                      ? {
                          sources: (content as any).sources,
                          thumbnailUrl: (content as any).thumbnailUrl,
                          duration: (content as any).duration,
                        }
                      : {}),
                    ...(content.type === "quiz"
                      ? {
                          questions: (content as any).questions,
                          passingScore: (content as any).passingScore,
                          maxAttempts: (content as any).maxAttempts,
                        }
                      : {}),
                  };

                  allContents.push({ type: content.type, data: contentData });
                  contentToLessonMap.set(contentIndex, {
                    moduleIndex,
                    lessonIndex,
                  });
                  contentIndex++;
                });
              }
            });
          }
        });

        // Batch save all contents with error handling and rollback
        const contentStartTime = Date.now();
        const savedContents: any[] = [];
        const createdContentIds: string[] = []; // Track for potential rollback

        if (allContents.length > 0) {
          try {
            console.log(
              `🔄 Processing ${allContents.length} contents in bulk...`
            );
            // Use smaller chunks to prevent memory overload and server freezing
            const CHUNK_SIZE = 25; // Reduced chunk size to prevent server freezing

            for (let i = 0; i < allContents.length; i += CHUNK_SIZE) {
              const chunk = allContents.slice(i, i + CHUNK_SIZE);

              try {
                // Separate video and quiz contents for bulk insertion
                const videoContents = chunk
                  .filter((c) => c.type === "video")
                  .map((c) => c.data);
                const quizContents = chunk
                  .filter((c) => c.type === "quiz")
                  .map((c) => c.data);

                const chunkResults: any[] = [];

                // Bulk insert video contents
                if (videoContents.length > 0) {
                  const videoResults = await VideoContentModel.insertMany(
                    videoContents,
                    {
                      ordered: false, // Continue on error
                      rawResult: false,
                    }
                  );
                  chunkResults.push(...videoResults);
                  videoResults.forEach((result) =>
                    createdContentIds.push(result._id.toString())
                  );
                }

                // Bulk insert quiz contents
                if (quizContents.length > 0) {
                  const quizResults = await QuizContentModel.insertMany(
                    quizContents,
                    {
                      ordered: false, // Continue on error
                      rawResult: false,
                    }
                  );
                  chunkResults.push(...quizResults);
                  quizResults.forEach((result) =>
                    createdContentIds.push(result._id.toString())
                  );
                }

                savedContents.push(...chunkResults);

                console.log(
                  `✅ Processed chunk ${
                    Math.floor(i / CHUNK_SIZE) + 1
                  }/${Math.ceil(allContents.length / CHUNK_SIZE)} (${
                    chunkResults.length
                  } contents)`
                );

                // Memory management and processing delay
                if (global.gc && savedContents.length % 50 === 0) {
                  global.gc();
                  console.log('🧹 Garbage collection triggered');
                }

                // Add small delay between chunks to prevent server overload
                if (i + CHUNK_SIZE < allContents.length) {
                  await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
                }
              } catch (chunkError) {
                console.error(
                  `❌ Error processing chunk ${
                    Math.floor(i / CHUNK_SIZE) + 1
                  }:`,
                  chunkError
                );
                // Rollback: Delete any contents created so far
                await this.rollbackCreatedContents(createdContentIds);
                throw new Error(
                  `Failed to process content chunk: ${
                    chunkError instanceof Error
                      ? chunkError.message
                      : "Unknown error"
                  }`
                );
              }
            }
          } catch (contentError) {
            console.error(
              "❌ Critical error during content creation:",
              contentError
            );
            throw contentError; // Re-throw to be caught by outer try-catch
          }
        }

        performanceMetrics.contentCreationTime = Date.now() - contentStartTime;
        const memoryAfterContents = process.memoryUsage();
        console.log(
          `✅ Content creation completed in ${performanceMetrics.contentCreationTime}ms`
        );
        console.log('📊 Memory after content creation:', {
          heapUsed: `${(memoryAfterContents.heapUsed / 1024 / 1024).toFixed(2)}MB`,
          heapTotal: `${(memoryAfterContents.heapTotal / 1024 / 1024).toFixed(2)}MB`,
          rss: `${(memoryAfterContents.rss / 1024 / 1024).toFixed(2)}MB`
        });
        
        // Force garbage collection after content creation
        if (global.gc) {
          global.gc();
          console.log('🧹 Garbage collection after content creation');
        }

        // Now process modules and lessons with content references
        const lessonStartTime = Date.now();
        const createdLessonIds: string[] = []; // Track for potential rollback
        const createdModuleIds: string[] = []; // Track for potential rollback

        try {
          // First, bulk create all lessons for all modules
          const allLessonsToInsert: any[] = [];
          const moduleToLessonMap = new Map<
            number,
            { startIndex: number; count: number }
          >();
          let currentLessonIndex = 0;

          for (
            let moduleIndex = 0;
            moduleIndex < courseToCreate.modules.length;
            moduleIndex++
          ) {
            const module = courseToCreate.modules[moduleIndex];
            if (module.lessons && Array.isArray(module.lessons)) {
              const startIndex = currentLessonIndex;

              const lessonsForModule = module.lessons.map(
                (lesson, lessonIndex) => {
                  // Find content IDs for this lesson
                  const savedContentIds: string[] = [];
                  for (let i = 0; i < savedContents.length; i++) {
                    const mapping = contentToLessonMap.get(i);
                    if (
                      mapping &&
                      mapping.moduleIndex === moduleIndex &&
                      mapping.lessonIndex === lessonIndex
                    ) {
                      savedContentIds.push(savedContents[i]._id.toString());
                    }
                  }

                  const lessonData = {
                    ...lesson,
                    contentIds: savedContentIds,
                  };
                  // Remove nested contents to avoid schema conflicts
                  delete (lessonData as any).contents;
                  return lessonData;
                }
              );

              allLessonsToInsert.push(...lessonsForModule);
              moduleToLessonMap.set(moduleIndex, {
                startIndex,
                count: lessonsForModule.length,
              });
              currentLessonIndex += lessonsForModule.length;
            }
          }

          // Bulk insert all lessons at once
          let savedLessons: any[] = [];
          if (allLessonsToInsert.length > 0) {
            savedLessons = await CourseLessonModel.insertMany(
              allLessonsToInsert,
              {
                ordered: false, // Continue on error
                rawResult: false,
              }
            );
            createdLessonIds.push(
              ...savedLessons.map((lesson) => lesson._id.toString())
            );
            console.log(`✅ Created ${savedLessons.length} lessons in bulk`);
          }

          // Now create modules with their lesson references
          const modulesToInsert = courseToCreate.modules.map(
            (module, moduleIndex) => {
              const lessonMapping = moduleToLessonMap.get(moduleIndex);
              let lessonIds: string[] = [];

              if (lessonMapping) {
                const { startIndex, count } = lessonMapping;
                lessonIds = savedLessons
                  .slice(startIndex, startIndex + count)
                  .map((lesson) => lesson._id.toString());
              }

              const moduleData = {
                ...module,
                lessonIds,
              };
              // Remove nested lessons to avoid schema conflicts
              delete (moduleData as any).lessons;
              return moduleData;
            }
          );

          // Bulk insert all modules
          const savedModules = await CourseModuleModel.insertMany(
            modulesToInsert,
            {
              ordered: false, // Continue on error
              rawResult: false,
            }
          );

          createdModuleIds.push(
            ...savedModules.map((module) => module._id.toString())
          );
          savedModuleIds.push(
            ...savedModules.map((module) => module._id.toString())
          );

          console.log(`✅ Created ${savedModules.length} modules in bulk`);

          performanceMetrics.lessonCreationTime = Date.now() - lessonStartTime;
          performanceMetrics.moduleCreationTime =
            performanceMetrics.lessonCreationTime; // Combined time
          console.log(
            `✅ Lesson/Module creation completed in ${performanceMetrics.lessonCreationTime}ms`
          );
        } catch (moduleError) {
          console.error(
            "❌ Critical error during module/lesson creation:",
            moduleError
          );
          throw moduleError; // Re-throw to be caught by outer try-catch
        }
      }

      // Update course data to use module references
      const courseCreationStartTime = Date.now();
      (courseToCreate as any).modules = savedModuleIds;

      // Validate that we have at least one module
      if (savedModuleIds.length === 0) {
        throw new Error("Course must have at least one module");
      }

      const course = new CourseModel(courseToCreate);
      const savedCourse = await course.save();

      performanceMetrics.courseCreationTime =
        Date.now() - courseCreationStartTime;
      performanceMetrics.totalTime = Date.now() - startTime;

      // Final performance summary
      console.log("✅ Course saved successfully:", savedCourse._id);
      console.log("📊 Performance Summary:", {
        totalContents: performanceMetrics.totalContents,
        totalLessons: performanceMetrics.totalLessons,
        totalModules: performanceMetrics.totalModules,
        contentCreationTime: `${performanceMetrics.contentCreationTime}ms`,
        lessonCreationTime: `${performanceMetrics.lessonCreationTime}ms`,
        moduleCreationTime: `${performanceMetrics.moduleCreationTime}ms`,
        courseCreationTime: `${performanceMetrics.courseCreationTime}ms`,
        totalTime: `${performanceMetrics.totalTime}ms`,
      });

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
   * Count total contents in all modules for memory estimation
   */
  private countTotalContents(modules: any[]): number {
    let totalContents = 0;
    modules.forEach((module) => {
      if (module.lessons && Array.isArray(module.lessons)) {
        module.lessons.forEach((lesson: any) => {
          if (lesson.contents && Array.isArray(lesson.contents)) {
            totalContents += lesson.contents.length;
          }
        });
      }
    });
    return totalContents;
  }

  /**
   * Rollback created contents in case of failure
   */
  private async rollbackCreatedContents(contentIds: string[]): Promise<void> {
    if (contentIds.length === 0) return;

    try {
      console.log(`🔄 Rolling back ${contentIds.length} created contents...`);

      // Delete video contents
      const videoDeleteResult = await VideoContentModel.deleteMany({
        _id: { $in: contentIds },
      });

      // Delete quiz contents
      const quizDeleteResult = await QuizContentModel.deleteMany({
        _id: { $in: contentIds },
      });

      console.log(
        `✅ Rollback completed: ${
          videoDeleteResult.deletedCount + quizDeleteResult.deletedCount
        } contents deleted`
      );
    } catch (rollbackError) {
      console.error("❌ Error during rollback:", rollbackError);
      // Don't throw here to avoid masking the original error
    }
  }

  /**
   * Rollback created lessons in case of failure
   */
  private async rollbackCreatedLessons(lessonIds: string[]): Promise<void> {
    if (lessonIds.length === 0) return;

    try {
      console.log(`🔄 Rolling back ${lessonIds.length} created lessons...`);
      const deleteResult = await CourseLessonModel.deleteMany({
        _id: { $in: lessonIds },
      });
      console.log(
        `✅ Rollback completed: ${deleteResult.deletedCount} lessons deleted`
      );
    } catch (rollbackError) {
      console.error("❌ Error during lesson rollback:", rollbackError);
    }
  }

  /**
   * Rollback created modules in case of failure
   */
  private async rollbackCreatedModules(moduleIds: string[]): Promise<void> {
    if (moduleIds.length === 0) return;

    try {
      console.log(`🔄 Rolling back ${moduleIds.length} created modules...`);
      const deleteResult = await CourseModuleModel.deleteMany({
        _id: { $in: moduleIds },
      });
      console.log(
        `✅ Rollback completed: ${deleteResult.deletedCount} modules deleted`
      );
    } catch (rollbackError) {
      console.error("❌ Error during module rollback:", rollbackError);
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
   * Get all courses with pagination and optimized data loading
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10)
   * @param search - Search term for title or description (optional)
   * @param filters - Array of filters to apply (optional)
   * @param audienceFilter - Filter by target audience (optional)
   * @param dataLevel - Level of data to return: 'summary' | 'basic' | 'full' (default: 'basic')
   * @param fields - Specific fields to include (optional)
   * @returns Promise<{courses: Course[], total: number, page: number, totalPages: number}>
   */
  async getAllCourses(
    page: number = 1,
    limit: number = 10,
    search?: string,
    filters?: string[],
    audienceFilter?: string,
    dataLevel: "summary" | "basic" | "full" = "basic",
    fields?: string[]
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

      // Define field selection based on data level
      let selectFields = "-__v";
      let populateOptions: any[] = [];

      switch (dataLevel) {
        case "summary":
          // Minimal data for course cards/lists
          selectFields =
            "_id title description shortDescription category thumbnail enrolledCount totalRatings duration skillLevel isFeatured isCertified plans createdAt";
          populateOptions = [
            {
              path: "instructor",
              select: "_id fullName profilePicture",
            },
          ];
          break;

        case "basic":
          // Standard data without full content details but includes plans for pricing
          selectFields = "-__v";
          populateOptions = [
            {
              path: "instructor",
              select: "-__v -password -refreshToken",
            },
            {
              path: "modules",
              select: "_id title description thumbnailUrl isActive",
              populate: {
                path: "lessonIds",
                select: "_id title description isCompleted",
              },
            },
          ];
          break;

        case "full":
          // Complete data with all nested content
          selectFields = "-__v";
          populateOptions = [
            {
              path: "modules",
              select: "-__v",
              populate: {
                path: "lessonIds",
                select: "-__v",
                populate: {
                  path: "contentIds",
                  select: "-__v",
                },
              },
            },
            {
              path: "instructor",
              select: "-__v -password -refreshToken",
            },
          ];
          break;
      }

      // Override with custom fields if provided
      if (fields && fields.length > 0) {
        selectFields = fields.join(" ");
      }

      // Build the query
      let courseQuery = CourseModel.find(query)
        .select(selectFields)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Add population based on data level
      populateOptions.forEach((option) => {
        courseQuery = courseQuery.populate(option);
      });

      const courses = await courseQuery.lean();

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
              select: "-__v",
            },
          },
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
              select: "-__v",
            },
          },
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
              select: "-__v",
            },
          },
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
              select: "-__v",
            },
          },
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
              select: "-__v",
            },
          },
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
  async updateCourseStatusBulk(
    courses: Course["_id"][],
    isActive: boolean
  ): Promise<boolean> {
    try {
      const updatedCourses = await CourseModel.updateMany(
        { _id: { $in: courses } },
        { isActive: isActive }
      );
      if (!updatedCourses) {
        throw new Error("Failed to update course status in bulk");
      }
      return true;
    } catch (error) {
      console.error("Error updating course status in bulk:", error);
      if (error instanceof Error) {
        throw new Error(
          `Failed to update course status in bulk: ${error.message}`
        );
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
          const isNewModule =
            module._id && module._id.toString().startsWith("temp_");

          if (isNewModule) {
            // Create new module
            console.log(`Creating new module: ${module.title}`);
            const newModuleData = { ...module };
            delete newModuleData._id; // Remove temp_ _id for new module

            const newModule = new CourseModuleModel({
              ...newModuleData,
              lessonIds: [], // Will be populated below
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            // Process lessons for this module
            if (module.lessons && Array.isArray(module.lessons)) {
              const processedLessons: any[] = [];

              // Process lessons sequentially
              for (const lesson of module.lessons) {
                const isNewLesson =
                  lesson._id && lesson._id.toString().startsWith("temp_");

                if (isNewLesson) {
                  // Create new lesson
                  const newLessonData = { ...lesson };
                  delete newLessonData._id; // Remove temp_ _id for new lesson

                  const newLesson = new CourseLessonModel({
                    ...newLessonData,
                    contentIds: [], // Will be populated below
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  });

                  // Process contents for this lesson
                  if (lesson.contents && Array.isArray(lesson.contents)) {
                    const processedContents: any[] = [];

                    // Process contents sequentially
                    for (const content of lesson.contents) {
                      const isNewContent =
                        content._id &&
                        content._id.toString().startsWith("temp_");

                      if (isNewContent) {
                        // Create new content
                        console.log(
                          `Creating new content: ${(content as any).title}`
                        );
                        const newContentData = { ...content };
                        delete newContentData._id; // Remove temp_ _id for new content

                        let newContent: any;

                        if ((content as any).type === "video") {
                          newContent = new VideoContentModel({
                            ...newContentData,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                          });
                        } else if ((content as any).type === "quiz") {
                          newContent = new QuizContentModel({
                            ...newContentData,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                          });
                        } else {
                          // Default to video content
                          newContent = new VideoContentModel({
                            ...newContentData,
                            type: "video",
                            createdAt: new Date(),
                            updatedAt: new Date(),
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
                      updatedAt: new Date(),
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
                updatedAt: new Date(),
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
              select: "-__v",
            },
          },
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
   * Delete course with cascade deletion of related modules, lessons, and content
   * @param courseId - Course ID
   * @returns Promise<boolean> - Success status
   */
  async deleteCourse(courseId: string): Promise<boolean> {
    try {
      if (!courseId?.trim()) {
        throw new Error("Course ID is required");
      }

      const trimmedCourseId = courseId.trim();

      // First, get the course to access its modules
      const course = await CourseModel.findById(trimmedCourseId).populate(
        "modules"
      );
      if (!course) {
        throw new Error("Course not found");
      }

      // Get all module IDs
      const moduleIds = (course.modules as unknown as string[]) || [];

      if (moduleIds.length > 0) {
        // Get all lessons from these modules
        const modules = await CourseModuleModel.find({
          _id: { $in: moduleIds },
        });
        const lessonIds: string[] = [];

        modules.forEach((module) => {
          if (module.lessonIds && module.lessonIds.length > 0) {
            lessonIds.push(...(module.lessonIds as string[]));
          }
        });

        if (lessonIds.length > 0) {
          // Get all content from these lessons
          const lessons = await CourseLessonModel.find({
            _id: { $in: lessonIds },
          });
          const contentIds: string[] = [];

          lessons.forEach((lesson) => {
            if (lesson.contentIds && lesson.contentIds.length > 0) {
              contentIds.push(...(lesson.contentIds as string[]));
            }
          });

          // Delete all content first
          if (contentIds.length > 0) {
            await VideoContentModel.deleteMany({ _id: { $in: contentIds } });
            await QuizContentModel.deleteMany({ _id: { $in: contentIds } });
            console.log(
              `Deleted ${contentIds.length} content items for course ${trimmedCourseId}`
            );
          }

          // Delete all lessons
          const lessonDeleteResult = await CourseLessonModel.deleteMany({
            _id: { $in: lessonIds },
          });
          console.log(
            `Deleted ${lessonDeleteResult.deletedCount} lessons for course ${trimmedCourseId}`
          );
        }

        // Delete all modules
        const moduleDeleteResult = await CourseModuleModel.deleteMany({
          _id: { $in: moduleIds },
        });
        console.log(
          `Deleted ${moduleDeleteResult.deletedCount} modules for course ${trimmedCourseId}`
        );
      }

      // Finally, delete the course itself
      const result = await CourseModel.deleteOne({ _id: trimmedCourseId });
      const success = result.deletedCount > 0;

      if (success) {
        console.log(
          `Successfully deleted course ${trimmedCourseId} and all related data`
        );
      }

      return success;
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
              select: "-__v",
            },
          },
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
      errors.push(
        "Course short description must be at least 10 characters long"
      );
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

    if (
      !courseData.skills ||
      !Array.isArray(courseData.skills) ||
      courseData.skills.length === 0
    ) {
      errors.push("Skills array is required and must not be empty");
    }

    if (
      !courseData.highlights ||
      !Array.isArray(courseData.highlights) ||
      courseData.highlights.length === 0
    ) {
      errors.push("Highlights array is required and must not be empty");
    }

    // Features array is optional

    if (
      !courseData.careerPaths ||
      !Array.isArray(courseData.careerPaths) ||
      courseData.careerPaths.length === 0
    ) {
      errors.push("Career paths array is required and must not be empty");
    }

    if (!courseData.skillLevel?.trim()) {
      errors.push("Skill level is required");
    } else if (
      !["Beginner", "Intermediate", "Advanced"].includes(courseData.skillLevel)
    ) {
      errors.push(
        "Valid skill level is required (Beginner, Intermediate, or Advanced)"
      );
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
    } else if (
      ![
        "en",
        "es",
        "fr",
        "de",
        "pt",
        "it",
        "ru",
        "zh",
        "ja",
        "ko",
        "hi",
        "ar",
      ].includes(courseData.language)
    ) {
      errors.push(
        "Language must be a valid language code (en, es, fr, de, pt, it, ru, zh, ja, ko, hi, ar)"
      );
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
    if (
      !courseData.modules ||
      !Array.isArray(courseData.modules) ||
      courseData.modules.length === 0
    ) {
      errors.push("Course must have at least one module");
    } else {
      courseData.modules.forEach((module: any, moduleIndex) => {
        if (!module) {
          errors.push(`Module ${moduleIndex + 1} is required`);
          return;
        }

        // Check if module has required fields
        if (typeof module === "object" && module !== null) {
          if (
            !module.title ||
            typeof module.title !== "string" ||
            !module.title.trim()
          ) {
            errors.push(`Module ${moduleIndex + 1}: Title is required`);
          }

          // Validate thumbnailUrl if present
          if (module.thumbnailUrl && typeof module.thumbnailUrl === "string") {
            const urlPattern =
              /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
            if (!urlPattern.test(module.thumbnailUrl)) {
              errors.push(
                `Module ${moduleIndex + 1}: Invalid thumbnail URL format`
              );
            }
          }

          // Validate lessons if they exist (for nested structure)
          if (module.lessons && Array.isArray(module.lessons)) {
            if (module.lessons.length === 0) {
              errors.push(
                `Module ${moduleIndex + 1}: Must contain at least one lesson`
              );
            } else {
              module.lessons.forEach((lesson: any, lessonIndex: number) => {
                if (!lesson) {
                  errors.push(
                    `Module ${moduleIndex + 1}, Lesson ${
                      lessonIndex + 1
                    }: Lesson is required`
                  );
                  return;
                }

                if (
                  !lesson.title ||
                  typeof lesson.title !== "string" ||
                  !lesson.title.trim()
                ) {
                  errors.push(
                    `Module ${moduleIndex + 1}, Lesson ${
                      lessonIndex + 1
                    }: Title is required`
                  );
                }

                // Validate contents if they exist
                if (lesson.contents && Array.isArray(lesson.contents)) {
                  if (lesson.contents.length === 0) {
                    errors.push(
                      `Module ${moduleIndex + 1}, Lesson ${
                        lessonIndex + 1
                      }: Must contain at least one content item`
                    );
                  } else {
                    lesson.contents.forEach(
                      (content: any, contentIndex: number) => {
                        if (!content) {
                          errors.push(
                            `Module ${moduleIndex + 1}, Lesson ${
                              lessonIndex + 1
                            }, Content ${contentIndex + 1}: Content is required`
                          );
                          return;
                        }

                        if (
                          !content.title ||
                          typeof content.title !== "string" ||
                          !content.title.trim()
                        ) {
                          errors.push(
                            `Module ${moduleIndex + 1}, Lesson ${
                              lessonIndex + 1
                            }, Content ${contentIndex + 1}: Title is required`
                          );
                        }

                        if (
                          !content.type ||
                          !["video", "quiz"].includes(content.type)
                        ) {
                          errors.push(
                            `Module ${moduleIndex + 1}, Lesson ${
                              lessonIndex + 1
                            }, Content ${
                              contentIndex + 1
                            }: Type must be 'video' or 'quiz'`
                          );
                        }

                        // Validate video content
                        if (content.type === "video" && content.content) {
                          if (
                            !content.content.sources ||
                            !Array.isArray(content.content.sources) ||
                            content.content.sources.length === 0
                          ) {
                            errors.push(
                              `Module ${moduleIndex + 1}, Lesson ${
                                lessonIndex + 1
                              }, Content ${
                                contentIndex + 1
                              }: Video must have at least one source`
                            );
                          } else {
                            content.content.sources.forEach(
                              (source: any, sourceIndex: number) => {
                                if (
                                  !source.quality ||
                                  !["1080p", "720p", "480p", "360p"].includes(
                                    source.quality
                                  )
                                ) {
                                  errors.push(
                                    `Module ${moduleIndex + 1}, Lesson ${
                                      lessonIndex + 1
                                    }, Content ${contentIndex + 1}, Source ${
                                      sourceIndex + 1
                                    }: Invalid quality. Must be 1080p, 720p, 480p, or 360p`
                                  );
                                }
                                if (
                                  !source.videoUrl ||
                                  typeof source.videoUrl !== "string" ||
                                  !source.videoUrl.trim()
                                ) {
                                  errors.push(
                                    `Module ${moduleIndex + 1}, Lesson ${
                                      lessonIndex + 1
                                    }, Content ${contentIndex + 1}, Source ${
                                      sourceIndex + 1
                                    }: Video URL is required`
                                  );
                                } else {
                                  const urlPattern =
                                    /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
                                  if (!urlPattern.test(source.videoUrl)) {
                                    errors.push(
                                      `Module ${moduleIndex + 1}, Lesson ${
                                        lessonIndex + 1
                                      }, Content ${contentIndex + 1}, Source ${
                                        sourceIndex + 1
                                      }: Invalid video URL format`
                                    );
                                  }
                                }
                              }
                            );
                          }

                          // Validate video thumbnail is required
                          if (
                            !content.content.thumbnailUrl ||
                            typeof content.content.thumbnailUrl !== "string" ||
                            !content.content.thumbnailUrl.trim()
                          ) {
                            errors.push(
                              `Module ${moduleIndex + 1}, Lesson ${
                                lessonIndex + 1
                              }, Content ${
                                contentIndex + 1
                              }: Video thumbnail URL is required`
                            );
                          } else {
                            const urlPattern =
                              /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
                            if (
                              !urlPattern.test(content.content.thumbnailUrl)
                            ) {
                              errors.push(
                                `Module ${moduleIndex + 1}, Lesson ${
                                  lessonIndex + 1
                                }, Content ${
                                  contentIndex + 1
                                }: Invalid thumbnail URL format`
                              );
                            }
                          }

                          // Validate video duration if present
                          if (
                            content.content.duration !== undefined &&
                            (typeof content.content.duration !== "number" ||
                              content.content.duration < 0)
                          ) {
                            errors.push(
                              `Module ${moduleIndex + 1}, Lesson ${
                                lessonIndex + 1
                              }, Content ${
                                contentIndex + 1
                              }: Duration must be a positive number`
                            );
                          }
                        }

                        // Validate quiz content
                        if (content.type === "quiz" && content.content) {
                          if (
                            !content.content.questions ||
                            !Array.isArray(content.content.questions) ||
                            content.content.questions.length === 0
                          ) {
                            errors.push(
                              `Module ${moduleIndex + 1}, Lesson ${
                                lessonIndex + 1
                              }, Content ${
                                contentIndex + 1
                              }: Quiz must have at least one question`
                            );
                          } else {
                            content.content.questions.forEach(
                              (question: any, questionIndex: number) => {
                                if (
                                  !question.question ||
                                  typeof question.question !== "string" ||
                                  !question.question.trim()
                                ) {
                                  errors.push(
                                    `Module ${moduleIndex + 1}, Lesson ${
                                      lessonIndex + 1
                                    }, Content ${contentIndex + 1}, Question ${
                                      questionIndex + 1
                                    }: Question text is required`
                                  );
                                }
                                if (
                                  !question.options ||
                                  !Array.isArray(question.options) ||
                                  question.options.length < 2
                                ) {
                                  errors.push(
                                    `Module ${moduleIndex + 1}, Lesson ${
                                      lessonIndex + 1
                                    }, Content ${contentIndex + 1}, Question ${
                                      questionIndex + 1
                                    }: Must have at least 2 options`
                                  );
                                }
                                if (
                                  !question.correctAnswer ||
                                  !Array.isArray(question.correctAnswer) ||
                                  question.correctAnswer.length === 0
                                ) {
                                  errors.push(
                                    `Module ${moduleIndex + 1}, Lesson ${
                                      lessonIndex + 1
                                    }, Content ${contentIndex + 1}, Question ${
                                      questionIndex + 1
                                    }: Must have at least one correct answer`
                                  );
                                }
                              }
                            );
                          }
                        }

                        // Validate reading materials if present
                        if (
                          content.readingMaterials &&
                          Array.isArray(content.readingMaterials)
                        ) {
                          content.readingMaterials.forEach(
                            (material: any, materialIndex: number) => {
                              if (
                                !material.content ||
                                !["pdf", "docx"].includes(material.content)
                              ) {
                                errors.push(
                                  `Module ${moduleIndex + 1}, Lesson ${
                                    lessonIndex + 1
                                  }, Content ${
                                    contentIndex + 1
                                  }, Reading Material ${
                                    materialIndex + 1
                                  }: Content type must be 'pdf' or 'docx'`
                                );
                              }
                              if (
                                material.estimatedReadTime !== undefined &&
                                (typeof material.estimatedReadTime !==
                                  "number" ||
                                  material.estimatedReadTime < 0)
                              ) {
                                errors.push(
                                  `Module ${moduleIndex + 1}, Lesson ${
                                    lessonIndex + 1
                                  }, Content ${
                                    contentIndex + 1
                                  }, Reading Material ${
                                    materialIndex + 1
                                  }: Estimated read time must be a positive number`
                                );
                              }
                            }
                          );
                        }
                      }
                    );
                  }
                }
              });
            }
          }

          // Validate lessonIds if using reference structure
          else if (module.lessonIds && Array.isArray(module.lessonIds)) {
            if (module.lessonIds.length === 0) {
              errors.push(
                `Module ${moduleIndex + 1}: Must contain at least one lesson ID`
              );
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

  /**
   * Validate course metadata (without modules)
   * @param courseData - Course metadata to validate
   * @returns Validation result
   */
  validateCourseMetadata(courseData: Partial<Course>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Required fields for metadata
    if (!courseData.title || courseData.title.trim() === "") {
      errors.push("Course title is required");
    }

    if (!courseData.description || courseData.description.trim() === "") {
      errors.push("Course description is required");
    }

    if (!courseData.category || courseData.category.trim() === "") {
      errors.push("Course category is required");
    }

    if (!courseData.thumbnail || courseData.thumbnail.trim() === "") {
      errors.push("Course thumbnail is required");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create course metadata only (first step of chunked creation)
   * @param courseData - Course metadata without modules
   * @returns Promise<Course> - Created course with metadata only
   */
  async createCourseMetadata(courseData: Partial<Course>): Promise<Course> {
    try {
      // Fix database indexes if needed
      await this.ensureProperIndexes();

      // Generate unique slug from title if not provided
      const slug =
        courseData.slug ||
        (await this.generateUniqueSlug(courseData.title || ""));

      // Set default values for course metadata
      const courseToCreate: Partial<Course> = {
        ...courseData,
        slug,
        title: courseData.title || "",
        description: courseData.description || "",
        shortDescription: courseData.shortDescription || "",
        category: courseData.category || "",
        subcategory: courseData.subcategory || "",
        thumbnail: courseData.thumbnail || "",
        previewVideoUrl: courseData.previewVideoUrl || "",
        isFeatured: courseData.isFeatured || false,
        isCertified: courseData.isCertified || false,
        enrolledCount: courseData.enrolledCount || 0,
        totalRatings: courseData.totalRatings || 0,
        whatYouWillLearn: courseData.whatYouWillLearn || "",
        skills: courseData.skills || [],
        highlights: courseData.highlights || [],
        features: courseData.features || [],
        careerPaths: courseData.careerPaths || [],
        skillLevel: courseData.skillLevel || "Beginner",
        whoShouldJoin: courseData.whoShouldJoin || "",
        prerequisites: courseData.prerequisites || [],
        duration: courseData.duration || "",
        modules: [], // Empty modules array initially
        instructor: Array.isArray(courseData.instructor)
          ? courseData.instructor
          : [],
        plans: courseData.plans || { elite: undefined, essential: undefined },
        reviews: courseData.reviews || [],
        testimonials: courseData.testimonials || [],
        faqs: courseData.faqs || [],
        isActive:
          courseData.isActive !== undefined ? courseData.isActive : false, // Set to false initially
        createdBy: courseData.createdBy || "Admin",
        tags: courseData.tags || [],
        audience: courseData.audience || "college-students",
        metaTitle: courseData.metaTitle || "",
        metaDescription: courseData.metaDescription || "",
        keywords: courseData.keywords || [],
        scholarship:
          courseData.scholarship !== undefined ? courseData.scholarship : false,
        scholarshipDescription: courseData.scholarshipDescription || "",
        language: courseData.language || "en",
      };

      const course = new CourseModel(courseToCreate);
      const savedCourse = await course.save();

      console.log("✅ Course metadata created successfully:", savedCourse._id);
      return savedCourse.toObject();
    } catch (error: any) {
      console.error("❌ Error creating course metadata:", error);
      throw error;
    }
  }

  /**
   * Add modules to an existing course
   * @param courseId - Course ID to add modules to
   * @param modules - Array of modules to add
   * @returns Promise with module IDs and count
   */
  async addModulesToCourse(
    courseId: string,
    modules: any[]
  ): Promise<{ moduleIds: string[]; addedCount: number }> {
    try {
      // Find the course
      const course = await CourseModel.findById(courseId);
      if (!course) {
        throw new Error("Course not found");
      }

      const savedModuleIds: string[] = [];

      // Process each module
      for (const module of modules) {
        try {
          const moduleData = {
            ...module,
            lessonIds: [], // Empty lessons initially
          };
          // Remove nested lessons to avoid schema conflicts
          delete (moduleData as any).lessons;
          
          // Remove temporary _id fields that can't be cast to ObjectId
          if (moduleData._id && typeof moduleData._id === 'string' && moduleData._id.startsWith('temp_')) {
            delete moduleData._id;
          }

          const savedModule = new CourseModuleModel(moduleData);
          const result = await savedModule.save();
          savedModuleIds.push(result._id.toString());

          console.log(`✅ Created module: ${module.title || "Untitled"}`);
        } catch (error) {
          console.error(
            `❌ Error saving module ${module.title || "Untitled"}:`,
            error
          );
          // Rollback created modules
          await this.rollbackCreatedModules(savedModuleIds);
          throw new Error(
            `Failed to save module: ${module.title || "Untitled"}`
          );
        }
      }

      // Add module IDs to course
      course.modules = [
        ...(course.modules || []),
        ...savedModuleIds.map((id) => ({ _id: id } as CourseModule)),
      ];
      await course.save();

      console.log(
        `✅ Added ${savedModuleIds.length} modules to course ${courseId}`
      );
      return {
        moduleIds: savedModuleIds,
        addedCount: savedModuleIds.length,
      };
    } catch (error: any) {
      console.error("❌ Error adding modules to course:", error);
      throw error;
    }
  }

  /**
   * Add lessons to a specific module
   * @param courseId - Course ID
   * @param moduleId - Module ID to add lessons to
   * @param lessons - Array of lessons to add
   * @returns Promise with lesson IDs and count
   */
  async addLessonsToModule(
    courseId: string,
    moduleId: string,
    lessons: any[]
  ): Promise<{ lessonIds: string[]; addedCount: number }> {
    try {
      // Find the course
      const course = await CourseModel.findById(courseId);
      if (!course) {
        throw new Error("Course not found");
      }

      // Find the module
      const module = await CourseModuleModel.findById(moduleId);
      if (!module) {
        throw new Error("Module not found");
      }

      const savedLessonIds: string[] = [];
      const createdContentIds: string[] = [];

      // Process each lesson
      for (const lesson of lessons) {
        try {
          const savedContentIds: string[] = [];

          // Process contents for this lesson
          if (lesson.contents && Array.isArray(lesson.contents)) {
            for (const content of lesson.contents) {
              try {
                // Remove temporary _id fields that can't be cast to ObjectId
                if (content._id && typeof content._id === 'string' && content._id.startsWith('temp_')) {
                  delete content._id;
                }
                
                // Prepare content data
                const contentData = {
                  title: content.title,
                  description: content.description,
                  type: content.type,
                  readingMaterials: content.readingMaterials || [],
                  isLocked: content.isLocked || false,
                  ...((content as any).content || {}),
                  ...(content.type === "video"
                    ? {
                        sources: (content as any).sources,
                        thumbnailUrl: (content as any).thumbnailUrl,
                        duration: (content as any).duration,
                      }
                    : {}),
                  ...(content.type === "quiz"
                    ? {
                        questions: (content as any).questions,
                        passingScore: (content as any).passingScore,
                        maxAttempts: (content as any).maxAttempts,
                      }
                    : {}),
                };

                let savedContent;
                if (content.type === "video") {
                  savedContent = new VideoContentModel(contentData);
                } else if (content.type === "quiz") {
                  savedContent = new QuizContentModel(contentData);
                } else {
                  throw new Error(`Invalid content type: ${content.type}`);
                }

                const result = await savedContent.save();
                savedContentIds.push(result._id.toString());
                createdContentIds.push(result._id.toString());
              } catch (error) {
                console.error(
                  `❌ Error saving content ${content.title || "Untitled"}:`,
                  error
                );
                // Rollback created contents
                await this.rollbackCreatedContents(createdContentIds);
                throw new Error(
                  `Failed to save content: ${content.title || "Untitled"}`
                );
              }
            }
          }

          // Remove temporary _id fields that can't be cast to ObjectId
          if (lesson._id && typeof lesson._id === 'string' && lesson._id.startsWith('temp_')) {
            delete lesson._id;
          }
          
          // Create lesson with content references
          const lessonData = {
            ...lesson,
            contentIds: savedContentIds,
          };
          // Remove nested contents to avoid schema conflicts
          delete (lessonData as any).contents;

          const savedLesson = new CourseLessonModel(lessonData);
          const result = await savedLesson.save();
          savedLessonIds.push(result._id.toString());

          console.log(
            `✅ Created lesson: ${lesson.title || "Untitled"} with ${
              savedContentIds.length
            } contents`
          );
        } catch (error) {
          console.error(
            `❌ Error saving lesson ${lesson.title || "Untitled"}:`,
            error
          );
          // Rollback created contents and lessons
          await this.rollbackCreatedContents(createdContentIds);
          await this.rollbackCreatedLessons(savedLessonIds);
          throw new Error(
            `Failed to save lesson: ${lesson.title || "Untitled"}`
          );
        }
      }

      // Add lesson IDs to module
      module.lessonIds = [...(module.lessonIds || []), ...savedLessonIds];
      await module.save();

      console.log(
        `✅ Added ${savedLessonIds.length} lessons to module ${moduleId}`
      );
      return {
        lessonIds: savedLessonIds,
        addedCount: savedLessonIds.length,
      };
    } catch (error: any) {
      console.error("❌ Error adding lessons to module:", error);
      throw error;
    }
  }

  /**
   * Finalize course creation (activate the course)
   * @param courseId - Course ID to finalize
   * @returns Promise<Course> - Finalized course
   */
  async finalizeCourseCreation(courseId: string): Promise<Course> {
    try {
      // Find the course
      const course = await CourseModel.findById(courseId);
      if (!course) {
        throw new Error("Course not found");
      }

      // Validate that course has modules
      if (!course.modules || course.modules.length === 0) {
        throw new Error(
          "Course must have at least one module before finalization"
        );
      }

      // Activate the course
      course.isActive = true;
      const savedCourse = await course.save();

      console.log(`✅ Course ${courseId} finalized and activated`);
      return savedCourse.toObject();
    } catch (error: any) {
      console.error("❌ Error finalizing course creation:", error);
      throw error;
    }
  }
}
