# New AWS S3 Folder Structure

## Overview

The AWS S3 storage has been restructured to use a more intuitive, course-name-based hierarchy instead of the previous ID-based system.

## New Folder Structure

```
Course/
└── {course-name}/
    ├── thumbnail/
    │   └── {unique-id}.{ext}
    ├── preview-video/
    │   └── {unique-id}.{ext}
    ├── documents/
    │   └── {unique-id}.{ext}
    ├── instructor/
    │   └── {unique-id}.{ext}
    └── modules/
        └── {module-name}/
            └── {lesson-name}/
                └── {unique-id}.{ext}
```

## Examples

For a course named **"Complete Web Development Bootcamp"**:

### Course Thumbnail
```
Course/complete-web-development-bootcamp/thumbnail/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg
```

### Preview Video
```
Course/complete-web-development-bootcamp/preview-video/b2c3d4e5-f6g7-8901-bcde-f12345678901.mp4
```

### Module Content Video
For module **"Introduction to HTML"** and lesson **"Basic HTML Structure"**:
```
Course/complete-web-development-bootcamp/modules/introduction-to-html/basic-html-structure/c3d4e5f6-g7h8-9012-cdef-123456789012.mp4
```

### Course Documents
```
Course/complete-web-development-bootcamp/documents/d4e5f6g7-h8i9-0123-defg-456789012345.pdf
```

## Key Features

1. **Human-Readable Names**: Course and module names are sanitized and used in folder paths
2. **Hierarchical Organization**: Clear structure from course → modules → lessons
3. **Name Sanitization**: Special characters removed, spaces converted to hyphens, lowercase
4. **Unique File IDs**: Each file still gets a UUID to prevent conflicts
5. **Backward Compatibility**: Falls back to old structure if course name not provided

## API Changes

### Required Request Body Parameters

When uploading files, include these additional parameters:

**For Course Thumbnails:**
```json
{
  "courseId": "12345",
  "courseName": "Complete Web Development Bootcamp"
}
```

**For Course Videos:**
```json
{
  "courseId": "12345",
  "courseName": "Complete Web Development Bootcamp",
  "videoType": "content", // or "preview"
  "moduleId": "67890",
  "moduleTitle": "Introduction to HTML",
  "lessonId": "11111",
  "lessonTitle": "Basic HTML Structure"
}
```

**For Multipart Uploads:**
```json
{
  "fileName": "large-video.mp4",
  "fileType": "video/mp4",
  "folderType": "LARGE_COURSE_CONTENT_VIDEOS",
  "courseId": "12345",
  "courseName": "Complete Web Development Bootcamp",
  "moduleId": "67890",
  "moduleTitle": "Introduction to HTML",
  "lessonId": "11111",
  "lessonTitle": "Basic HTML Structure"
}
```

## Migration Notes

- Existing files with the old structure will continue to work
- New uploads will use the new structure
- The system gracefully handles missing course names by falling back to course IDs
- All special characters in names are sanitized for safe file paths

## Benefits

1. **Better Organization**: Files are logically grouped by course and content structure
2. **Easier Navigation**: S3 bucket browsing is more intuitive
3. **Scalability**: Structure scales well with multiple courses and content
4. **Maintainability**: Easier to manage and debug file storage issues
5. **User-Friendly**: Course creators can easily identify their content in the bucket 