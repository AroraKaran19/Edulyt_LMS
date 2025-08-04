// Utility functions for generating S3 folder names based on context

export type UploadType = 
  | 'course-thumbnail' 
  | 'course-video' 
  | 'course-material'
  | 'instructor-image'
  | 'instructor-document'
  | 'lesson-video'
  | 'lesson-material'
  | 'user-profile'
  | 'assignment-submission'
  | 'certificate'
  | 'general';

export interface FolderContext {
  uploadType: UploadType;
  courseId?: string;
  instructorId?: string;
  lessonId?: string;
  userId?: string;
  moduleId?: string;
  assignmentId?: string;
  timestamp?: boolean; // Add timestamp to folder name
}

/**
 * Generate course-based folder name from course title
 * @param courseTitle - Course title to convert to folder name
 * @param contentType - Type of content (thumbnails, videos, materials, etc.)
 * @returns Generated folder path
 */
export const generateCourseFolderName = (courseTitle: string, contentType: string): string => {
  // Sanitize course title to create a valid folder name
  const sanitizedTitle = courseTitle
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special characters except spaces, hyphens, and underscores
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-{2,}/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length to 50 characters
  
  return `${sanitizedTitle}/${contentType}`;
};

/**
 * Generate S3 folder name based on upload type and context
 * @param context - Context information for folder generation
 * @returns Generated folder path
 */
export const generateFolderName = (context: FolderContext): string => {
  const { uploadType, courseId, instructorId, lessonId, userId, moduleId, assignmentId, timestamp } = context;
  
  let folderPath = '';
  
  switch (uploadType) {
    case 'course-thumbnail':
      folderPath = 'courses/thumbnails';
      if (courseId) folderPath += `/${courseId}`;
      break;
      
    case 'course-video':
      folderPath = 'courses/videos';
      if (courseId) folderPath += `/${courseId}`;
      break;
      
    case 'course-material':
      folderPath = 'courses/materials';
      if (courseId) folderPath += `/${courseId}`;
      if (moduleId) folderPath += `/module-${moduleId}`;
      break;
      
    case 'instructor-image':
      folderPath = 'instructors/images';
      if (instructorId) folderPath += `/${instructorId}`;
      break;
      
    case 'instructor-document':
      folderPath = 'instructors/documents';
      if (instructorId) folderPath += `/${instructorId}`;
      break;
      
    case 'lesson-video':
      folderPath = 'lessons/videos';
      if (courseId) folderPath += `/${courseId}`;
      if (lessonId) folderPath += `/${lessonId}`;
      break;
      
    case 'lesson-material':
      folderPath = 'lessons/materials';
      if (courseId) folderPath += `/${courseId}`;
      if (lessonId) folderPath += `/${lessonId}`;
      break;
      
    case 'user-profile':
      folderPath = 'users/profiles';
      if (userId) folderPath += `/${userId}`;
      break;
      
    case 'assignment-submission':
      folderPath = 'assignments/submissions';
      if (courseId) folderPath += `/${courseId}`;
      if (assignmentId) folderPath += `/${assignmentId}`;
      if (userId) folderPath += `/${userId}`;
      break;
      
    case 'certificate':
      folderPath = 'certificates';
      if (courseId) folderPath += `/${courseId}`;
      if (userId) folderPath += `/${userId}`;
      break;
      
    case 'general':
    default:
      folderPath = 'general';
      if (userId) folderPath += `/${userId}`;
      break;
  }
  
  // Add timestamp if requested
  if (timestamp) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    folderPath += `/${dateStr}`;
  }
  
  return folderPath;
};

/**
 * Generate folder name for course-related uploads
 * @param courseId - Course ID
 * @param uploadType - Type of upload
 * @param additionalContext - Additional context (moduleId, lessonId, etc.)
 * @returns Generated folder path
 */
export const getCourseUploadFolder = (
  courseId: string, 
  uploadType: 'thumbnail' | 'video' | 'material', 
  additionalContext?: { moduleId?: string; lessonId?: string }
): string => {
  const context: FolderContext = {
    uploadType: `course-${uploadType}` as UploadType,
    courseId,
    ...additionalContext
  };
  return generateFolderName(context);
};

/**
 * Generate folder name for instructor-related uploads
 * @param instructorId - Instructor ID
 * @param uploadType - Type of upload
 * @returns Generated folder path
 */
export const getInstructorUploadFolder = (
  instructorId: string, 
  uploadType: 'image' | 'document'
): string => {
  const context: FolderContext = {
    uploadType: `instructor-${uploadType}` as UploadType,
    instructorId
  };
  return generateFolderName(context);
};

/**
 * Generate folder name for lesson-related uploads
 * @param courseId - Course ID
 * @param lessonId - Lesson ID
 * @param uploadType - Type of upload
 * @returns Generated folder path
 */
export const getLessonUploadFolder = (
  courseId: string,
  lessonId: string,
  uploadType: 'video' | 'material'
): string => {
  const context: FolderContext = {
    uploadType: `lesson-${uploadType}` as UploadType,
    courseId,
    lessonId
  };
  return generateFolderName(context);
};

/**
 * Generate folder name for user-related uploads
 * @param userId - User ID
 * @param uploadType - Type of upload
 * @param additionalContext - Additional context
 * @returns Generated folder path
 */
export const getUserUploadFolder = (
  userId: string,
  uploadType: 'profile' | 'assignment-submission' | 'certificate',
  additionalContext?: { courseId?: string; assignmentId?: string }
): string => {
  let folderUploadType: UploadType;
  
  switch (uploadType) {
    case 'profile':
      folderUploadType = 'user-profile';
      break;
    case 'assignment-submission':
      folderUploadType = 'assignment-submission';
      break;
    case 'certificate':
      folderUploadType = 'certificate';
      break;
    default:
      folderUploadType = 'general';
  }
  
  const context: FolderContext = {
    uploadType: folderUploadType,
    userId,
    ...additionalContext
  };
  return generateFolderName(context);
};

/**
 * Sanitize folder name to ensure it's valid for S3
 * @param folderName - Folder name to sanitize
 * @returns Sanitized folder name
 */
export const sanitizeFolderName = (folderName: string): string => {
  return folderName
    .replace(/[^a-zA-Z0-9\-_\/]/g, '-') // Replace invalid characters with dash
    .replace(/\/{2,}/g, '/') // Replace multiple slashes with single slash
    .replace(/^\/|\/$/g, '') // Remove leading/trailing slashes
    .toLowerCase();
};

// Example usage patterns:
/*
// Course thumbnail
const folder = getCourseUploadFolder('course-123', 'thumbnail');
// Result: "courses/thumbnails/course-123"

// Lesson video
const folder = getLessonUploadFolder('course-123', 'lesson-456', 'video');
// Result: "lessons/videos/course-123/lesson-456"

// User profile image
const folder = getUserUploadFolder('user-789', 'profile');
// Result: "users/profiles/user-789"

// Assignment submission
const folder = getUserUploadFolder('user-789', 'assignment-submission', {
  courseId: 'course-123',
  assignmentId: 'assignment-456'
});
// Result: "assignments/submissions/course-123/assignment-456/user-789"
*/