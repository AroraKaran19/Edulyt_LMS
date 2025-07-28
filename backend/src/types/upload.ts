// Upload Types and Folder Organization
// This file defines the folder structure for organizing files in AWS S3

export enum UploadFolderType {
  // Course-related uploads
  COURSE_PREVIEW_VIDEO = 'coursePreviewVideos',
  COURSE_CONTENT_VIDEO = 'courseContentVideos',
  COURSE_THUMBNAIL = 'courseThumbnails',
  COURSE_DOCUMENTS = 'courseDocuments',
  
  // Instructor-related uploads
  INSTRUCTOR_PROFILE_IMAGE = 'instructorProfileImages',
  INSTRUCTOR_VIDEOS = 'instructorVideos',
  
  // General uploads
  PROMOTIONAL_VIDEOS = 'promotionalVideos',
  TESTIMONIAL_VIDEOS = 'testimonialVideos',
  WEBINAR_RECORDINGS = 'webinarRecordings',
  
  // Large file uploads
  LARGE_COURSE_CONTENT_VIDEOS = 'largeCourseContentVideos',
  LARGE_DOCUMENTS = 'largeDocuments',
  COMPRESSED_FILES = 'compressedFiles',
  
  // Miscellaneous
  MISC_IMAGES = 'miscImages',
  MISC_VIDEOS = 'miscVideos',
  MISC_DOCUMENTS = 'miscDocuments'
}

export interface UploadMetadata {
  originalName: string;
  uploadType: string;
  folderType: UploadFolderType;
  uploadedAt: string;
  courseId?: string;
  courseName?: string;
  instructorId?: string;
  moduleId?: string;
  moduleTitle?: string;
  lessonId?: string;
  lessonTitle?: string;
}

export interface FolderConfig {
  folder: UploadFolderType;
  allowedMimeTypes: string[];
  maxFileSize?: number; // in bytes
  description: string;
}

// Configuration for different upload types
export const FOLDER_CONFIGS: Record<UploadFolderType, FolderConfig> = {
  [UploadFolderType.COURSE_PREVIEW_VIDEO]: {
    folder: UploadFolderType.COURSE_PREVIEW_VIDEO,
    allowedMimeTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'],
    maxFileSize: 500 * 1024 * 1024, // 500MB
    description: 'Course preview/promotional videos'
  },
  
  [UploadFolderType.COURSE_THUMBNAIL]: {
    folder: UploadFolderType.COURSE_THUMBNAIL,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    description: 'Course thumbnail images'
  },
  
  [UploadFolderType.COURSE_CONTENT_VIDEO]: {
    folder: UploadFolderType.COURSE_CONTENT_VIDEO,
    allowedMimeTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'],
    maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
    description: 'Course content/lesson videos'
  },
  
  [UploadFolderType.COURSE_DOCUMENTS]: {
    folder: UploadFolderType.COURSE_DOCUMENTS,
    allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxFileSize: 50 * 1024 * 1024, // 50MB
    description: 'Course-related documents and PDFs'
  },
  
  [UploadFolderType.INSTRUCTOR_PROFILE_IMAGE]: {
    folder: UploadFolderType.INSTRUCTOR_PROFILE_IMAGE,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    description: 'Instructor profile images'
  },
  
  [UploadFolderType.INSTRUCTOR_VIDEOS]: {
    folder: UploadFolderType.INSTRUCTOR_VIDEOS,
    allowedMimeTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'],
    maxFileSize: 200 * 1024 * 1024, // 200MB
    description: 'Instructor introduction/bio videos'
  },
  
  [UploadFolderType.PROMOTIONAL_VIDEOS]: {
    folder: UploadFolderType.PROMOTIONAL_VIDEOS,
    allowedMimeTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'],
    maxFileSize: 1 * 1024 * 1024 * 1024, // 1GB
    description: 'Marketing and promotional videos'
  },
  
  [UploadFolderType.TESTIMONIAL_VIDEOS]: {
    folder: UploadFolderType.TESTIMONIAL_VIDEOS,
    allowedMimeTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    description: 'Student testimonial videos'
  },
  
  [UploadFolderType.WEBINAR_RECORDINGS]: {
    folder: UploadFolderType.WEBINAR_RECORDINGS,
    allowedMimeTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'],
    maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
    description: 'Recorded webinar sessions'
  },
  
  [UploadFolderType.LARGE_COURSE_CONTENT_VIDEOS]: {
    folder: UploadFolderType.LARGE_COURSE_CONTENT_VIDEOS,
    allowedMimeTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'],
    description: 'Large course content videos (multipart upload)'
  },
  
  [UploadFolderType.LARGE_DOCUMENTS]: {
    folder: UploadFolderType.LARGE_DOCUMENTS,
    allowedMimeTypes: ['application/pdf', 'application/zip', 'application/x-zip-compressed'],
    description: 'Large documents and archives'
  },
  
  [UploadFolderType.COMPRESSED_FILES]: {
    folder: UploadFolderType.COMPRESSED_FILES,
    allowedMimeTypes: ['application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed'],
    description: 'Compressed archives and zip files'
  },
  
  [UploadFolderType.MISC_IMAGES]: {
    folder: UploadFolderType.MISC_IMAGES,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    maxFileSize: 20 * 1024 * 1024, // 20MB
    description: 'Miscellaneous images'
  },
  
  [UploadFolderType.MISC_VIDEOS]: {
    folder: UploadFolderType.MISC_VIDEOS,
    allowedMimeTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'],
    maxFileSize: 500 * 1024 * 1024, // 500MB
    description: 'Miscellaneous videos'
  },
  
  [UploadFolderType.MISC_DOCUMENTS]: {
    folder: UploadFolderType.MISC_DOCUMENTS,
    allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxFileSize: 50 * 1024 * 1024, // 50MB
    description: 'Miscellaneous documents'
  }
};

// Helper functions
export const getFolderConfig = (folderType: UploadFolderType): FolderConfig => {
  return FOLDER_CONFIGS[folderType];
};

export const isValidMimeType = (folderType: UploadFolderType, mimeType: string): boolean => {
  const config = getFolderConfig(folderType);
  return config.allowedMimeTypes.includes(mimeType);
};

export const getMaxFileSize = (folderType: UploadFolderType): number | undefined => {
  const config = getFolderConfig(folderType);
  return config.maxFileSize;
};

export const generateFileName = (
  folderType: UploadFolderType, 
  originalName: string, 
  courseName?: string,
  moduleTitle?: string,
  lessonTitle?: string
): string => {
  const fileExtension = originalName.split('.').pop();
  const uniqueId = require('uuid').v4();
  
  // Sanitize names for file paths (remove special characters, spaces to hyphens)
  const sanitizeName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  };
  
  if (!courseName) {
    // Fallback to old structure if no course name provided
    return `${folderType.toString()}/${uniqueId}.${fileExtension}`;
  }
  
  const sanitizedCourseName = sanitizeName(courseName);
  
  // New structure: Course/{courseName}/...
  switch (folderType) {
    case UploadFolderType.COURSE_THUMBNAIL:
      return `Course/${sanitizedCourseName}/thumbnail/${uniqueId}.${fileExtension}`;
      
    case UploadFolderType.COURSE_PREVIEW_VIDEO:
      return `Course/${sanitizedCourseName}/preview-video/${uniqueId}.${fileExtension}`;
      
    case UploadFolderType.COURSE_CONTENT_VIDEO:
    case UploadFolderType.LARGE_COURSE_CONTENT_VIDEOS:
      if (moduleTitle && lessonTitle) {
        const sanitizedModuleTitle = sanitizeName(moduleTitle);
        const sanitizedLessonTitle = sanitizeName(lessonTitle);
        return `Course/${sanitizedCourseName}/modules/${sanitizedModuleTitle}/${sanitizedLessonTitle}/${uniqueId}.${fileExtension}`;
      } else if (moduleTitle) {
        const sanitizedModuleTitle = sanitizeName(moduleTitle);
        return `Course/${sanitizedCourseName}/modules/${sanitizedModuleTitle}/${uniqueId}.${fileExtension}`;
      } else {
        return `Course/${sanitizedCourseName}/modules/general/${uniqueId}.${fileExtension}`;
      }
      
    case UploadFolderType.COURSE_DOCUMENTS:
      return `Course/${sanitizedCourseName}/documents/${uniqueId}.${fileExtension}`;
      
    case UploadFolderType.INSTRUCTOR_PROFILE_IMAGE:
      return `Course/${sanitizedCourseName}/instructor/${uniqueId}.${fileExtension}`;
      
    default:
      // For other types, use the old structure
      return `${folderType.toString()}/${uniqueId}.${fileExtension}`;
  }
}; 

// Test function to demonstrate the new folder structure
export const testNewFolderStructure = () => {
  console.log('=== New S3 Folder Structure Examples ===');
  
  // Course thumbnail
  const thumbnailPath = generateFileName(
    UploadFolderType.COURSE_THUMBNAIL,
    'course-image.jpg',
    'Complete Web Development Bootcamp',
    undefined,
    undefined
  );
  console.log('📸 Thumbnail:', thumbnailPath);
  
  // Course preview video
  const previewVideoPath = generateFileName(
    UploadFolderType.COURSE_PREVIEW_VIDEO,
    'preview.mp4',
    'Complete Web Development Bootcamp',
    undefined,
    undefined
  );
  console.log('🎬 Preview Video:', previewVideoPath);
  
  // Course content video
  const contentVideoPath = generateFileName(
    UploadFolderType.COURSE_CONTENT_VIDEO,
    'lesson-video.mp4',
    'Complete Web Development Bootcamp',
    'Introduction to HTML',
    'Basic HTML Structure'
  );
  console.log('📹 Content Video:', contentVideoPath);
  
  // Course document
  const documentPath = generateFileName(
    UploadFolderType.COURSE_DOCUMENTS,
    'syllabus.pdf',
    'Complete Web Development Bootcamp',
    undefined,
    undefined
  );
  console.log('📄 Document:', documentPath);
  
  console.log('=== Structure Summary ===');
  console.log('Course/');
  console.log('└── {course-name}/');
  console.log('    ├── thumbnail/');
  console.log('    ├── preview-video/');
  console.log('    ├── documents/');
  console.log('    ├── instructor/');
  console.log('    └── modules/');
  console.log('        └── {module-name}/');
  console.log('            └── {lesson-name}/');
  console.log('                └── video files');
}; 