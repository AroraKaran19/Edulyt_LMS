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

  return {
    // State
    isUploading,
    error,

    // Upload methods
    uploadFile,
    uploadCourseThumbnail,

    // Other methods
    deleteFile,

    // Utilities
    validateFile,

    // Reset error
    clearError: () => setError(""),
  };
};
