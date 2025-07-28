# AWS S3 Cleanup System

## Overview

The S3 cleanup system automatically removes all associated AWS S3 files when a course is deleted, preventing orphaned files and reducing storage costs. This system works with both the old and new folder structures.

## How It Works

### Automatic Cleanup

When a course is deleted via the admin API (`DELETE /api/admin/courses/:courseId`), the system:

1. **Deletes the course** from the database first
2. **Asynchronously cleans up S3 assets** to avoid blocking the response
3. **Uses dual cleanup methods** for maximum coverage:
   - **Asset-based cleanup**: Extracts S3 keys from all course URLs and deletes them individually
   - **Folder-based cleanup**: Deletes entire course folder (for new folder structure)

### Files That Get Cleaned Up

The system identifies and removes:

#### Course-Level Assets
- **Course thumbnail** (`course.thumbnail`)
- **Preview video** (`course.previewVideoUrl`)

#### Instructor Assets
- **Profile images** (`instructor.profileImage`)

#### Module Assets
- **Module thumbnails** (`module.thumbnailUrl`)

#### Lesson Content Assets
- **Video thumbnails** (`video.thumbnailUrl`)
- **Video sources** (all quality levels: `video.sources[].videoUrl`)
- **Legacy lesson videos** (`lesson.videoUrl` - for backward compatibility)

### Folder Structure Support

The system supports both folder structures:

#### Old Structure
```
courseThumbnails/uuid.jpg
coursePreviewVideos/uuid.mp4
courseContentVideos/uuid.mp4
```

#### New Structure
```
Course/course-name/thumbnail/uuid.jpg
Course/course-name/preview-video/uuid.mp4
Course/course-name/modules/module-name/lesson-name/uuid.mp4
```

## API Endpoints

### Automatic Cleanup (Built-in)

```http
DELETE /api/admin/courses/:courseId
```

**Description**: Deletes a course and automatically cleans up all associated S3 assets.

**Response**:
```json
{
  "success": true,
  "message": "Course deleted successfully",
  "data": { "courseId": "course-123" }
}
```

**Note**: S3 cleanup happens asynchronously. Check server logs for cleanup results.

### Manual Cleanup (Utility)

```http
POST /api/admin/courses/:courseId/cleanup-s3
```

**Description**: Manually trigger S3 cleanup for a specific course without deleting it from the database.

**Response**:
```json
{
  "success": true,
  "message": "S3 cleanup completed",
  "data": {
    "courseId": "course-123",
    "courseTitle": "Complete Web Development Bootcamp",
    "summary": {
      "totalDeleted": 25,
      "totalFailed": 0
    },
    "assetCleanup": {
      "totalAssets": 20,
      "successful": 20,
      "failed": 0,
      "failedFiles": []
    },
    "folderCleanup": {
      "totalDeleted": 5,
      "successful": 5,
      "failed": 0,
      "failedFiles": []
    }
  }
}
```

## Error Handling

### Graceful Degradation
- Course deletion succeeds even if S3 cleanup fails
- Individual file deletion failures don't stop the entire cleanup process
- Detailed logging for troubleshooting

### Error Scenarios
1. **S3 Service Unavailable**: Cleanup fails but course is still deleted
2. **Individual File Errors**: Other files continue to be deleted
3. **Permission Issues**: Logged but doesn't block course deletion

## Logging

The system provides comprehensive logging:

```
🧹 Starting cleanup for course: Complete Web Development Bootcamp
🗑️ Deleting 20 files from S3...
✅ Deleted: Course/complete-web-development-bootcamp/thumbnail/uuid.jpg
✅ Deleted: Course/complete-web-development-bootcamp/preview-video/uuid.mp4
📊 Asset cleanup: 20/20 files deleted
📁 Folder cleanup: 5 files deleted from course folder
✅ Course cleanup completed: 25 files deleted, 0 failed
```

## Implementation Details

### S3Service Methods

#### `cleanupCourseAssets(course)`
- Extracts all asset URLs from course object
- Handles complex nested structure (modules → lessons → content → videos)
- Supports multiple video qualities
- Returns detailed results

#### `deleteCourseFolder(courseName)`
- Lists all objects in course folder using S3 prefix
- Deletes entire folder structure
- Works with new hierarchical folder structure

#### `deleteMultipleFiles(keys[])`
- Parallel deletion of multiple files
- Individual error handling
- Progress tracking

### URL Extraction

The system handles various S3 URL formats:
```javascript
// Standard S3 URLs
https://bucket.s3.region.amazonaws.com/path/file.jpg
https://s3.region.amazonaws.com/bucket/path/file.jpg
https://bucket.s3-region.amazonaws.com/path/file.jpg

// Direct S3 keys
Course/course-name/thumbnail/uuid.jpg
```

## Best Practices

### For Developers

1. **Always test cleanup** in development environment
2. **Monitor logs** for cleanup success/failure
3. **Use manual cleanup endpoint** for maintenance
4. **Ensure proper S3 permissions** for delete operations

### For Administrators

1. **Regular cleanup audits** using manual cleanup endpoint
2. **Monitor S3 storage costs** for orphaned files
3. **Backup important courses** before deletion
4. **Use staging environment** for testing

## Troubleshooting

### Common Issues

#### "Failed to delete asset" Errors
- **Cause**: File doesn't exist or permission issues
- **Solution**: Check S3 permissions and file existence
- **Impact**: Other files continue to be deleted

#### "No assets found to clean up"
- **Cause**: Course has no S3 assets or URLs are invalid
- **Solution**: Normal behavior for courses without media

#### Partial Cleanup Success
- **Cause**: Some files deleted, others failed
- **Solution**: Check failed files in response, retry if needed

### Debugging Steps

1. **Check server logs** for detailed cleanup information
2. **Use manual cleanup endpoint** to test specific courses
3. **Verify S3 permissions** for delete operations
4. **Check S3 bucket** directly for remaining files

## Configuration

### Environment Variables
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=eu-north-1
AWS_S3_BUCKET_NAME=your_bucket_name
```

### Required S3 Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name/*",
        "arn:aws:s3:::your-bucket-name"
      ]
    }
  ]
}
```

## Migration Notes

### From Old to New System
- Existing courses work with both cleanup methods
- No database migration required
- Gradual transition as courses are updated

### Monitoring Cleanup
- Check server logs for cleanup results
- Use manual cleanup endpoint for verification
- Monitor S3 storage usage for cost optimization

## Future Enhancements

- **Bulk cleanup endpoint** for multiple courses
- **Scheduled cleanup jobs** for orphaned files
- **S3 storage analytics** integration
- **Cleanup history tracking** 