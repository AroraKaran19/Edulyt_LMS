import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  X,
  Image,
  Video,
  FileText,
  AlertCircle,
  Link,
  File,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpload } from "@/hooks/useUpload";

interface UploadMediaContainerProps {
  title: string;
  description: string;
  type: "image" | "video" | "document";
  mediaUrl?: string;
  mediaSource?: "upload" | "url"; // Track whether current media came from upload or URL
  s3Key?: string; // S3 key for uploaded file to enable deletion from bucket
  maxSize?: number; // in MB
  acceptedFormats?: string[];
  onFileSelect?: (file: File, folderName: string) => void;
  onFileRemove?: () => void;
  onFileUpload?: (
    file: File,
    folderName: string,
    options?: { usePresignedUrl?: boolean; presignedUrlThresholdMb?: number }
  ) => Promise<string>; // Returns URL after upload
  onUrlSubmit?: (url: string) => void; // Handle URL submission
  isUploading?: boolean;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  allowUrlInput?: boolean; // Enable URL input option
  urlPlaceholder?: string; // Custom placeholder for URL input
  folderName: string; // Required folder name (determined programmatically)
  uploadContext?: string; // Additional context for folder naming (e.g., courseId, userId)
  showConfirmation?: boolean; // Show upload confirmation dialog
  onConfirmUpload?: (file: File, folderName: string) => Promise<boolean>; // Confirmation callback
  usePresignedUrl?: boolean; // Use presigned URL upload for large files
  presignedUrlThreshold?: number; // File size threshold in MB to use presigned URL (default: 100MB)
}

const UploadMediaContainer: React.FC<UploadMediaContainerProps> = ({
  title,
  description,
  type,
  mediaUrl,
  mediaSource: propMediaSource,
  s3Key,
  maxSize = 100, // 100MB default
  acceptedFormats,
  onFileSelect,
  onFileRemove,
  onFileUpload,
  onUrlSubmit,
  isUploading = false,
  error,
  disabled = false,
  required = false,
  className,
  allowUrlInput = false,
  urlPlaceholder,
  folderName,
  uploadContext,
  showConfirmation = true,
  onConfirmUpload,
  usePresignedUrl = false,
  presignedUrlThreshold = 100, // 100MB default threshold
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string>("");
  const [inputMethod, setInputMethod] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [urlSubmitted, setUrlSubmitted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userChangedTab, setUserChangedTab] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevMediaSource = useRef(propMediaSource);

  // Use upload hook for file operations
  const { deleteFile } = useUpload();

  // Generate final folder name with context if provided
  const finalFolderName = uploadContext
    ? `${folderName}/${uploadContext}`
    : folderName;

  // Determine if file should use presigned URL upload
  const shouldUsePresignedUrl = useCallback(
    (file: File): boolean => {
      return usePresignedUrl && file.size > presignedUrlThreshold * 1024 * 1024;
    },
    [usePresignedUrl, presignedUrlThreshold]
  );

  // Default accepted formats based on type
  const defaultFormats = {
    image: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    video: [".mp4", ".mov", ".avi", ".mkv", ".webm"],
    document: [".pdf", ".doc", ".docx", ".txt"],
  };

  const formats = acceptedFormats || defaultFormats[type];
  const accept = formats.join(",");

  // Auto-switch to the correct tab when media source changes (but not if user manually changed tab)
  useEffect(() => {
    // Only auto-switch if:
    // 1. We have a media source from parent
    // 2. URL input is allowed
    // 3. The media source actually changed (not just re-rendering)
    // 4. User hasn't manually changed tabs recently
    if (
      propMediaSource &&
      allowUrlInput &&
      propMediaSource !== prevMediaSource.current &&
      !userChangedTab
    ) {
      setInputMethod(propMediaSource);
    }

    // Update the previous media source reference
    prevMediaSource.current = propMediaSource;
  }, [propMediaSource, allowUrlInput, userChangedTab]);

  // Reset user tab change flag when media is removed
  useEffect(() => {
    if (!mediaUrl && !propMediaSource) {
      setUserChangedTab(false);
    }
  }, [mediaUrl, propMediaSource]);

  // File validation
  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        return `File size must be less than ${maxSize}MB`;
      }

      // Check file type
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      if (!formats.includes(fileExtension)) {
        return `File type must be one of: ${formats.join(", ")}`;
      }

      return null;
    },
    [maxSize, formats]
  );

  // URL validation
  const validateUrl = useCallback(
    (url: string): string | null => {
      if (!url.trim()) {
        return "URL is required";
      }

      try {
        new URL(url);
      } catch {
        return "Please enter a valid URL";
      }

      // More flexible validation for video URLs
      if (type === "video") {
        const videoUrlPatterns = [
          // YouTube patterns
          /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/,
          // Vimeo patterns
          /^https?:\/\/(www\.)?(vimeo\.com)\/.+/,
          // Other video platforms
          /^https?:\/\/(www\.)?(dailymotion\.com|twitch\.tv|facebook\.com|instagram\.com)\/.+/,
          // Direct video file links (with extensions)
          /\.(mp4|mov|avi|mkv|webm|m4v|3gp|flv|wmv)(\?.*)?$/i,
          // Generic video hosting domains
          /^https?:\/\/(www\.)?(.*\.)?(video|media|stream|content)\.(com|org|net|io|co|tv)\/.+/i,
        ];

        const isValidVideoUrl = videoUrlPatterns.some((pattern) =>
          pattern.test(url)
        );
        if (!isValidVideoUrl) {
          return "Please enter a valid video URL (YouTube, Vimeo, Twitch, or direct video link)";
        }
      }

      // Basic validation for image URLs
      if (type === "image") {
        const imageUrlPattern = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
        if (!imageUrlPattern.test(url)) {
          return "Please enter a valid image URL (.jpg, .png, .gif, .webp)";
        }
      }

      return null;
    },
    [type]
  );

  // Handle URL submission
  const handleUrlSubmit = useCallback(() => {
    setLocalError("");

    const validationError = validateUrl(urlInput);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    // Call the URL submit handler but don't switch to upload tab
    onUrlSubmit?.(urlInput);
    setUrlInput("");
    setUrlSubmitted(true);

    // Reset the success message after 3 seconds
    setTimeout(() => {
      setUrlSubmitted(false);
    }, 3000);
  }, [urlInput, validateUrl, onUrlSubmit]);

  // Handle file selection
  const handleFileSelect = useCallback(
    (file: File) => {
      setLocalError("");

      const validationError = validateFile(file);
      if (validationError) {
        setLocalError(validationError);
        return;
      }

      // Show confirmation dialog if enabled
      if (showConfirmation) {
        setPendingFile(file);
        setShowConfirmationDialog(true);
        return;
      }

      // Proceed with upload if no confirmation needed
      proceedWithUpload(file);
    },
    [validateFile, showConfirmation]
  );

  // Proceed with actual upload
  const proceedWithUpload = useCallback(
    (file: File) => {
      onFileSelect?.(file, finalFolderName);

      // Auto-upload if upload handler is provided
      if (onFileUpload) {
        onFileUpload(file, finalFolderName, {
          usePresignedUrl: shouldUsePresignedUrl(file),
          presignedUrlThresholdMb: presignedUrlThreshold,
        }).catch((err) => {
          setLocalError(err.message || "Upload failed");
        });
      }
    },
    [
      onFileSelect,
      onFileUpload,
      finalFolderName,
      shouldUsePresignedUrl,
      presignedUrlThreshold,
    ]
  );

  // Handle confirmation dialog result
  const handleConfirmUpload = useCallback(async () => {
    if (!pendingFile) return;

    try {
      // Call custom confirmation handler if provided
      if (onConfirmUpload) {
        const confirmed = await onConfirmUpload(pendingFile, finalFolderName);
        if (!confirmed) {
          setShowConfirmationDialog(false);
          setPendingFile(null);
          return;
        }
      }

      // Proceed with upload
      proceedWithUpload(pendingFile);
      setShowConfirmationDialog(false);
      setPendingFile(null);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Upload confirmation failed"
      );
      setShowConfirmationDialog(false);
      setPendingFile(null);
    }
  }, [pendingFile, onConfirmUpload, finalFolderName, proceedWithUpload]);

  // Handle confirmation dialog cancel
  const handleCancelUpload = useCallback(() => {
    setShowConfirmationDialog(false);
    setPendingFile(null);
  }, []);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled || isUploading) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [disabled, isUploading, handleFileSelect]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  // Handle click to open file dialog
  const handleClick = useCallback(() => {
    if (!disabled && !isUploading && !isDeleting) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading, isDeleting]);

  // Handle file removal
  const handleRemove = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      setLocalError("");
      setIsDeleting(true);

      try {
        // If we have an s3Key and the media was uploaded (not from URL), delete from bucket
        if (s3Key && propMediaSource === "upload") {
          const result = await deleteFile(s3Key);

          if (!result.success) {
            setLocalError(result.error || "Failed to delete file from storage");
            setIsDeleting(false);
            return;
          }
        }

        // Call the parent's remove handler
        onFileRemove?.();
      } catch (error) {
        console.error("Error deleting file:", error);
        setLocalError(
          error instanceof Error ? error.message : "Failed to delete file"
        );
      } finally {
        setIsDeleting(false);
      }
    },
    [onFileRemove, s3Key, propMediaSource, deleteFile]
  );

  // Handle input method change
  const handleMethodChange = useCallback((method: "upload" | "url") => {
    setInputMethod(method);
    setUserChangedTab(true);
    setLocalError("");
    setUrlInput("");
    setUrlSubmitted(false);

    // Reset the user changed tab flag after a short delay
    // This allows the next upload/URL submission to auto-switch tabs again
    setTimeout(() => {
      setUserChangedTab(false);
    }, 1000);
  }, []);

  // Get default placeholder for URL input
  const getUrlPlaceholder = () => {
    if (urlPlaceholder) return urlPlaceholder;

    switch (type) {
      case "video":
        return "https://youtube.com/watch?v=... or https://example.com/video.mp4";
      case "image":
        return "https://example.com/image.jpg";
      case "document":
        return "https://example.com/document.pdf";
      default:
        return "Enter URL...";
    }
  };

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case "image":
        return <Image className="w-8 h-8 text-gray-400" />;
      case "video":
        return <Video className="w-8 h-8 text-gray-400" />;
      case "document":
        return <FileText className="w-8 h-8 text-gray-400" />;
      default:
        return <Upload className="w-8 h-8 text-gray-400" />;
    }
  };

  const displayError = error || localError;

  return (
    <div
      className={cn(
        "w-full flex flex-col gap-3 bg-gray-50 p-2 border-2 border-dashed border-gray-300 rounded-lg",
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-medium text-gray-900">
          {title}
          {required && <span className="text-red-500 ml-1">*</span>}
        </h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      {/* Folder Info Display (optional) */}
      {finalFolderName &&
        finalFolderName.trim() !== "" &&
        inputMethod === "upload" && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-blue-700">
              Files will be uploaded to:{" "}
              <code className="bg-blue-100 px-1 rounded">
                {finalFolderName}
              </code>
            </span>
          </div>
        )}

      {/* Method Toggle (only show if URL input is allowed) */}
      {allowUrlInput && (
        <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
          <button
            type="button"
            onClick={() => handleMethodChange("upload")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all",
              inputMethod === "upload"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <File className="w-4 h-4" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => handleMethodChange("url")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all",
              inputMethod === "url"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Link className="w-4 h-4" />
            Add URL
          </button>
        </div>
      )}

      {/* URL Input Section */}
      {allowUrlInput && inputMethod === "url" ? (
        <div className="flex flex-col gap-3">
          {/* Show URL input form if not from URL source or no media URL */}
          {propMediaSource === "url" && mediaUrl ? (
            /* Show URL preview when URL is added via this tab */
            <div className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-green-300 bg-green-50 rounded-lg">
              {/* Preview for images */}
              {type === "image" && (
                <img
                  src={mediaUrl}
                  alt="Preview"
                  className="max-w-full max-h-32 object-contain rounded"
                />
              )}

              {/* Preview for videos */}
              {type === "video" && (
                <video
                  src={mediaUrl}
                  className="max-w-full max-h-32 object-contain rounded"
                  controls
                />
              )}

              {/* Preview for documents */}
              {type === "document" && (
                <div className="flex flex-col items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg">
                  <FileText className="w-12 h-12 text-blue-600" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">
                      Document uploaded successfully
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {mediaUrl.split('/').pop() || 'Document'}
                    </p>
                  </div>
                  <a
                    href={mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    View Document
                  </a>
                </div>
              )}

              {/* URL info */}
              <div className="flex items-center gap-2">
                <Link className="w-6 h-6 text-green-600" />
                <span className="text-sm text-green-700 font-medium">
                  URL added successfully
                </span>
              </div>

              {/* URL display */}
              <div className="text-xs text-gray-600 bg-white px-2 py-1 rounded border max-w-full truncate">
                {mediaUrl}
              </div>

              {/* Remove button */}
              <button
                onClick={handleRemove}
                disabled={isDeleting || isUploading}
                className="flex items-center gap-1 text-red-600 hover:text-red-700 bg-red-500/10 hover:bg-red-500/20 rounded-lg px-2 py-1 text-sm font-medium transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                ) : (
                  <X className="w-4 h-4" />
                )}
                {isDeleting ? "Removing..." : "Remove URL"}
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder={getUrlPlaceholder()}
                  className={cn(
                    "flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm",
                    "focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    displayError &&
                      "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                  )}
                  disabled={disabled || isUploading}
                />
                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  disabled={disabled || isUploading || !urlInput.trim()}
                  className={cn(
                    "px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg",
                    "hover:bg-orange-600 focus:ring-2 focus:ring-orange-500/20 focus:ring-offset-2",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-colors duration-200"
                  )}
                >
                  Add URL
                </button>
              </div>

              {/* URL Success Message */}
              {urlSubmitted && (
                <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>URL has been added successfully!</span>
                </div>
              )}

              {/* URL Help Text */}
              <p className="text-xs text-gray-500">
                {type === "video" &&
                  "Supports YouTube, Vimeo, Twitch, Facebook, Instagram, or direct video links"}
                {type === "image" &&
                  "Direct link to image file (.jpg, .png, .gif, .webp)"}
                {type === "document" && "Direct link to document file"}
              </p>
            </>
          )}
        </div>
      ) : (
        /* Upload Area */
        <div
          className={cn(
            "relative w-full border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
            dragActive && !disabled && !isDeleting
              ? "border-orange-400 bg-orange-50"
              : "border-gray-300 hover:border-gray-400",
            disabled || isDeleting
              ? "opacity-50 cursor-not-allowed bg-gray-50"
              : "cursor-pointer hover:bg-gray-50",
            displayError && "border-red-300 bg-red-50",
            propMediaSource === "upload" &&
              mediaUrl &&
              "border-green-300 bg-green-50"
          )}
          onDragEnter={disabled || isDeleting ? undefined : handleDrag}
          onDragLeave={disabled || isDeleting ? undefined : handleDrag}
          onDragOver={disabled || isDeleting ? undefined : handleDrag}
          onDrop={disabled || isDeleting ? undefined : handleDrop}
          onClick={disabled || isDeleting ? undefined : handleClick}
        >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled || isDeleting}
          />

          {/* Content */}
          {isUploading || isDeleting ? (
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <p className="text-sm text-gray-600">
                {isUploading ? "Uploading..." : "Deleting..."}
              </p>
            </div>
          ) : propMediaSource === "upload" && mediaUrl ? (
            <div className="flex flex-col items-center gap-3">
              {/* Preview for images */}
              {type === "image" && (
                <img
                  src={mediaUrl}
                  alt="Preview"
                  className="max-w-full max-h-32 object-contain rounded"
                />
              )}

              {/* Preview for videos */}
              {type === "video" && (
                <video
                  src={mediaUrl}
                  className="max-w-full max-h-32 object-contain rounded"
                  controls
                />
              )}

              {/* Preview for documents */}
              {type === "document" && (
                <div className="flex flex-col items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg">
                  <FileText className="w-12 h-12 text-blue-600" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">
                      Document uploaded successfully
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {mediaUrl.split('/').pop() || 'Document'}
                    </p>
                  </div>
                  <a
                    href={mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    View Document
                  </a>
                </div>
              )}

              {/* File info */}
              <div className="flex items-center gap-2">
                {getIcon()}
                <span className="text-sm text-gray-600">
                  File uploaded successfully
                </span>
              </div>

              {/* Remove button */}
              <button
                onClick={handleRemove}
                disabled={isDeleting || isUploading}
                className="flex items-center gap-1 text-red-600 hover:text-red-700 bg-red-500/10 hover:bg-red-500/20 rounded-lg px-2 py-1 text-sm font-medium transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                ) : (
                  <X className="w-4 h-4" />
                )}
                {isDeleting ? "Removing..." : "Remove"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              {getIcon()}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formats.join(", ").toUpperCase()} up to{" "}
                  {maxSize >= 1024
                    ? `${(maxSize / 1024).toFixed(0)}GB`
                    : `${maxSize.toFixed(0)}MB`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {displayError && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{displayError}</span>
        </div>
      )}

      {/* File info */}
      {mediaUrl && !displayError && (
        <div className="text-xs text-gray-500">
          Max file size: {maxSize}MB • Supported formats:{" "}
          {formats.join(", ").toUpperCase()}
        </div>
      )}

      {/* Upload Confirmation Dialog */}
      {showConfirmationDialog && pendingFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Upload className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirm Upload Location
                </h3>
                <p className="text-sm text-gray-600">
                  Verify where your file will be uploaded
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    File:
                  </span>
                  <span className="text-sm text-gray-900 truncate max-w-48">
                    {pendingFile.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Size:
                  </span>
                  <span className="text-sm text-gray-900">
                    {(pendingFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Destination:
                  </span>
                  <code className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded max-w-48 truncate">
                    {finalFolderName}
                  </code>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-blue-800">
                <strong>📁 Upload Location:</strong> Your file will be organized
                in the{" "}
                <code className="bg-blue-100 px-1 rounded">
                  {finalFolderName}
                </code>{" "}
                folder. This helps keep all course-related content organized
                together.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelUpload}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpload}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Confirm Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadMediaContainer;
