import { getS3Client, getBucketName, getPublicUrlBase } from "../config/s3";
import { PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { AppError } from "../middlewares/error.middleware";
import axios from "axios";
import { INTERNSHIP_SUBMISSION_MAX_FILE_BYTES } from "../constants/internshipSubmissionUpload";

export interface PresignedUrlRequest {
  fileName: string;
  fileType: string;
  folderName: string;
  /** Declared size in bytes — required for internship learner uploads; optional elsewhere. */
  fileSize?: number;
}

export interface PresignedUrlResponse {
  presignedUrl: string;
  fileName: string;
  publicUrl: string;
  expiresIn: number;
  folderName: string;
  s3Key: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data?: PresignedUrlResponse;
  error?: string;
}

/**
 * Generate a presigned URL for uploading files to S3
 * @param request - Upload request parameters
 * @returns Presigned URL response
 */
export const generatePresignedUrl = async (
  request: PresignedUrlRequest,
): Promise<PresignedUrlResponse> => {
  const rules = getFileValidationRules(request.folderName);
  const fsRaw = request.fileSize;
  const fs =
    typeof fsRaw === "number"
      ? fsRaw
      : typeof fsRaw === "string"
        ? parseInt(fsRaw, 10)
        : NaN;
  const isInternshipDocs =
    request.folderName === "internship-submission-documents" ||
    request.folderName.startsWith("internship-submission-documents/");
  if (isInternshipDocs) {
    if (!Number.isFinite(fs) || fs <= 0) {
      throw new AppError(
        "fileSize is required for internship submission uploads",
        400,
      );
    }
  }
  if (Number.isFinite(fs) && fs > 0) {
    const v = validateFile(
      request.fileType,
      fs,
      rules.allowedTypes,
      rules.maxSize,
    );
    if (!v.valid) {
      throw new AppError(v.error ?? "Invalid file", 400);
    }
  } else if (!rules.allowedTypes.includes(request.fileType)) {
    throw new AppError(
      `File type ${request.fileType} is not allowed for folder ${request.folderName}`,
      400,
    );
  }

  try {
    const s3Client = await getS3Client();
    const bucketName = getBucketName();

    // Generate unique file name to avoid conflicts
    const fileExtension = request.fileName.split(".").pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const s3Key = `${request.folderName}/${uniqueFileName}`;

    // Create the command for putting an object
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      ContentType: request.fileType,
      Metadata: {
        originalName: request.fileName,
        folderName: request.folderName,
      },
    });

    // Generate presigned URL (expires in 1 hour)
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    // Generate public URL (uses custom domain if AWS_S3_PUBLIC_BASE_URL is set)
    const publicUrl = `${getPublicUrlBase()}/${s3Key}`;

    return {
      presignedUrl,
      fileName: uniqueFileName,
      publicUrl,
      expiresIn: 3600,
      folderName: request.folderName,
      s3Key,
    };
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw new AppError("Failed to generate presigned URL", 500);
  }
};

/**
 * Delete a file from S3
 * @param s3Key - S3 key of the file to delete
 * @returns Success response
 */
export const deleteFileFromS3 = async (s3Key: string): Promise<void> => {
  try {
    const s3Client = await getS3Client();
    const bucketName = getBucketName();

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    throw new AppError("Failed to delete file", 500);
  }
};

/**
 * Extract S3 key from a public URL if it points to our S3 bucket.
 * Returns null for external URLs (e.g. YouTube, other CDNs).
 */
export const extractS3KeyFromUrl = (url: string): string | null => {
  if (!url || typeof url !== "string" || !url.startsWith("http")) return null;
  try {
    const base = getPublicUrlBase();
    const baseNoTrailing = base.replace(/\/$/, "");
    const urlTrimmed = url.trim();
    if (urlTrimmed.startsWith(baseNoTrailing + "/")) {
      return urlTrimmed.slice(baseNoTrailing.length + 1).split("?")[0];
    }
    if (urlTrimmed === baseNoTrailing) return null;
    // Also try default S3 URL pattern (bucket.s3.region.amazonaws.com)
    const bucketName = getBucketName();
    const s3Pattern = new RegExp(
      `^https://${bucketName}\\.s3[.-][a-z0-9-]+\\.amazonaws\\.com/(.+?)(?:\\?|$)`,
      "i"
    );
    const match = urlTrimmed.match(s3Pattern);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

/**
 * Delete multiple files from S3 by their keys.
 * Skips invalid/empty keys. Logs errors but does not throw.
 */
export const deleteFilesFromS3 = async (s3Keys: string[]): Promise<void> => {
  const validKeys = s3Keys.filter((k) => k && typeof k === "string" && k.length > 0);
  if (validKeys.length === 0) return;
  const s3Client = await getS3Client();
  const bucketName = getBucketName();
  for (const key of validKeys) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      await s3Client.send(command);
    } catch (error) {
      console.error(`Error deleting S3 file ${key}:`, error);
      // Continue with other files - don't throw
    }
  }
};

/**
 * Validate file type and size
 * @param fileType - MIME type of the file
 * @param fileSize - Size of the file in bytes
 * @param allowedTypes - Array of allowed MIME types
 * @param maxSize - Maximum file size in bytes
 * @returns Validation result
 */
export const validateFile = (
  fileType: string,
  fileSize: number,
  allowedTypes: string[],
  maxSize: number,
): { valid: boolean; error?: string } => {
  if (!allowedTypes.includes(fileType)) {
    return {
      valid: false,
      error: `File type ${fileType} is not allowed. Allowed types: ${allowedTypes.join(
        ", ",
      )}`,
    };
  }

  if (fileSize > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    const fileSizeMB = Math.round(fileSize / (1024 * 1024));
    return {
      valid: false,
      error: `File size ${fileSizeMB}MB exceeds maximum allowed size of ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
};

/** Verify an object in our bucket is at most `maxBytes` (defense after presigned upload). */
export async function assertS3ObjectContentLengthAtMost(
  s3Key: string,
  maxBytes: number,
): Promise<void> {
  try {
    const s3Client = await getS3Client();
    const bucketName = getBucketName();
    const out = await s3Client.send(
      new HeadObjectCommand({ Bucket: bucketName, Key: s3Key }),
    );
    const len = out.ContentLength;
    if (typeof len === "number" && len > maxBytes) {
      throw new AppError(
        `File exceeds the maximum size of ${Math.round(maxBytes / (1024 * 1024))} MB`,
        400,
      );
    }
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError("Could not verify uploaded file", 400);
  }
}

/**
 * Get file validation rules based on folder name
 * @param folderName - Name of the folder
 * @returns Validation rules
 */
export const getFileValidationRules = (
  folderName: string,
): {
  allowedTypes: string[];
  maxSize: number;
} => {
  if (
    folderName === "internship-submission-documents" ||
    folderName.startsWith("internship-submission-documents/")
  ) {
    return {
      allowedTypes: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "text/csv",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        // ZIP archives — common for code/project submissions. Browsers
        // report either of these MIME types depending on OS/source.
        "application/zip",
        "application/x-zip-compressed",
      ],
      maxSize: INTERNSHIP_SUBMISSION_MAX_FILE_BYTES,
    };
  }

  // Admin-side reference files attached to file-type questions. Same set as
  // learner submissions plus a larger budget so admins can attach hefty
  // templates / starter ZIPs.
  if (
    folderName === "internship-questions/references" ||
    folderName.startsWith("internship-questions/references/")
  ) {
    return {
      allowedTypes: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "text/csv",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "application/zip",
        "application/x-zip-compressed",
      ],
      maxSize: 50 * 1024 * 1024, // 50MB
    };
  }

  const rules: { [key: string]: { allowedTypes: string[]; maxSize: number } } =
    {
      "course-thumbnails": {
        allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
        maxSize: 10 * 1024 * 1024, // 10MB
      },
      "course-videos": {
        allowedTypes: [
          "video/mp4",
          "video/avi",
          "video/mov",
          "video/wmv",
          "video/webm",
          "video/mkv",
        ],
        maxSize: 10 * 1024 * 1024 * 1024, // 10GB
      },
      "course-documents": {
        allowedTypes: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "text/plain",
          "text/csv",
        ],
        maxSize: 500 * 1024 * 1024, // 500MB
      },
      "user-avatars": {
        allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
        maxSize: 5 * 1024 * 1024, // 5MB
      },
      "profile-images": {
        allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
        maxSize: 5 * 1024 * 1024, // 5MB
      },
      general: {
        allowedTypes: [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
          "application/pdf",
          "text/plain",
        ],
        maxSize: 100 * 1024 * 1024, // 100MB
      },
    };

  // Handle dynamic course folder structure
  if (folderName.includes("/modules")) {
    // Course module thumbnails
    return rules["course-thumbnails"];
  } else if (folderName.includes("/preview_video")) {
    // Course preview videos
    return rules["course-videos"];
  } else if (folderName.includes("/content")) {
    // Course content - allow all types (videos, documents, images)
    return {
      allowedTypes: [
        // Images
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        // Videos
        "video/mp4",
        "video/avi",
        "video/mov",
        "video/wmv",
        "video/webm",
        "video/mkv",
        // Documents
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "text/csv",
      ],
      maxSize: 10 * 1024 * 1024 * 1024, // 10GB for course content videos
    };
  }

  return rules[folderName] || rules["general"];
};

/**
 * Upload a file buffer directly to S3 (server-side upload)
 * @param fileBuffer - File buffer to upload
 * @param fileName - Name of the file
 * @param folderName - S3 folder path
 * @param contentType - MIME type of the file
 * @returns Public URL of the uploaded file
 */
export const uploadFileToS3 = async (
  fileBuffer: Buffer,
  fileName: string,
  folderName: string,
  contentType: string,
): Promise<string> => {
  try {
    const s3Client = await getS3Client();
    const bucketName = getBucketName();

    // Generate unique file name to avoid conflicts
    const fileExtension = fileName.split(".").pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const s3Key = `${folderName}/${uniqueFileName}`;

    // Create the command for putting an object
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: {
        originalName: fileName,
        folderName: folderName,
      },
    });

    // Upload the file
    await s3Client.send(command);

    // Generate public URL (uses custom domain if AWS_S3_PUBLIC_BASE_URL is set)
    const publicUrl = `${getPublicUrlBase()}/${s3Key}`;

    return publicUrl;
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw new AppError("Failed to upload file to S3", 500);
  }
};

const IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

const CONTENT_TYPE_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

/**
 * Download an image from a URL and upload it to S3.
 * Used for OAuth profile pictures (Google, LinkedIn) so we store our own copy.
 * @param imageUrl - HTTP(S) URL of the image to download
 * @param folderName - S3 folder path (e.g. "profile-images")
 * @returns Public S3 URL, or null if download/upload fails (caller should fall back to original URL)
 */
export const downloadImageAndUploadToS3 = async (
  imageUrl: string,
  folderName: string,
): Promise<string | null> => {
  if (!imageUrl || typeof imageUrl !== "string") return null;
  const trimmed = imageUrl.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return null;
  }

  try {
    const response = await axios.get(trimmed, {
      responseType: "arraybuffer",
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 300,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; EdulytLMS/1.0; +https://edulyt.com)",
        Accept: "image/*",
      },
    });

    const buffer = Buffer.from(response.data);
    if (buffer.length === 0) return null;

    let contentType =
      response.headers["content-type"]?.split(";")[0]?.trim().toLowerCase() ||
      "";
    if (!IMAGE_CONTENT_TYPES.includes(contentType)) {
      // Try to infer from magic bytes
      if (buffer[0] === 0xff && buffer[1] === 0xd8) contentType = "image/jpeg";
      else if (buffer[0] === 0x89 && buffer[1] === 0x50)
        contentType = "image/png";
      else if (buffer[0] === 0x47 && buffer[1] === 0x49)
        contentType = "image/gif";
      else if (buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42)
        contentType = "image/webp";
    }
    if (!IMAGE_CONTENT_TYPES.includes(contentType)) {
      console.warn(
        `OAuth profile image: unsupported content-type "${contentType}", skipping S3 upload`,
      );
      return null;
    }

    const ext = CONTENT_TYPE_TO_EXT[contentType] || "jpg";
    const fileName = `oauth-${uuidv4()}.${ext}`;
    const publicUrl = await uploadFileToS3(
      buffer,
      fileName,
      folderName,
      contentType,
    );
    return publicUrl;
  } catch (error) {
    console.error("Error downloading/uploading OAuth profile image:", error);
    return null;
  }
};
