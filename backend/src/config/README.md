# Configuration Documentation

## AWS S3 Configuration

This module provides AWS S3 client initialization and configuration for the Edulyt backend.

### Required Environment Variables

Add these variables to your `.env` file:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_REGION=eu-north-1
AWS_S3_BUCKET_NAME=your_bucket_name_here
```

### Usage

#### Initialize S3 Client

```typescript
import { initializeS3, getS3Client } from '../config/s3';

// Initialize S3 client (usually done once at app startup)
const s3Client = initializeS3();

// Or get existing client instance
const s3Client = getS3Client();
```

#### Using S3Service

```typescript
import { S3Service } from '../services/s3.service';

const s3Service = new S3Service();

// Upload a file
const result = await s3Service.uploadFile(
  'uploads/image.jpg',
  fileBuffer,
  'image/jpeg'
);

// Download a file
const file = await s3Service.downloadFile('uploads/image.jpg');

// Generate presigned URL
const url = await s3Service.generatePresignedUrl('uploads/image.jpg', 3600);

// Check if file exists
const exists = await s3Service.objectExists('uploads/image.jpg');

// Delete a file
await s3Service.deleteFile('uploads/image.jpg');
```

### Available Methods

#### S3Service Methods:

- `uploadFile(key, body, contentType?, metadata?)` - Upload a file to S3
- `downloadFile(key)` - Download a file from S3
- `deleteFile(key)` - Delete a file from S3
- `listObjects(prefix?, maxKeys?)` - List objects in bucket
- `objectExists(key)` - Check if an object exists
- `generatePresignedUrl(key, expiresIn?, operation?)` - Generate presigned URLs
- `getObjectMetadata(key)` - Get object metadata
- `getBucket()` - Get bucket name
- `getPublicUrl(key)` - Generate public URL

### Error Handling

The S3 configuration includes proper error handling and logging. Make sure to:

1. Set up proper AWS IAM permissions for your access keys
2. Ensure your bucket exists and is accessible
3. Handle errors appropriately in your application code

### Security Notes

- Never commit your actual AWS credentials to version control
- Use IAM roles with minimal required permissions
- Consider using temporary credentials for enhanced security
- Enable S3 bucket policies and CORS as needed for your use case 