import { Course } from "@/types";

// ===================
// Course Data Sanitization Utility
// ===================

/**
 * Frontend-only fields that should be removed before sending to backend
 */
const FRONTEND_ONLY_FIELDS = [
  'thumbnailSource',
  'thumbnailS3Key', 
  'previewVideoSource',
  'previewVideoS3Key',
  'curriculumSource',
  'curriculumS3Key'
] as const;

/**
 * Frontend-only fields for nested objects
 */
const NESTED_FRONTEND_ONLY_FIELDS = {
  module: ['thumbnailSource', 'thumbnailS3Key'],
  videoContent: ['thumbnailSource', 'thumbnailS3Key'],
  videoSource: ['videoSource', 'videoS3Key']
} as const;

/**
 * Sanitizes course data by removing frontend-only fields before sending to backend
 * 
 * @param course - The course object from frontend state
 * @returns Clean course object safe for backend submission
 */
export const sanitizeCourseForBackend = (course: Course): Omit<Course, typeof FRONTEND_ONLY_FIELDS[number]> => {
  // Create a copy of the course object
  const sanitizedCourse = { ...course };
  
  // Remove frontend-only fields
  FRONTEND_ONLY_FIELDS.forEach(field => {
    if (field in sanitizedCourse) {
      delete (sanitizedCourse as any)[field];
    }
  });
  
  // Clean nested structures (modules, lessons, contents)
  if (sanitizedCourse.modules) {
    sanitizedCourse.modules = sanitizedCourse.modules.map(module => {
      const cleanModule = { ...module };
      
      // Remove frontend-only fields from module
      NESTED_FRONTEND_ONLY_FIELDS.module.forEach(field => {
        if (field in cleanModule) {
          delete (cleanModule as any)[field];
        }
      });
      
      // Clean lessons within modules
      if (cleanModule.lessons) {
        cleanModule.lessons = cleanModule.lessons.map(lesson => {
          const cleanLesson = { ...lesson };
          
          // Clean contents within lessons
          if (cleanLesson.contents) {
            cleanLesson.contents = cleanLesson.contents.map(content => {
              const cleanContent = { ...content };
              
              // Clean video content fields
              if (content.type === 'video') {
                const videoContent = cleanContent as any; // Cast to access video-specific properties
                
                // Remove thumbnail source tracking
                NESTED_FRONTEND_ONLY_FIELDS.videoContent.forEach(field => {
                  if (field in videoContent) {
                    delete videoContent[field];
                  }
                });
                
                // Clean video sources
                if (videoContent.sources) {
                  videoContent.sources = videoContent.sources.map((source: any) => {
                    const cleanSource = { ...source };
                    NESTED_FRONTEND_ONLY_FIELDS.videoSource.forEach(field => {
                      if (field in cleanSource) {
                        delete cleanSource[field];
                      }
                    });
                    return cleanSource;
                  });
                }
              }
              
              return cleanContent;
            });
          }
          
          return cleanLesson;
        });
      }
      
      return cleanModule;
    });
  }
  
  // Ensure discount object has proper structure if it exists
  if (sanitizedCourse.discount) {
    // Ensure isActive is preserved
    if (sanitizedCourse.discount.isActive === undefined) {
      sanitizedCourse.discount.isActive = false;
    }
  }
  
  // Log what fields were removed for debugging
  const removedFields = FRONTEND_ONLY_FIELDS.filter(field => field in course);
  if (removedFields.length > 0) {
    console.log(`🧹 Sanitized course data: Removed frontend-only fields: ${removedFields.join(', ')}`);
  }
  
  return sanitizedCourse;
};

/**
 * Validates that the sanitized course data doesn't contain frontend-only fields
 * 
 * @param course - Course object to validate
 * @returns True if course is clean, false if it contains frontend-only fields
 */
export const validateSanitizedCourse = (course: any): boolean => {
  const foundFrontendFields = FRONTEND_ONLY_FIELDS.filter(field => field in course);
  
  if (foundFrontendFields.length > 0) {
    console.error(`❌ Course data validation failed: Found frontend-only fields: ${foundFrontendFields.join(', ')}`);
    return false;
  }
  
  return true;
};

/**
 * Type guard to ensure the course object is properly sanitized
 */
export type SanitizedCourse = Omit<Course, typeof FRONTEND_ONLY_FIELDS[number]>;

/**
 * Helper function to safely get media URLs without the source metadata
 */
export const getCleanMediaUrls = (course: Course) => ({
  thumbnail: course.thumbnail,
  previewVideoUrl: course.previewVideoUrl,
  // Note: Source and S3 key information is intentionally excluded
});

/**
 * Sanitizes backend course data for frontend use
 * Converts nested structures back to frontend format
 * 
 * @param course - The course object from backend
 * @returns Course object formatted for frontend state
 */
export const sanitizeCourseForFrontend = (course: any): any => {
  const sanitizedCourse = { ...course };
  
  // Convert string dates to Date objects
  if (typeof sanitizedCourse.createdAt === 'string') {
    sanitizedCourse.createdAt = new Date(sanitizedCourse.createdAt);
  }
  if (typeof sanitizedCourse.updatedAt === 'string') {
    sanitizedCourse.updatedAt = new Date(sanitizedCourse.updatedAt);
  }
  
  // Convert discount dates to Date objects if they exist
  if (sanitizedCourse.discount?.startDate && typeof sanitizedCourse.discount.startDate === 'string') {
    sanitizedCourse.discount.startDate = new Date(sanitizedCourse.discount.startDate);
  }
  if (sanitizedCourse.discount?.endDate && typeof sanitizedCourse.discount.endDate === 'string') {
    sanitizedCourse.discount.endDate = new Date(sanitizedCourse.discount.endDate);
  }
  
  return sanitizedCourse;
};

export default {
  sanitizeCourseForBackend,
  sanitizeCourseForFrontend,
  validateSanitizedCourse,
  getCleanMediaUrls,
  FRONTEND_ONLY_FIELDS
};
