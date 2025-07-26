# Large File Upload System (Up to 50GB)

## Overview

This system enables uploading files up to **50GB** using AWS S3 multipart upload, bypassing Vercel's serverless function limitations. Files are uploaded directly to S3 in chunks, making it reliable for very large files.

## 🏗️ Architecture

### Backend Components

1. **S3Service** (`backend/src/services/s3.service.ts`)
   - Handles S3 multipart upload operations
   - Creates, manages, and completes multipart uploads

2. **MultipartUploadController** (`backend/src/controllers/multipart-upload.controller.ts`)
   - REST API endpoints for multipart upload operations
   - Handles initialization, part URL generation, and completion

3. **Routes** (`backend/src/routes/multipart-upload.routes.ts`)
   - `/api/multipart-upload/initialize` - Start upload
   - `/api/multipart-upload/generate-part-urls` - Get upload URLs
   - `/api/multipart-upload/complete` - Finish upload
   - `/api/multipart-upload/abort` - Cancel upload
   - `/api/multipart-upload/parts` - List uploaded parts

### Frontend Components

1. **LargeFileUploader** (`frontend/src/utils/largeFileUpload.ts`)
   - JavaScript utility for chunked file uploads
   - Handles progress tracking and error recovery

2. **LargeFileUpload Component** (`frontend/src/components/LargeFileUpload.tsx`)
   - React component with UI for large file uploads
   - Progress bars, cancellation, and error handling

## 📋 File Size Limits

| Upload Method | Size Limit | Use Case |
|---------------|------------|----------|
| Regular Upload (`/api/upload/*`) | 100MB | Small files, images, documents |
| Multipart Upload (`/api/multipart-upload/*`) | 50GB | Large videos, datasets, archives |

## 🚀 Usage Examples

### Frontend - Using the Utility

```typescript
import { largeFileUploader } from '../utils/largeFileUpload';

const uploadFile = async (file: File) => {
  const result = await largeFileUploader.uploadLargeFile(file, {
    chunkSize: 100 * 1024 * 1024, // 100MB chunks
    maxConcurrentUploads: 3,
    onProgress: (progress) => {
      console.log(`${progress.percentage}% uploaded`);
    },
    onError: (error) => {
      console.error('Upload error:', error);
    }
  });

  if (result.success) {
    console.log('File uploaded:', result.url);
  } else {
    console.error('Upload failed:', result.error);
  }
};
```

### Frontend - Using the React Component

```tsx
import LargeFileUpload from '../components/LargeFileUpload';

const MyPage = () => {
  const handleUploadComplete = (result) => {
    if (result.success) {
      console.log('Upload completed:', result.url);
    } else {
      console.error('Upload failed:', result.error);
    }
  };

  return (
    <LargeFileUpload
      onUploadComplete={handleUploadComplete}
      acceptedFileTypes="video/*,.zip,.pdf"
      maxFileSize={50 * 1024 * 1024 * 1024} // 50GB
    />
  );
};
```

### Backend - Direct API Usage

```bash
# 1. Initialize multipart upload
curl -X POST http://localhost:3000/api/multipart-upload/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "large-video.mp4",
    "fileType": "video/mp4",
    "uploadType": "course-videos"
  }'

# Response: { "uploadId": "...", "fileName": "...", "publicUrl": "..." }

# 2. Generate presigned URLs for parts
curl -X POST http://localhost:3000/api/multipart-upload/generate-part-urls \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "course-videos/uuid.mp4",
    "uploadId": "upload-id-from-step-1",
    "partNumbers": [1, 2, 3]
  }'

# 3. Upload each part using the presigned URLs (PUT request)
curl -X PUT "presigned-url-for-part-1" \
  --data-binary @part1.chunk

# 4. Complete the upload
curl -X POST http://localhost:3000/api/multipart-upload/complete \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "course-videos/uuid.mp4",
    "uploadId": "upload-id-from-step-1",
    "parts": [
      { "ETag": "etag-from-part-1", "PartNumber": 1 },
      { "ETag": "etag-from-part-2", "PartNumber": 2 }
    ]
  }'
```

## ⚙️ Configuration

### Environment Variables

Ensure these AWS S3 variables are set:

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_S3_BUCKET_NAME=your_bucket_name
```

### S3 Bucket CORS Configuration

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://yourdomain.com", "http://localhost:3000"],
    "ExposeHeaders": ["ETag"]
  }
]
```

## 🔧 Technical Details

### Chunk Size Optimization

- **Default**: 100MB chunks
- **Minimum**: 5MB (S3 requirement)
- **Maximum**: 5GB per part
- **Optimal**: 100MB-500MB for most use cases

### Concurrent Uploads

- **Default**: 3 concurrent parts
- **Recommended**: 3-5 for best performance
- **Maximum**: 10 (avoid overwhelming the connection)

### Error Handling

The system includes comprehensive error handling:

- **Network failures**: Automatic retry for failed parts
- **Timeout handling**: 2-hour presigned URL expiration
- **Abort capability**: Clean cancellation of uploads
- **Progress tracking**: Real-time upload progress

## 📊 Performance Guidelines

### Upload Speed Factors

1. **Internet connection**: Primary bottleneck
2. **Chunk size**: Larger chunks = fewer requests
3. **Concurrent uploads**: More parallel = faster (up to a point)
4. **Geographic location**: Closer to S3 region = faster

### Recommended Settings by File Size

| File Size | Chunk Size | Concurrent | Estimated Time* |
|-----------|------------|------------|-----------------|
| 1GB | 100MB | 3 | 5-15 minutes |
| 10GB | 200MB | 4 | 30-90 minutes |
| 50GB | 500MB | 5 | 2-6 hours |

*Times vary significantly based on internet speed

## 🛠️ Deployment Considerations

### Vercel Deployment

The multipart upload system is designed to work with Vercel's limitations:

- **No file processing on serverless functions**
- **Direct S3 uploads bypass Vercel entirely**
- **Only metadata passes through your API**

### Monitoring

Monitor these metrics:

- Upload success/failure rates
- Average upload times
- S3 storage costs
- Bandwidth usage

## 🔒 Security

### File Type Validation

Allowed file types for large uploads:
- Videos: `mp4`, `avi`, `mov`, `wmv`, `flv`, `webm`
- Archives: `zip`
- Documents: `pdf`
- Generic: `application/octet-stream`

### Access Control

- Presigned URLs expire after 2 hours
- S3 bucket policies control access
- Upload metadata includes original filename and timestamp

## 🐛 Troubleshooting

### Common Issues

1. **"Content too large" error**
   - Use multipart upload endpoints, not regular upload
   - Check file size limits (50GB max)

2. **Upload stalls/fails**
   - Check internet connection stability
   - Reduce concurrent uploads
   - Try smaller chunk sizes

3. **CORS errors**
   - Verify S3 bucket CORS configuration
   - Check allowed origins include your domain

4. **Presigned URL expired**
   - URLs expire after 2 hours
   - Regenerate URLs for remaining parts

### Debug Mode

Enable debug logging:

```typescript
// Frontend
console.log('Upload progress:', progress);

// Backend
console.log('Multipart upload initialized:', uploadId);
```

## 📈 Scaling Considerations

For high-traffic applications:

1. **CDN**: Use CloudFront for S3 distribution
2. **Database**: Store upload metadata in your database
3. **Queue**: Use background jobs for post-upload processing
4. **Monitoring**: Implement upload analytics and alerts

## 🔄 Migration from Old System

To migrate from the previous 5GB limit system:

1. Deploy the new multipart upload endpoints
2. Update frontend to use `LargeFileUploader` for files > 100MB
3. Keep existing upload endpoints for smaller files
4. Update file size validation messages
5. Test with various file sizes

---

## 🎯 Quick Start Checklist

- [ ] AWS S3 credentials configured
- [ ] S3 bucket CORS policy updated
- [ ] Backend multipart endpoints deployed
- [ ] Frontend utility integrated
- [ ] File size limits updated in UI
- [ ] Error handling implemented
- [ ] Progress tracking working
- [ ] Upload cancellation tested

Your application now supports uploading files up to **50GB** reliably! 🚀 