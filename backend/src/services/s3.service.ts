import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  PutObjectCommandInput,
  GetObjectCommandInput,
  DeleteObjectCommandInput,
  ListObjectsV2CommandInput,
  HeadObjectCommandInput
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client, getBucketName } from '../config/s3';

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

  /**
   * Generate a public URL for an S3 object (if bucket allows public access)
   * @param key - The S3 object key (file path)
   * @returns string - The public URL
   */
  getPublicUrl(key: string): string {
    return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
  }
} 