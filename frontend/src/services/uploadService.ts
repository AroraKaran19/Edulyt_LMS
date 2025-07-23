// Upload service for handling file uploads to backend API

export interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    fileName: string;
    url: string;
    size: number;
    mimetype: string;
  };
  error?: string;
}

export interface PresignedUrlResponse {
  success: boolean;
  message: string;
  data?: {
    presignedUrl: string;
    fileName: string;
    publicUrl: string;
    expiresIn: number;
  };
  error?: string;
}

class UploadService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  }

  /**
   * Upload course thumbnail image
   * @param file - Image file to upload
   * @returns Promise with upload result
   */
  async uploadCourseThumbnail(file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('thumbnail', file);

      const response = await fetch(`${this.baseUrl}/upload/course/thumbnail`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading course thumbnail:', error);
      return {
        success: false,
        message: 'Failed to upload thumbnail',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Upload course preview/promotional video
   * @param file - Video file to upload
   * @returns Promise with upload result
   */
  async uploadCourseVideo(file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch(`${this.baseUrl}/upload/course/video`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading course video:', error);
      return {
        success: false,
        message: 'Failed to upload video',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Upload instructor profile image
   * @param file - Image file to upload
   * @returns Promise with upload result
   */
  async uploadInstructorImage(file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${this.baseUrl}/upload/instructor/image`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading instructor image:', error);
      return {
        success: false,
        message: 'Failed to upload instructor image',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Upload lesson video
   * @param file - Video file to upload
   * @returns Promise with upload result
   */
  async uploadLessonVideo(file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch(`${this.baseUrl}/upload/lesson/video`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading lesson video:', error);
      return {
        success: false,
        message: 'Failed to upload lesson video',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Upload multiple files
   * @param files - Array of files to upload
   * @returns Promise with upload result
   */
  async uploadMultipleFiles(files: File[]): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch(`${this.baseUrl}/upload/multiple`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      return {
        success: false,
        message: 'Failed to upload files',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate presigned URL for direct uploads
   * @param fileName - Name of the file
   * @param fileType - MIME type of the file
   * @param uploadType - Type of upload (course-thumbnail, instructor-image, etc.)
   * @returns Promise with presigned URL
   */
  async generatePresignedUrl(
    fileName: string, 
    fileType: string, 
    uploadType: string = 'general'
  ): Promise<PresignedUrlResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/upload/presigned-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          fileType,
          uploadType
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      return {
        success: false,
        message: 'Failed to generate presigned URL',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete uploaded file
   * @param fileName - Name of the file to delete
   * @returns Promise with deletion result
   */
  async deleteFile(fileName: string): Promise<UploadResponse> {
    try {
      const encodedFileName = encodeURIComponent(fileName);
      const response = await fetch(`${this.baseUrl}/upload/${encodedFileName}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting file:', error);
      return {
        success: false,
        message: 'Failed to delete file',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get file information
   * @param fileName - Name of the file
   * @returns Promise with file information
   */
  async getFileInfo(fileName: string): Promise<UploadResponse> {
    try {
      const encodedFileName = encodeURIComponent(fileName);
      const response = await fetch(`${this.baseUrl}/upload/${encodedFileName}/info`);

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error getting file info:', error);
      return {
        success: false,
        message: 'Failed to get file information',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate file type and size
   * @param file - File to validate
   * @param allowedTypes - Array of allowed MIME types
   * @param maxSize - Maximum file size in bytes
   * @returns Validation result
   */
  validateFile(
    file: File, 
    allowedTypes: string[], 
    maxSize: number = 100 * 1024 * 1024 // 100MB default
  ): { valid: boolean; error?: string } {
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      const fileSizeMB = Math.round(file.size / (1024 * 1024));
      return {
        valid: false,
        error: `File size ${fileSizeMB}MB exceeds maximum allowed size of ${maxSizeMB}MB`
      };
    }

    return { valid: true };
  }

  /**
   * Format file size for display
   * @param bytes - File size in bytes
   * @returns Formatted file size string
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file extension from filename
   * @param filename - Name of the file
   * @returns File extension
   */
  getFileExtension(filename: string): string {
    return filename.split('.').pop() || '';
  }

  /**
   * Check if file is an image
   * @param file - File to check
   * @returns Boolean indicating if file is an image
   */
  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  /**
   * Check if file is a video
   * @param file - File to check
   * @returns Boolean indicating if file is a video
   */
  isVideoFile(file: File): boolean {
    return file.type.startsWith('video/');
  }
}

// Export singleton instance
export const uploadService = new UploadService();
export default uploadService; 