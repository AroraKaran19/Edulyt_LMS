import { useState, useCallback } from "react";
import apiClient from "@/configs/apiConfig";

// Types for upload responses
export interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    fileName: string;
    originalName: string;
    url: string;
    size: number;
    mimetype: string;
    folderName: string;
    s3Key: string;
    duration?: number;
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
    folderName: string;
    s3Key: string;
  };
  error?: string;
}

export const useUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>("");

  // Upload single file using presigned URL (replaces old multer upload)
  const uploadFile = useCallback(
    async (file: File, folderName: string): Promise<UploadResponse> => {
      return uploadWithPresignedUrl(file, folderName);
    },
    []
  );

  // Upload course thumbnail with default folder
  const uploadCourseThumbnail = useCallback(
    async (
      file: File,
      folderName: string = "course-thumbnails"
    ): Promise<UploadResponse> => {
      return uploadFile(file, folderName);
    },
    [uploadFile]
  );

  // Upload video with default folder
  const uploadVideo = useCallback(
    async (
      file: File,
      folderName: string = "course-videos"
    ): Promise<UploadResponse> => {
      return uploadFile(file, folderName);
    },
    [uploadFile]
  );

  // Upload document with default folder
  const uploadDocument = useCallback(
    async (
      file: File,
      folderName: string = "course-documents"
    ): Promise<UploadResponse> => {
      return uploadFile(file, folderName);
    },
    [uploadFile]
  );

  // Upload using presigned URL (for large files)
  const uploadWithPresignedUrl = useCallback(
    async (file: File, folderName: string): Promise<UploadResponse> => {
      setIsUploading(true);
      setError("");

      try {
        // Step 1: Get presigned URL from backend using apiClient
        const presignedResponse = await apiClient.post(
          "/upload/presigned-url",
          {
            fileName: file.name,
            fileType: file.type,
            folderName,
            fileSize: file.size,
          }
        );

        if (!presignedResponse.data.success) {
          throw new Error(
            presignedResponse.data.error || "Failed to get presigned URL"
          );
        }

        const presignedData = presignedResponse.data;

        // Step 2: Upload directly to S3
        const uploadResponse = await fetch(presignedData.data.presignedUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(`S3 upload failed: ${uploadResponse.status}`);
        }

        return {
          success: true,
          message: "File uploaded successfully",
          data: {
            fileName: presignedData.data.fileName,
            originalName: file.name,
            url: presignedData.data.publicUrl,
            size: file.size,
            mimetype: file.type,
            folderName: presignedData.data.folderName,
            s3Key: presignedData.data.s3Key,
          },
        };
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          "Upload failed";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to upload file",
          error: errorMessage,
        };
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  // Delete file using apiClient
  const deleteFile = useCallback(
    async (s3Key: string): Promise<UploadResponse> => {
      setIsUploading(true);
      setError("");

      try {
        const encodedS3Key = encodeURIComponent(s3Key);
        const response = await apiClient.delete(`/upload/${encodedS3Key}`);

        if (!response.data.success) {
          setError(response.data.error || response.data.message);
        }

        return response.data;
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to delete file";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to delete file",
          error: errorMessage,
        };
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  // File validation utility
  const validateFile = useCallback(
    (
      file: File,
      allowedTypes: string[],
      maxSize: number = 100 * 1024 * 1024 // 100MB default
    ): { valid: boolean; error?: string } => {
      if (!allowedTypes.includes(file.type)) {
        return {
          valid: false,
          error: `File type ${
            file.type
          } is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
        };
      }

      if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        const fileSizeMB = Math.round(file.size / (1024 * 1024));
        return {
          valid: false,
          error: `File size ${fileSizeMB}MB exceeds maximum allowed size of ${maxSizeMB}MB`,
        };
      }

      return { valid: true };
    },
    []
  );

  // Video file validation with duration check
  const validateVideoFile = useCallback(
    (
      file: File,
      maxSize: number = 10 * 1024 * 1024 * 1024, // 10GB default for videos
      maxDuration?: number // in seconds
    ): { valid: boolean; error?: string } => {
      const videoTypes = [
        "video/mp4",
        "video/avi",
        "video/mov",
        "video/wmv",
        "video/flv",
        "video/webm",
        "video/mkv",
      ];

      if (!videoTypes.includes(file.type)) {
        return {
          valid: false,
          error: `File type ${
            file.type
          } is not allowed. Allowed video types: ${videoTypes.join(", ")}`,
        };
      }

      if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        const fileSizeMB = Math.round(file.size / (1024 * 1024));
        return {
          valid: false,
          error: `Video size ${fileSizeMB}MB exceeds maximum allowed size of ${maxSizeMB}MB`,
        };
      }

      // Note: Duration validation would require additional processing
      // This is a placeholder for future implementation
      if (maxDuration) {
        // TODO: Implement duration validation using video metadata
        console.warn("Duration validation not yet implemented");
      }

      return { valid: true };
    },
    []
  );

  // Image file validation
  const validateImageFile = useCallback(
    (
      file: File,
      maxSize: number = 10 * 1024 * 1024, // 10MB default for images
      maxDimensions?: { width: number; height: number }
    ): { valid: boolean; error?: string } => {
      const imageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
      ];

      if (!imageTypes.includes(file.type)) {
        return {
          valid: false,
          error: `File type ${
            file.type
          } is not allowed. Allowed image types: ${imageTypes.join(", ")}`,
        };
      }

      if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        const fileSizeMB = Math.round(file.size / (1024 * 1024));
        return {
          valid: false,
          error: `Image size ${fileSizeMB}MB exceeds maximum allowed size of ${maxSizeMB}MB`,
        };
      }

      // Note: Dimension validation would require additional processing
      // This is a placeholder for future implementation
      if (maxDimensions) {
        // TODO: Implement dimension validation using image metadata
        console.warn("Dimension validation not yet implemented");
      }

      return { valid: true };
    },
    []
  );

  // Document file validation
  const validateDocumentFile = useCallback(
    (
      file: File,
      maxSize: number = 50 * 1024 * 1024 // 50MB default for documents
    ): { valid: boolean; error?: string } => {
      const documentTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "text/csv",
      ];

      if (!documentTypes.includes(file.type)) {
        return {
          valid: false,
          error: `File type ${
            file.type
          } is not allowed. Allowed document types: ${documentTypes.join(
            ", "
          )}`,
        };
      }

      if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        const fileSizeMB = Math.round(file.size / (1024 * 1024));
        return {
          valid: false,
          error: `Document size ${fileSizeMB}MB exceeds maximum allowed size of ${maxSizeMB}MB`,
        };
      }

      return { valid: true };
    },
    []
  );

  // Batch upload multiple files
  const uploadMultipleFiles = useCallback(
    async (
      files: File[],
      folderName: string
    ): Promise<{
      results: UploadResponse[];
      successCount: number;
      errorCount: number;
    }> => {
      setIsUploading(true);
      setError("");

      const results: UploadResponse[] = [];
      let successCount = 0;
      let errorCount = 0;

      try {
        // Upload files sequentially to avoid overwhelming the server
        for (const file of files) {
          const result = await uploadWithPresignedUrl(file, folderName);
          results.push(result);

          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        }

        return { results, successCount, errorCount };
      } catch (err: any) {
        const errorMessage = err?.message || "Batch upload failed";
        setError(errorMessage);
        return { results, successCount, errorCount };
      } finally {
        setIsUploading(false);
      }
    },
    [uploadWithPresignedUrl]
  );

  return {
    // State
    isUploading,
    error,

    // Upload methods
    uploadFile,
    uploadCourseThumbnail,
    uploadVideo,
    uploadDocument,
    uploadMultipleFiles,

    // Other methods
    deleteFile,

    // Validation utilities
    validateFile,
    validateVideoFile,
    validateImageFile,
    validateDocumentFile,

    // Reset error
    clearError: () => setError(""),
  };
};
