import {
  CourseModuleModel,
  CourseLessonModel,
  ContentModel,
} from "../models/course-module.schema";
import { AppError } from "../middlewares/error.middleware";
import { CourseModel } from "../models/course.schema";
import { Course, CourseModule } from "../types/course";
import mongoose from "mongoose";

/**
 * Retrieves paginated course list with search and filtering
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @param search - Search term for title or description (optional)
 * @param filters - Array of filters to apply (optional)
 * @param audienceFilter - Filter by target audience (optional)
 * @param fields - Specific fields to include (optional)
 * @returns Promise<{courses: Course[], total: number, page: number, totalPages: number}>
 */
export const getAllCourses = async (
  page: number,
  limit: number,
  search?: string,
  filters?: string[],
  audienceFilter?: string,
  category?: string
): Promise<{
  courses: Course[];
  total: number;
  page: number;
  totalPages: number;
} | null> => {
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

    // Add category filter if provided
    if (category) {
      query.category = category;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await CourseModel.countDocuments(query);

    const courses = await CourseModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select(
        "title description plans discount thumbnail enrolledCount reviews totalRatings slug category audience"
      )
      .populate("instructor", "fullName profilePicture")
      .lean();

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      courses,
      total,
      page,
      totalPages,
    };
  } catch (error) {
    console.error("Database error in getAllCourses:", error);
    throw new AppError("Failed to fetch courses from database", 500);
  }
};

/**
 * Get a course using slug
 * @param slug - Unique identifier for the course
 * @returns Promise<{course: Course}>
 */
export const getCourseUsingSlug = async (
  slug: string
): Promise<Course | null> => {
  try {
    const course = await CourseModel.findOne({ slug, isActive: true })
      .populate("instructor", "-__v -refreshToken -_id")
      .populate("modules", "-__v -_id")
      .populate("lessonIds", "-__v -_id")
      .populate("contentIds", "-__v -_id")
      .lean();
    return course;
  } catch (error) {
    console.error("Database error in getCourseUsingSlug:", error);
    throw new AppError("Failed to fetch course from database", 500);
  }
};

/**
 * Get a course by ID
 * @param courseId - Course ID
 * @param requireActive - Whether to require the course to be active (default: true)
 * @returns Promise<Course | null>
 */
export const getCourseById = async (
  courseId: string,
  requireActive: boolean = true
): Promise<Course | null> => {
  try {
    // Validate courseId format
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new AppError("Invalid course ID format", 400);
    }

    const query: any = { _id: courseId };
    if (requireActive) {
      query.isActive = true;
    }

    const course = await CourseModel.findOne(query)
      .populate("instructor", "-__v -refreshToken")
      .populate("modules", "-__v")
      .lean();
    
    return course;
  } catch (error) {
    console.error("Database error in getCourseById:", error);
    throw new AppError("Failed to fetch course from database", 500);
  }
};

export const getCoursesUsingCategory = async (
  category: string
): Promise<Course[]> => {
  try {
    if (!category) {
      throw new AppError("Category is required", 400);
    }
    const courses = await CourseModel.find({
      category: { $regex: new RegExp(category, "i") },
      isActive: true,
    })
      .select(
        "title plans discount thumbnail enrolledCount reviews totalRatings slug category"
      )
      .populate("instructor", "fullName profilePicture")
      .lean();
    return courses;
  } catch (error) {
    console.error("Database error in getCoursesUsingCategory:", error);
    throw new AppError("Failed to fetch courses from database", 500);
  }
};

export const getFeaturedCourses = async (): Promise<Course[] | null> => {
  try {
    const courses = await CourseModel.find({
      isActive: true,
    })
      .select(
        "title plans discount thumbnail enrolledCount reviews totalRatings slug"
      )
      .populate("instructor", "fullName profilePicture")
      .lean();
    return courses;
  } catch (error) {
    console.error("Database error in getFeaturedCourses:", error);
    throw new AppError("Failed to fetch courses from database", 500);
  }
};

export const getCoursesUsingAudience = async (
  audience: string
): Promise<Course[] | null> => {
  try {
    if (!audience) {
      throw new AppError("Audience is required", 400);
    }
    const courses = await CourseModel.find({
      audience: { $regex: new RegExp(audience, "i") },
      isActive: true,
    })
      .select(
        "title plans discount thumbnail enrolledCount reviews totalRatings slug"
      )
      .populate("instructor", "fullName profilePicture")
      .lean();
    return courses;
  } catch (error) {
    console.error("Database error in getCoursesUsingAudience:", error);
    throw new AppError("Failed to fetch courses from database", 500);
  }
};

export const CreateCourseMetadata = async (course: Partial<Course>) => {
  try {
    const { modules, reviews, faqs, testimonials, ...courseMetadata } = course;

    // Generate slug from title if not provided
    let slug = courseMetadata.slug;
    if (!slug && courseMetadata.title) {
      slug = courseMetadata.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .trim();
      
      // Ensure slug is unique
      let baseSlug = slug;
      let counter = 1;
      while (await CourseModel.findOne({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Set default values for required fields if not provided
    const courseData = {
      ...courseMetadata,
      slug,
      moduleIds: [],
      isActive: true,
      // Set defaults for required fields
      createdBy: courseMetadata.createdBy || "admin", // Temporary default
      audience: courseMetadata.audience || "college-students",
      language: courseMetadata.language || "en",
    };

    const newCourse = new CourseModel(courseData);

    await newCourse.validate();
    await newCourse.save();

    return {
      success: true,
      courseId: newCourse._id,
      message: "Course metadata created successfully",
    };
  } catch (error) {
    console.error("Database error in CreateCourseMetadata:", error);
    
    // Provide more specific error messages for validation errors
    if (error instanceof Error && (error as any).name === 'ValidationError') {
      const validationErrors = Object.keys((error as any).errors).map(field => 
        `${field}: ${(error as any).errors[field].message}`
      ).join(', ');
      throw new AppError(`Validation failed: ${validationErrors}`, 400);
    }
    
    if ((error as any).code === 11000) {
      const duplicateField = Object.keys((error as any).keyPattern)[0];
      throw new AppError(`${duplicateField} already exists. Please use a different ${duplicateField}.`, 400);
    }
    
    throw new AppError("Failed to create course metadata", 500);
  }
};

/**
 * Updates course metadata (basic information) excluding modules, reviews, and complex nested data
 * @param courseId - The ID of the course to update
 * @param updateData - Partial course data to update
 * @returns Promise<{success: boolean, message: string}>
 */
export const UpdateCourseMetadata = async (
  courseId: string,
  updateData: Partial<Course>
): Promise<{ success: boolean; message: string }> => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();

    // Validate courseId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new AppError("Invalid course ID format", 400);
    }

    // Validate input data
    if (!updateData || Object.keys(updateData).length === 0) {
      throw new AppError("No update data provided", 400);
    }

    // Exclude fields that shouldn't be updated via metadata update
    const {
      _id,
      modules,
      moduleIds,
      reviews,
      faqs,
      testimonials,
      createdAt,
      createdBy,
      analytics,
      ...allowedUpdateData
    } = updateData;

    // Validate that we have at least one field to update after exclusions
    if (Object.keys(allowedUpdateData).length === 0) {
      throw new AppError("No valid fields provided for update", 400);
    }

    // Validate specific fields if provided
    if (allowedUpdateData.title && typeof allowedUpdateData.title !== 'string') {
      throw new AppError("Title must be a string", 400);
    }

    if (allowedUpdateData.title && allowedUpdateData.title.trim().length < 3) {
      throw new AppError("Title must be at least 3 characters long", 400);
    }

    if (allowedUpdateData.description && typeof allowedUpdateData.description !== 'string') {
      throw new AppError("Description must be a string", 400);
    }

    if (allowedUpdateData.category && typeof allowedUpdateData.category !== 'string') {
      throw new AppError("Category must be a string", 400);
    }

    if (allowedUpdateData.audience && !['college-students', 'professionals'].includes(allowedUpdateData.audience)) {
      throw new AppError("Audience must be either 'college-students' or 'professionals'", 400);
    }

    if (allowedUpdateData.skillLevel && typeof allowedUpdateData.skillLevel !== 'string') {
      throw new AppError("Skill level must be a string", 400);
    }

    if (allowedUpdateData.language && typeof allowedUpdateData.language !== 'string') {
      throw new AppError("Language must be a string", 400);
    }

    if (allowedUpdateData.skills && !Array.isArray(allowedUpdateData.skills)) {
      throw new AppError("Skills must be an array", 400);
    }

    if (allowedUpdateData.tags && !Array.isArray(allowedUpdateData.tags)) {
      throw new AppError("Tags must be an array", 400);
    }

    if (allowedUpdateData.isActive !== undefined && typeof allowedUpdateData.isActive !== 'boolean') {
      throw new AppError("isActive must be a boolean", 400);
    }

    if (allowedUpdateData.isFeatured !== undefined && typeof allowedUpdateData.isFeatured !== 'boolean') {
      throw new AppError("isFeatured must be a boolean", 400);
    }

    if (allowedUpdateData.isCertified !== undefined && typeof allowedUpdateData.isCertified !== 'boolean') {
      throw new AppError("isCertified must be a boolean", 400);
    }

    // Check if course exists and get current version for optimistic locking
    const existingCourse = await CourseModel.findById(courseId)
      .select("_id updatedAt")
      .session(session)
      .lean();

    if (!existingCourse) {
      throw new AppError("Course not found", 404);
    }

    // Prepare update data with timestamp
    const updatePayload = {
      ...allowedUpdateData,
      updatedAt: new Date(),
    };

    // Perform the update with optimistic locking
    const updateResult = await CourseModel.updateOne(
      { 
        _id: courseId,
        updatedAt: existingCourse.updatedAt // Optimistic locking
      },
      { $set: updatePayload },
      { 
        session,
        runValidators: true
      }
    );

    // Check if update was successful (document was found and modified)
    if (updateResult.matchedCount === 0) {
      throw new AppError("Course not found or has been modified by another process", 409);
    }

    if (updateResult.modifiedCount === 0) {
      throw new AppError("No changes were made to the course", 400);
    }

    await session.commitTransaction();

    return {
      success: true,
      message: "Course metadata updated successfully",
    };
  } catch (error) {
    await session.abortTransaction();
    
    if (error instanceof AppError) {
      throw error;
    }
    
    console.error("Database error in UpdateCourseMetadata:", error);
    throw new AppError("Failed to update course metadata", 500);
  } finally {
    await session.endSession();
  }
};

export const CreateCourseModule = async (courseData: {
  courseId: string;
  modules: {
    title: string;
    description?: string;
    thumbnailUrl?: string;
    lessons: {
      title: string;
      description?: string;
      contents: {
        title: string;
        description?: string;
        type: "video" | "quiz";
        // Video content fields
        sources?: {
          quality: "1080p" | "720p" | "480p" | "360p";
          videoUrl: string;
        }[];
        thumbnailUrl?: string;
        duration?: number;
        // Quiz content fields
        questions?: {
          question: string;
          options: string[];
          correctAnswer: string[];
          timeLimit?: number;
        }[];
        passingScore?: number;
        maxAttempts?: number;
        // Common fields
        readingMaterials?: {
          content: "pdf" | "docx";
          estimatedReadTime: number;
          downloadUrl?: string;
        }[];
        isLocked?: boolean;
      }[];
      isLocked?: boolean;
    }[];
    isLocked?: boolean;
    isActive?: boolean;
  }[];
}) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(
      async () => {
        const { courseId, modules } = courseData;

        // Atomically validate course exists and get current module count with proper locking
        const courseUpdate = await CourseModel.findOneAndUpdate(
          { _id: courseId },
          { $setOnInsert: { modules: [] } }, // Ensure modules array exists
          {
            session,
            upsert: false, // Don't create if not exists
            new: false, // Return original document to get current state
            select: "_id modules",
            runValidators: true,
          }
        );

        if (!courseUpdate) {
          throw new AppError("Course not found", 404);
        }

        // Get current module count from the locked document
        const currentModuleCount = courseUpdate.modules?.length || 0;

        // Step 1: Batch create all lesson contents first
        const allContents: any[] = [];
        const contentIndexMap = new Map<string, number>();
        let contentIndex = 0;

        modules.forEach((module, moduleIndex) => {
          module.lessons.forEach((lesson, lessonIndex) => {
            lesson.contents.forEach((content, contentIdx) => {
              const contentKey = `${moduleIndex}-${lessonIndex}-${contentIdx}`;
              contentIndexMap.set(contentKey, contentIndex++);

              const baseContent = {
                title: content.title,
                description: content.description || "",
                type: content.type,
                readingMaterials: content.readingMaterials || [],
                isLocked: content.isLocked || false,
                // Add unique identifier to prevent duplicates
                tempId: `${courseId}-${moduleIndex}-${lessonIndex}-${contentIdx}-${Date.now()}`,
              };

              if (content.type === "video") {
                allContents.push({
                  ...baseContent,
                  sources: content.sources || [],
                  thumbnailUrl: content.thumbnailUrl,
                  duration: content.duration || 0,
                });
              } else if (content.type === "quiz") {
                allContents.push({
                  ...baseContent,
                  questions: content.questions || [],
                  passingScore: content.passingScore || 70,
                  maxAttempts: content.maxAttempts || 3,
                });
              }
            });
          });
        });

        // Use ordered: false for better performance and partial success handling
        const createdContents =
          allContents.length > 0
            ? await ContentModel.insertMany(allContents, {
                session,
                ordered: false,
              })
            : [];
        console.log(`✅ Created ${createdContents.length} lesson contents`);

        // Step 2: Batch create all lessons with content IDs
        const allLessons: any[] = [];
        const lessonIndexMap = new Map<string, number>();
        let lessonIndex = 0;

        modules.forEach((module, moduleIndex) => {
          module.lessons.forEach((lesson, lessonIdx) => {
            const lessonKey = `${moduleIndex}-${lessonIdx}`;
            lessonIndexMap.set(lessonKey, lessonIndex++);

            // Get content IDs for this lesson
            const contentIds = lesson.contents.map((_, contentIdx) => {
              const contentKey = `${moduleIndex}-${lessonIdx}-${contentIdx}`;
              const contentIndex = contentIndexMap.get(contentKey)!;
              return createdContents[contentIndex]._id;
            });

            allLessons.push({
              title: lesson.title,
              description: lesson.description || "",
              contentIds,
              isLocked: lesson.isLocked || false,
              // Add unique identifier to prevent duplicates
              tempId: `${courseId}-${moduleIndex}-${lessonIdx}-${Date.now()}`,
            });
          });
        });

        // Batch insert all lessons
        const createdLessons =
          allLessons.length > 0
            ? await CourseLessonModel.insertMany(allLessons, {
                session,
                ordered: false,
              })
            : [];
        console.log(`✅ Created ${createdLessons.length} lessons`);

        // Step 3: Batch create all modules with lesson IDs
        const allModules = modules.map((module, moduleIndex) => {
          // Get lesson IDs for this module
          const lessonIds = module.lessons.map((_, lessonIdx) => {
            const lessonKey = `${moduleIndex}-${lessonIdx}`;
            const lessonIndex = lessonIndexMap.get(lessonKey)!;
            return createdLessons[lessonIndex]._id;
          });

          return {
            title: module.title,
            description: module.description || "",
            thumbnailUrl: module.thumbnailUrl || "",
            lessonIds,
            isLocked: module.isLocked || false,
            isActive: module.isActive !== false, // default to true
            // Add unique identifier and ordering to prevent duplicates
            tempId: `${courseId}-${moduleIndex}-${Date.now()}`,
            order: currentModuleCount + moduleIndex,
          };
        });

        // Batch insert all modules
        const createdModules =
          allModules.length > 0
            ? await CourseModuleModel.insertMany(allModules, {
                session,
                ordered: false,
              })
            : [];
        console.log(`✅ Created ${createdModules.length} modules`);

        // Step 4: Atomically update course with new module IDs using proper locking
        const moduleIds = createdModules.map((module) => module._id);

        if (moduleIds.length > 0) {
          const updateResult = await CourseModel.findOneAndUpdate(
            {
              _id: courseId,
              // Ensure we're updating the same document state we locked earlier
              $expr: {
                $eq: [
                  { $size: { $ifNull: ["$modules", []] } },
                  currentModuleCount,
                ],
              },
            },
            {
              $push: {
                modules: {
                  $each: moduleIds,
                  $position: currentModuleCount, // Maintain order consistency
                },
              },
              $set: { updatedAt: new Date() },
            },
            {
              session,
              new: true,
              runValidators: true,
            }
          );

          if (!updateResult) {
            throw new AppError(
              "Failed to update course - concurrent modification detected. Please retry.",
              409
            );
          }
        }
        console.log(`✅ Updated course with ${moduleIds.length} new modules`);

        return {
          success: true,
          message: `Successfully created ${createdModules.length} modules with ${createdLessons.length} lessons and ${createdContents.length} contents`,
          data: {
            moduleIds,
            modules: createdModules,
            totalContents: createdContents.length,
            totalLessons: createdLessons.length,
            totalModules: createdModules.length,
          },
        };
      },
      {
        // Transaction options for better isolation
        readConcern: { level: "majority" },
        writeConcern: { w: "majority", j: true },
        maxCommitTimeMS: 30000, // 30 second timeout
      }
    );

    return {
      success: true,
      message: "Course modules created successfully",
      moduleIds: [],
    };
  } catch (error) {
    if (error instanceof mongoose.Error.VersionError) {
      throw new AppError(
        "Course was modified by another process. Please retry.",
        409
      );
    }

    if (error instanceof mongoose.Error.ValidationError) {
      throw new AppError(`Validation error: ${error.message}`, 400);
    }

    console.error("Database error in CreateCourseModule:", error);
    throw new AppError(
      error instanceof AppError
        ? error.message
        : "Failed to create course modules",
      error instanceof AppError ? error.statusCode : 500
    );
  } finally {
    await session.endSession();
  }
};

/**
 * Updates existing course modules, lessons, and content
 * Handles creation of new items, updates to existing items, and deletion of removed items
 * @param courseId - The course ID to update
 * @param courseData - Array of modules with their lessons and content
 * @returns Promise<void>
 */
export const UpdateCourseModule = async (
  courseId: string,
  courseData: CourseModule[]
): Promise<void> => {
  // Input validation
  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    throw new AppError("Invalid course ID", 400);
  }
  if (!Array.isArray(courseData) || courseData.length === 0) {
    throw new AppError("Course data must be a non-empty array", 400);
  }

  const MAX_RETRIES = 3;
  const BASE_DELAY = 100; // ms

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const session = await mongoose.startSession();

    try {
      await executeUpdate(courseId, courseData, session);
      return; // Success, exit retry loop
    } catch (error) {
      await session.endSession();

      // Check if it's a retryable error (race condition)
      const isRetryable =
        error instanceof mongoose.Error.VersionError ||
        (error instanceof AppError && error.statusCode === 409);

      if (!isRetryable || attempt === MAX_RETRIES) {
        throw error; // Not retryable or max retries reached
      }

      // Exponential backoff with jitter
      const delay = BASE_DELAY * Math.pow(2, attempt - 1) + Math.random() * 50;
      await new Promise((resolve) => setTimeout(resolve, delay));

      console.log(
        `⚠️ Retry attempt ${attempt}/${MAX_RETRIES} for course ${courseId}`
      );
    }
  }
};

// Helper function to process individual content items
const processContentItem = (
  content: any,
  tempKey: string,
  contentMap: Map<string, any>,
  contentIdMapping: Map<string, string>,
  updateItems: any[],
  createItems: any[],
  deleteIds: Set<string>,
  courseId: string
): void => {
  if (content._id && contentMap.has(content._id)) {
    // Existing content - update
    const updateData: any = {
      title: content.title,
      description: content.description || "",
      type: content.type,
      readingMaterials: content.readingMaterials || [],
      isLocked: content.isLocked || false,
    };

    // Add type-specific fields
    if (content.type === "video") {
      Object.assign(updateData, {
        sources: content.sources || [],
        thumbnailUrl: content.thumbnailUrl,
        duration: content.duration || 0,
      });
    } else if (content.type === "quiz") {
      Object.assign(updateData, {
        questions: content.questions || [],
        passingScore: content.passingScore || 70,
        maxAttempts: content.maxAttempts || 3,
      });
    }

    updateItems.push({
      filter: { _id: content._id },
      update: updateData,
    });
    contentIdMapping.set(tempKey, content._id);
    deleteIds.delete(content._id);
  } else {
    // New content - create
    const newContent: any = {
      title: content.title,
      description: content.description || "",
      type: content.type,
      readingMaterials: content.readingMaterials || [],
      isLocked: content.isLocked || false,
      courseId,
      tempId: `${courseId}-${tempKey}-${Date.now()}`,
      tempKey,
    };

    // Add type-specific fields
    if (content.type === "video") {
      Object.assign(newContent, {
        sources: content.sources || [],
        thumbnailUrl: content.thumbnailUrl,
        duration: content.duration || 0,
      });
    } else if (content.type === "quiz") {
      Object.assign(newContent, {
        questions: content.questions || [],
        passingScore: content.passingScore || 70,
        maxAttempts: content.maxAttempts || 3,
      });
    }

    createItems.push(newContent);
  }
};

const executeUpdate = async (
  courseId: string,
  courseData: CourseModule[],
  session: mongoose.ClientSession
): Promise<void> => {
  try {
    await session.withTransaction(
      async () => {
        // Atomically validate course exists and get current state with version for optimistic locking
        const courseUpdate = await CourseModel.findOneAndUpdate(
          { _id: courseId },
          { $setOnInsert: { modules: [] } },
          {
            session,
            upsert: false,
            new: false,
            select: "_id modules __v",
            runValidators: true,
          }
        );

        const currentVersion = courseUpdate?.__v || 0;

        if (!courseUpdate) {
          throw new AppError("Course not found", 404);
        }

        const existingModuleIds = courseUpdate.modules || [];

        // Get existing data with lean queries for better memory efficiency
        const [existingModules, existingLessons, existingContent] =
          await Promise.all([
            CourseModuleModel.find({ _id: { $in: existingModuleIds } })
              .lean()
              .session(session),
            CourseLessonModel.find({ courseId }).lean().session(session),
            ContentModel.find({ courseId }).lean().session(session),
          ]);

        // Create maps for quick lookup
        const moduleMap = new Map(
          existingModules.map((m) => [m._id.toString(), m])
        );
        const lessonMap = new Map(
          existingLessons.map((l) => [l._id.toString(), l])
        );
        const contentMap = new Map(
          existingContent.map((c) => [c._id.toString(), c])
        );

        // Track items for operations
        const itemsToCreate = {
          contents: [] as any[],
          lessons: [] as any[],
          modules: [] as any[],
        };
        const itemsToUpdate = {
          contents: [] as any[],
          lessons: [] as any[],
          modules: [] as any[],
        };
        const itemsToDelete = {
          contentIds: new Set(existingContent.map((c) => c._id.toString())),
          lessonIds: new Set(existingLessons.map((l) => l._id.toString())),
          moduleIds: new Set(existingModules.map((m) => m._id.toString())),
        };

        // Process content in batches to reduce memory usage
        const contentIdMapping = new Map<string, string>(); // temp key -> actual _id
        const BATCH_SIZE = 50; // Process in smaller batches

        // Flatten all content for batch processing
        const allContentItems: Array<{
          content: any;
          tempKey: string;
          moduleIndex: number;
          lessonIndex: number;
          contentIndex: number;
        }> = [];

        courseData.forEach((module: CourseModule, moduleIndex) => {
          if (!module.lessons) return;
          module.lessons.forEach((lesson, lessonIndex) => {
            if (!lesson.contents) return;
            lesson.contents.forEach((content, contentIndex) => {
              allContentItems.push({
                content,
                tempKey: `${moduleIndex}-${lessonIndex}-${contentIndex}`,
                moduleIndex,
                lessonIndex,
                contentIndex,
              });
            });
          });
        });

        // Process content in batches using helper function
        for (let i = 0; i < allContentItems.length; i += BATCH_SIZE) {
          const batch = allContentItems.slice(i, i + BATCH_SIZE);

          batch.forEach(({ content, tempKey }) => {
            processContentItem(
              content,
              tempKey,
              contentMap,
              contentIdMapping,
              itemsToUpdate.contents,
              itemsToCreate.contents,
              itemsToDelete.contentIds,
              courseId
            );
          });
        }

        // Batch create new content in chunks to manage memory
        let createdContents: any[] = [];
        if (itemsToCreate.contents.length > 0) {
          for (let i = 0; i < itemsToCreate.contents.length; i += BATCH_SIZE) {
            const chunk = itemsToCreate.contents.slice(i, i + BATCH_SIZE);
            const chunkResults = await ContentModel.insertMany(chunk, {
              session,
              ordered: false,
            });
            createdContents.push(...chunkResults);

            // Map created content IDs immediately to free memory
            chunkResults.forEach((content: any) => {
              if (content.tempKey) {
                contentIdMapping.set(content.tempKey, content._id.toString());
              }
            });
          }
        }

        // Batch update existing content using bulkWrite
        if (itemsToUpdate.contents.length > 0) {
          const contentBulkOps = itemsToUpdate.contents.map(
            ({ filter, update }) => ({
              updateOne: {
                filter,
                update: { $set: update },
                upsert: false,
              },
            })
          );
          await ContentModel.bulkWrite(contentBulkOps, {
            session,
            ordered: false,
          });
        }

        // Process lessons
        const lessonIdMapping = new Map<string, string>();

        courseData.forEach((module, moduleIndex) => {
          if (!module.lessons) return;
          module.lessons.forEach((lesson, lessonIndex) => {
            const tempKey = `${moduleIndex}-${lessonIndex}`;

            // Get content IDs for this lesson
            const contentIds = (lesson.contents || [])
              .map((_, contentIndex) => {
                const contentTempKey = `${moduleIndex}-${lessonIndex}-${contentIndex}`;
                return contentIdMapping.get(contentTempKey);
              })
              .filter(Boolean);

            if (lesson._id && lessonMap.has(lesson._id)) {
              // Existing lesson - update
              itemsToUpdate.lessons.push({
                filter: { _id: lesson._id },
                update: {
                  title: lesson.title,
                  description: lesson.description || "",
                  contentIds,
                  isLocked: lesson.isLocked || false,
                },
              });
              lessonIdMapping.set(tempKey, lesson._id);
              itemsToDelete.lessonIds.delete(lesson._id);
            } else {
              // New lesson - create
              itemsToCreate.lessons.push({
                title: lesson.title,
                description: lesson.description || "",
                contentIds,
                isLocked: lesson.isLocked || false,
                courseId,
                tempId: `${courseId}-${tempKey}-${Date.now()}`,
                tempKey,
              });
            }
          });
        });

        // Batch create new lessons
        let createdLessons: any[] = [];
        if (itemsToCreate.lessons.length > 0) {
          createdLessons = await CourseLessonModel.insertMany(
            itemsToCreate.lessons,
            {
              session,
              ordered: false,
            }
          );

          // Map created lesson IDs
          createdLessons.forEach((lesson: any) => {
            if (lesson.tempKey) {
              lessonIdMapping.set(lesson.tempKey, lesson._id.toString());
            }
          });
        }

        // Batch update existing lessons using bulkWrite
        if (itemsToUpdate.lessons.length > 0) {
          const lessonBulkOps = itemsToUpdate.lessons.map(
            ({ filter, update }) => ({
              updateOne: {
                filter,
                update: { $set: update },
                upsert: false,
              },
            })
          );
          await CourseLessonModel.bulkWrite(lessonBulkOps, {
            session,
            ordered: false,
          });
        }

        // Process modules
        const finalModuleIds: string[] = [];

        courseData.forEach((module, moduleIndex) => {
          const tempKey = `${moduleIndex}`;

          // Get lesson IDs for this module
          const lessonIds = (module.lessons || [])
            .map((_, lessonIndex) => {
              const lessonTempKey = `${moduleIndex}-${lessonIndex}`;
              return lessonIdMapping.get(lessonTempKey);
            })
            .filter(Boolean);

          if (module._id && moduleMap.has(module._id)) {
            // Existing module - update
            itemsToUpdate.modules.push({
              filter: { _id: module._id },
              update: {
                title: module.title,
                description: module.description || "",
                thumbnailUrl: module.thumbnailUrl || "",
                lessonIds,
                isLocked: module.isLocked || false,
                isActive: module.isActive !== false,
                order: moduleIndex,
              },
            });
            finalModuleIds.push(module._id);
            itemsToDelete.moduleIds.delete(module._id);
          } else {
            // New module - create
            itemsToCreate.modules.push({
              title: module.title,
              description: module.description || "",
              thumbnailUrl: module.thumbnailUrl || "",
              lessonIds,
              isLocked: module.isLocked || false,
              isActive: module.isActive !== false,
              courseId,
              tempId: `${courseId}-${tempKey}-${Date.now()}`,
              order: moduleIndex,
            });
          }
        });

        // Batch create new modules
        let createdModules: any[] = [];
        if (itemsToCreate.modules.length > 0) {
          createdModules = await CourseModuleModel.insertMany(
            itemsToCreate.modules,
            {
              session,
              ordered: false,
            }
          );

          // Add new module IDs to final list
          createdModules.forEach((module: any) => {
            finalModuleIds.push(module._id.toString());
          });
        }

        // Batch update existing modules using bulkWrite
        if (itemsToUpdate.modules.length > 0) {
          const moduleBulkOps = itemsToUpdate.modules.map(
            ({ filter, update }) => ({
              updateOne: {
                filter,
                update: { $set: update },
                upsert: false,
              },
            })
          );
          await CourseModuleModel.bulkWrite(moduleBulkOps, {
            session,
            ordered: false,
          });
        }

        // Delete removed items
        const deletionPromises = [];

        if (itemsToDelete.contentIds.size > 0) {
          deletionPromises.push(
            ContentModel.deleteMany(
              { _id: { $in: Array.from(itemsToDelete.contentIds) } },
              { session }
            )
          );
        }

        if (itemsToDelete.lessonIds.size > 0) {
          deletionPromises.push(
            CourseLessonModel.deleteMany(
              { _id: { $in: Array.from(itemsToDelete.lessonIds) } },
              { session }
            )
          );
        }

        if (itemsToDelete.moduleIds.size > 0) {
          deletionPromises.push(
            CourseModuleModel.deleteMany(
              { _id: { $in: Array.from(itemsToDelete.moduleIds) } },
              { session }
            )
          );
        }

        if (deletionPromises.length > 0) {
          await Promise.all(deletionPromises);
        }

        // Update course with final module IDs using optimistic locking
        const updateResult = await CourseModel.findOneAndUpdate(
          {
            _id: courseId,
            __v: currentVersion, // Optimistic locking check
          },
          {
            $set: {
              modules: finalModuleIds,
              updatedAt: new Date(),
            },
            $inc: { __v: 1 }, // Increment version
          },
          {
            session,
            new: true,
            runValidators: true,
          }
        );

        if (!updateResult) {
          throw new AppError(
            "Failed to update course - concurrent modification detected. Please retry.",
            409
          );
        }

        console.log(`✅ Updated course with ${finalModuleIds.length} modules`);
        console.log(
          `✅ Created: ${createdModules.length} modules, ${createdLessons.length} lessons, ${createdContents.length} contents`
        );
        console.log(
          `✅ Updated: ${itemsToUpdate.modules.length} modules, ${itemsToUpdate.lessons.length} lessons, ${itemsToUpdate.contents.length} contents`
        );
        console.log(
          `✅ Deleted: ${itemsToDelete.moduleIds.size} modules, ${itemsToDelete.lessonIds.size} lessons, ${itemsToDelete.contentIds.size} contents`
        );
      },
      {
        readConcern: { level: "majority" },
        writeConcern: { w: "majority", j: true },
        maxCommitTimeMS: 30000,
      }
    );
  } catch (error) {
    if (error instanceof mongoose.Error.VersionError) {
      throw new AppError(
        "Course was modified by another process. Please retry.",
        409
      );
    }

    if (error instanceof mongoose.Error.ValidationError) {
      throw new AppError(`Validation error: ${error.message}`, 400);
    }

    throw new AppError(
      `Failed to update course modules: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  } finally {
    await session.endSession();
  }
};
