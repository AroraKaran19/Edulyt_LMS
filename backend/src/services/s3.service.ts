import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand,
  PutObjectCommandInput,
  GetObjectCommandInput,
  DeleteObjectCommandInput,
  ListObjectsV2CommandInput,
  HeadObjectCommandInput,
  CreateMultipartUploadCommandInput,
  UploadPartCommandInput,
  CompleteMultipartUploadCommandInput,
  AbortMultipartUploadCommandInput,
  ListPartsCommandInput
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client, getBucketName } from '../config/s3';
import { UploadFolderType, UploadMetadata, generateFileName, getFolderConfig, isValidMimeType } from '../types/upload';

export class S3Service {
  private s3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = getS3Client();
    this.bucketName = getBucketName();
  }

  /**
   * Upload a file to S3
   * @param key - The S3 object key (file path)
   * @param body - File content (Buffer, Uint8Array, or string)
   * @param contentType - MIME type of the file
   * @param metadata - Additional metadata for the object
   * @returns Promise with upload result
   */
  async uploadFile(
    key: string,
    body: Buffer | Uint8Array | string,
    contentType?: string,
    metadata?: Record<string, string>
  ): Promise<any> {
    try {
      const params: PutObjectCommandInput = {
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
        Metadata: metadata
      };

      const command = new PutObjectCommand(params);
      const result = await this.s3Client.send(command);

      console.log(`✅ File uploaded successfully: ${key}`);
      return {
        success: true,
        key,
        etag: result.ETag,
        location: `https://${this.bucketName}.s3.amazonaws.com/${key}`
      };

    } catch (error) {
      console.error(`❌ Error uploading file ${key}:`, error);
      throw error;
    }
  }

  /**
   * Download a file from S3
   * @param key - The S3 object key (file path)
   * @returns Promise with file content
   */
  async downloadFile(key: string): Promise<any> {
    try {
      const params: GetObjectCommandInput = {
        Bucket: this.bucketName,
        Key: key
      };

      const command = new GetObjectCommand(params);
      const result = await this.s3Client.send(command);

      console.log(`✅ File downloaded successfully: ${key}`);
      return {
        success: true,
        body: result.Body,
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
        metadata: result.Metadata
      };

    } catch (error) {
      console.error(`❌ Error downloading file ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete a file from S3
   * @param key - The S3 object key (file path)
   * @returns Promise with deletion result
   */
  async deleteFile(key: string): Promise<any> {
    try {
      const params: DeleteObjectCommandInput = {
        Bucket: this.bucketName,
        Key: key
      };

      const command = new DeleteObjectCommand(params);
      const result = await this.s3Client.send(command);

      console.log(`✅ File deleted successfully: ${key}`);
      return {
        success: true,
        key,
        deleteMarker: result.DeleteMarker,
        versionId: result.VersionId
      };

    } catch (error) {
      console.error(`❌ Error deleting file ${key}:`, error);
      throw error;
    }
  }

  /**
   * List objects in S3 bucket
   * @param prefix - Filter objects by prefix (folder path)
   * @param maxKeys - Maximum number of objects to return
   * @returns Promise with list of objects
   */
  async listObjects(prefix?: string, maxKeys?: number): Promise<any> {
    try {
      const params: ListObjectsV2CommandInput = {
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys || 1000
      };

      const command = new ListObjectsV2Command(params);
      const result = await this.s3Client.send(command);

      console.log(`✅ Objects listed successfully. Count: ${result.KeyCount}`);
      return {
        success: true,
        objects: result.Contents || [],
        keyCount: result.KeyCount,
        isTruncated: result.IsTruncated,
        nextContinuationToken: result.NextContinuationToken
      };

    } catch (error) {
      console.error(`❌ Error listing objects:`, error);
      throw error;
    }
  }

  /**
   * Check if an object exists in S3
   * @param key - The S3 object key (file path)
   * @returns Promise with boolean result
   */
  async objectExists(key: string): Promise<boolean> {
    try {
      const params: HeadObjectCommandInput = {
        Bucket: this.bucketName,
        Key: key
      };

      const command = new HeadObjectCommand(params);
      await this.s3Client.send(command);

      return true;

    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      console.error(`❌ Error checking object existence ${key}:`, error);
      throw error;
    }
  }

  /**
   * Generate a presigned URL for temporary access to an S3 object
   * @param key - The S3 object key (file path)
   * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
   * @param operation - Operation type ('getObject' or 'putObject')
   * @returns Promise with presigned URL
   */
  async generatePresignedUrl(
    key: string,
    expiresIn: number = 3600,
    operation: 'get' | 'put' = 'get'
  ): Promise<string> {
    try {
      let command;

      if (operation === 'get') {
        command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key
        });
      } else {
        command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key
        });
      }

      const presignedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn
      });

      console.log(`✅ Presigned URL generated for ${operation}: ${key}`);
      return presignedUrl;

    } catch (error) {
      console.error(`❌ Error generating presigned URL for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get object metadata without downloading the file
   * @param key - The S3 object key (file path)
   * @returns Promise with object metadata
   */
  async getObjectMetadata(key: string): Promise<any> {
    try {
      const params: HeadObjectCommandInput = {
        Bucket: this.bucketName,
        Key: key
      };

      const command = new HeadObjectCommand(params);
      const result = await this.s3Client.send(command);

      console.log(`✅ Object metadata retrieved: ${key}`);
      return {
        success: true,
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
        etag: result.ETag,
        metadata: result.Metadata
      };

    } catch (error) {
      console.error(`❌ Error getting object metadata ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get the bucket name being used
   * @returns string - The S3 bucket name
   */
  getBucket(): string {
    return this.bucketName;
  }

  // ==================== ORGANIZED UPLOAD METHODS ====================

  /**
   * Upload a file to organized folder structure
   * @param folderType - Type of folder to upload to
   * @param originalName - Original filename
   * @param body - File content
   * @param contentType - MIME type
   * @param additionalMetadata - Extra metadata
   * @param additionalPath - Additional path within folder (e.g., courseId/moduleId)
   * @returns Promise with upload result
   */
  async uploadToOrganizedFolder(
    folderType: UploadFolderType,
    originalName: string,
    body: Buffer | Uint8Array | string,
    contentType: string,
    additionalMetadata: Partial<UploadMetadata> = {},
    additionalPath?: string
  ): Promise<any> {
    try {
      // Validate MIME type
      if (!isValidMimeType(folderType, contentType)) {
        const config = getFolderConfig(folderType);
        throw new Error(`Invalid file type ${contentType} for folder ${folderType}. Allowed types: ${config.allowedMimeTypes.join(', ')}`);
      }

      // Generate organized filename
      const fileName = generateFileName(folderType, originalName, additionalPath);

      // Prepare metadata
      const metadata: UploadMetadata = {
        originalName,
        uploadType: 'organized-upload',
        folderType,
        uploadedAt: new Date().toISOString(),
        ...additionalMetadata
      };

      // Convert metadata to Record<string, string>
      const metadataRecord: Record<string, string> = {};
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== undefined) {
          metadataRecord[key] = String(value);
        }
      });

      // Upload file
      const result = await this.uploadFile(fileName, body, contentType, metadataRecord);

      console.log(`✅ File uploaded to organized folder: ${folderType}/${fileName}`);
      return {
        ...result,
        folderType,
        organizedPath: fileName
      };

    } catch (error) {
      console.error(`❌ Error uploading to organized folder ${folderType}:`, error);
      throw error;
    }
  }

  /**
   * Create multipart upload with organized folder structure
   * @param folderType - Type of folder to upload to
   * @param originalName - Original filename
   * @param contentType - MIME type
   * @param additionalMetadata - Extra metadata
   * @param additionalPath - Additional path within folder
   * @returns Promise with upload details
   */
  async createOrganizedMultipartUpload(
    folderType: UploadFolderType,
    originalName: string,
    contentType: string,
    additionalMetadata: Partial<UploadMetadata> = {},
    additionalPath?: string
  ): Promise<{ uploadId: string; key: string; folderType: UploadFolderType }> {
    try {
      // Validate MIME type
      if (!isValidMimeType(folderType, contentType)) {
        const config = getFolderConfig(folderType);
        throw new Error(`Invalid file type ${contentType} for folder ${folderType}. Allowed types: ${config.allowedMimeTypes.join(', ')}`);
      }

      // Generate organized filename
      const fileName = generateFileName(folderType, originalName, additionalPath);

      // Prepare metadata
      const metadata: UploadMetadata = {
        originalName,
        uploadType: 'organized-multipart-upload',
        folderType,
        uploadedAt: new Date().toISOString(),
        ...additionalMetadata
      };

      // Convert metadata to Record<string, string>
      const metadataRecord: Record<string, string> = {};
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== undefined) {
          metadataRecord[key] = String(value);
        }
      });

      // Create multipart upload
      const result = await this.createMultipartUpload(fileName, contentType, metadataRecord);

      console.log(`✅ Organized multipart upload created: ${folderType}/${fileName}`);
      return {
        ...result,
        folderType
      };

    } catch (error) {
      console.error(`❌ Error creating organized multipart upload for ${folderType}:`, error);
      throw error;
    }
  }

  /**
   * Get folder configuration for a specific upload type
   * @param folderType - Type of folder
   * @returns Folder configuration
   */
  getFolderConfig(folderType: UploadFolderType) {
    return getFolderConfig(folderType);
  }

  /**
   * Validate file against folder requirements
   * @param folderType - Type of folder
   * @param contentType - MIME type to validate
   * @param fileSize - File size in bytes (optional)
   * @returns Validation result
   */
  validateFileForFolder(
    folderType: UploadFolderType,
    contentType: string,
    fileSize?: number
  ): { isValid: boolean; error?: string } {
    const config = getFolderConfig(folderType);

    // Check MIME type
    if (!isValidMimeType(folderType, contentType)) {
      return {
        isValid: false,
        error: `Invalid file type ${contentType} for folder ${folderType}. Allowed types: ${config.allowedMimeTypes.join(', ')}`
      };
    }

    // Check file size if specified
    if (fileSize && config.maxFileSize && fileSize > config.maxFileSize) {
      const maxSizeMB = Math.round(config.maxFileSize / (1024 * 1024));
      const fileSizeMB = Math.round(fileSize / (1024 * 1024));
      return {
        isValid: false,
        error: `File size ${fileSizeMB}MB exceeds maximum allowed size ${maxSizeMB}MB for folder ${folderType}`
      };
    }

    return { isValid: true };
  }

  // ==================== MULTIPART UPLOAD METHODS ====================

  /**
   * Initialize a multipart upload
   * @param key - The S3 object key (file path)
   * @param contentType - MIME type of the file
   * @param metadata - Additional metadata for the object
   * @returns Promise with upload ID and other details
   */
  async createMultipartUpload(
    key: string,
    contentType?: string,
    metadata?: Record<string, string>
  ): Promise<{ uploadId: string; key: string }> {
    try {
      const params: CreateMultipartUploadCommandInput = {
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
        Metadata: metadata
      };

      const command = new CreateMultipartUploadCommand(params);
      const result = await this.s3Client.send(command);

      if (!result.UploadId) {
        throw new Error('Failed to create multipart upload - no upload ID returned');
      }

      console.log(`✅ Multipart upload created: ${key} (Upload ID: ${result.UploadId})`);
      return {
        uploadId: result.UploadId,
        key
      };

    } catch (error) {
      console.error(`❌ Error creating multipart upload for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Generate presigned URL for uploading a specific part
   * @param key - The S3 object key (file path)
   * @param uploadId - The multipart upload ID
   * @param partNumber - The part number (1-based)
   * @param expiresIn - URL expiration time in seconds (default: 3600)
   * @returns Promise with presigned URL for the part
   */
  async generateMultipartUploadUrl(
    key: string,
    uploadId: string,
    partNumber: number,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new UploadPartCommand({
        Bucket: this.bucketName,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn
      });

      console.log(`✅ Presigned URL generated for part ${partNumber} of ${key}`);
      return presignedUrl;

    } catch (error) {
      console.error(`❌ Error generating presigned URL for part ${partNumber} of ${key}:`, error);
      throw error;
    }
  }

  /**
   * Complete a multipart upload
   * @param key - The S3 object key (file path)
   * @param uploadId - The multipart upload ID
   * @param parts - Array of completed parts with ETag and PartNumber
   * @returns Promise with completion result
   */
  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: Array<{ ETag: string; PartNumber: number }>
  ): Promise<any> {
    try {
      const params: CompleteMultipartUploadCommandInput = {
        Bucket: this.bucketName,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber)
        }
      };

      const command = new CompleteMultipartUploadCommand(params);
      const result = await this.s3Client.send(command);

      console.log(`✅ Multipart upload completed: ${key}`);
      return {
        success: true,
        key,
        location: result.Location || `https://${this.bucketName}.s3.amazonaws.com/${key}`,
        etag: result.ETag
      };

    } catch (error) {
      console.error(`❌ Error completing multipart upload for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Abort a multipart upload
   * @param key - The S3 object key (file path)
   * @param uploadId - The multipart upload ID
   * @returns Promise with abort result
   */
  async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    try {
      const params: AbortMultipartUploadCommandInput = {
        Bucket: this.bucketName,
        Key: key,
        UploadId: uploadId
      };

      const command = new AbortMultipartUploadCommand(params);
      await this.s3Client.send(command);

      console.log(`✅ Multipart upload aborted: ${key} (Upload ID: ${uploadId})`);

    } catch (error) {
      console.error(`❌ Error aborting multipart upload for ${key}:`, error);
      throw error;
    }
  }

  /**
   * List completed parts of a multipart upload
   * @param key - The S3 object key (file path)
   * @param uploadId - The multipart upload ID
   * @returns Promise with list of completed parts
   */
  async listMultipartUploadParts(
    key: string,
    uploadId: string
  ): Promise<Array<{ ETag: string; PartNumber: number; Size: number }>> {
    try {
      const params: ListPartsCommandInput = {
        Bucket: this.bucketName,
        Key: key,
        UploadId: uploadId
      };

      const command = new ListPartsCommand(params);
      const result = await this.s3Client.send(command);

      const parts = result.Parts?.map(part => ({
        ETag: part.ETag!,
        PartNumber: part.PartNumber!,
        Size: part.Size!
      })) || [];

      console.log(`✅ Listed ${parts.length} parts for ${key}`);
      return parts;

    } catch (error) {
      console.error(`❌ Error listing parts for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Generate a public URL for an S3 object (if bucket allows public access)
   * @param key - The S3 object key (file path)
   * @returns string - The public URL
   */
  getPublicUrl(key: string): string {
    return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
  }

} 