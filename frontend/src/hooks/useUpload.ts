import { useState, useCallback } from "react";

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

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  // Extract video duration from file
  const getVideoDuration = useCallback((file: File): Promise<number> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("video/")) {
        resolve(0);
        return;
      }

      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = Math.round(video.duration || 0);
        resolve(duration);
      };

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(0);
      };

      video.src = URL.createObjectURL(file);
    });
  }, []);

  // Upload single file using presigned URL (replaces old multer upload)
  const uploadFile = useCallback(
    async (file: File, folderName: string): Promise<UploadResponse> => {
      return uploadWithPresignedUrl(file, folderName);
    },
    []
  );

  // Upload multiple files using presigned URLs
  const uploadMultipleFiles = useCallback(
    async (files: File[], folderName: string): Promise<UploadResponse> => {
      setIsUploading(true);
      setError("");

      try {
        // Upload files one by one using presigned URLs
        const uploadPromises = files.map((file) =>
          uploadWithPresignedUrl(file, folderName)
        );
        const results = await Promise.all(uploadPromises);

        // Check if all uploads were successful
        const failedUploads = results.filter((result) => !result.success);
        if (failedUploads.length > 0) {
          const errorMessage = `Failed to upload ${failedUploads.length} files`;
          setError(errorMessage);
          return {
            success: false,
            message: errorMessage,
            error: failedUploads[0].error || "Multiple upload failed",
          };
        }

        // Return success with the first result's data structure
        const firstResult = results[0];
        return {
          success: true,
          message: `Successfully uploaded ${results.length} files`,
          data: firstResult.data,
        };
      } catch (err) {
        console.error("Multiple upload error:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Upload failed";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to upload files",
          error: errorMessage,
        };
      } finally {
        setIsUploading(false);
      }
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

  // Upload course video with duration extraction
  const uploadCourseVideo = useCallback(
    async (
      file: File,
      folderName: string = "course-videos"
    ): Promise<UploadResponse> => {
      setIsUploading(true);
      setError("");

      try {
        // Extract video duration first
        const duration = await getVideoDuration(file);

        const result = await uploadFile(file, folderName);

        // Add duration to the response
        if (result.success && result.data) {
          result.data.duration = duration;
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Upload failed";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to upload video",
          error: errorMessage,
        };
      } finally {
        setIsUploading(false);
      }
    },
    [uploadFile, getVideoDuration]
  );

  // Upload instructor image
  const uploadInstructorImage = useCallback(
    async (
      file: File,
      folderName: string = "instructor-images"
    ): Promise<UploadResponse> => {
      return uploadFile(file, folderName);
    },
    [uploadFile]
  );

  // Upload lesson video
  const uploadLessonVideo = useCallback(
    async (
      file: File,
      folderName: string = "lesson-videos"
    ): Promise<UploadResponse> => {
      return uploadCourseVideo(file, folderName);
    },
    [uploadCourseVideo]
  );

  // Generate presigned URL
  const generatePresignedUrl = useCallback(
    async (
      fileName: string,
      fileType: string,
      folderName: string
    ): Promise<PresignedUrlResponse> => {
      setIsUploading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/upload/presigned-url`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName,
            fileType,
            folderName,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to generate presigned URL";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to generate presigned URL",
          error: errorMessage,
        };
      } finally {
        setIsUploading(false);
      }
    },
    [baseUrl]
  );

  // Upload using presigned URL (for large files)
  const uploadWithPresignedUrl = useCallback(
    async (file: File, folderName: string): Promise<UploadResponse> => {
      setIsUploading(true);
      setError("");

      try {
        // Step 1: Get presigned URL from backend
        const presignedResponse = await fetch(
          `${baseUrl}/upload/presigned-url`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              folderName,
            }),
          }
        );

        const presignedData = await presignedResponse.json();

        if (!presignedData.success) {
          throw new Error(presignedData.error || "Failed to get presigned URL");
        }

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
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Upload failed";
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
    [baseUrl]
  );

  // Delete file
  const deleteFile = useCallback(
    async (s3Key: string): Promise<UploadResponse> => {
      setIsUploading(true);
      setError("");

      try {
        const encodedS3Key = encodeURIComponent(s3Key);
        const response = await fetch(`${baseUrl}/upload/${encodedS3Key}`, {
          method: "DELETE",
        });

        const result = await response.json();

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete file";
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
    [baseUrl]
  );

  // Get file info
  const getFileInfo = useCallback(
    async (s3Key: string): Promise<UploadResponse> => {
      setError("");

      try {
        const encodedS3Key = encodeURIComponent(s3Key);
        const response = await fetch(`${baseUrl}/upload/${encodedS3Key}/info`);

        const result = await response.json();

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get file information";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to get file information",
          error: errorMessage,
        };
      }
    },
    [baseUrl]
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

  // File utilities
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  const getFileExtension = useCallback((filename: string): string => {
    return filename.split(".").pop() || "";
  }, []);

  const isImageFile = useCallback((file: File): boolean => {
    return file.type.startsWith("image/");
  }, []);

  const isVideoFile = useCallback((file: File): boolean => {
    return file.type.startsWith("video/");
  }, []);

  return {
    // State
    isUploading,
    error,

    // Upload methods
    uploadFile,
    uploadMultipleFiles,
    uploadCourseThumbnail,
    uploadCourseVideo,
    uploadInstructorImage,
    uploadLessonVideo,
    uploadWithPresignedUrl,

    // Other methods
    generatePresignedUrl,
    deleteFile,
    getFileInfo,

    // Utilities
    validateFile,
    formatFileSize,
    getFileExtension,
    isImageFile,
    isVideoFile,
    getVideoDuration,

    // Reset error
    clearError: () => setError(""),
  };
};
