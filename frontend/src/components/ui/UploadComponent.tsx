"use client";
import React, { useState, useCallback, useEffect } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2, Copy, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import uploadService, { UploadResponse } from '@/services/uploadService';

export interface UploadComponentProps {
  onUploadComplete: (url: string, fileName: string) => void;
  onUploadError?: (error: string) => void;
  onUploadStart?: () => void;
  acceptedFileTypes: string[];
  uploadType: 'thumbnail' | 'video' | 'instructor-image' | 'lesson-video' | 'module-thumbnail';
  maxFileSize?: number; // in bytes
  className?: string;
  placeholder?: string;
  currentUrl?: string;
  disabled?: boolean;
  showProgress?: boolean;
  allowUrlInput?: boolean;
}

interface UploadState {
  isUploading: boolean;
  uploadProgress: number;
  dragOver: boolean;
  uploadedFile: { name: string; url: string; size?: number } | null;
  error: string | null;
  uploadSpeed: number; // bytes per second
  timeRemaining: number; // seconds
  startTime: number;
}

export const UploadComponent: React.FC<UploadComponentProps> = ({
  onUploadComplete,
  onUploadError,
  onUploadStart,
  acceptedFileTypes,
  uploadType,
  maxFileSize = 100 * 1024 * 1024, // 100MB default
  className,
  placeholder,
  currentUrl,
  disabled = false,
  showProgress = true,
  allowUrlInput = true,
}) => {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    uploadProgress: 0,
    dragOver: false,
    uploadedFile: currentUrl ? { name: 'Current file', url: currentUrl } : null,
    error: null,
    uploadSpeed: 0,
    timeRemaining: 0,
    startTime: 0,
  });

  const [manualUrl, setManualUrl] = useState(currentUrl || '');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Update uploaded file when currentUrl changes
  useEffect(() => {
    if (currentUrl && currentUrl !== state.uploadedFile?.url) {
      setState(prev => ({
        ...prev,
        uploadedFile: { name: 'Current file', url: currentUrl }
      }));
      setManualUrl(currentUrl);
    }
  }, [currentUrl]);

  const calculateUploadMetrics = (progress: number, fileSize: number, startTime: number) => {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - startTime) / 1000; // seconds
    const uploadedBytes = (progress / 100) * fileSize;
    const speed = uploadedBytes / elapsedTime; // bytes per second
    const remainingBytes = fileSize - uploadedBytes;
    const timeRemaining = remainingBytes / speed; // seconds

    return {
      speed: speed || 0,
      timeRemaining: isFinite(timeRemaining) ? timeRemaining : 0,
    };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return '';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    if (!bytesPerSecond) return '';
    return `${formatFileSize(bytesPerSecond)}/s`;
  };

  const uploadFile = async (file: File) => {
    const startTime = Date.now();
    setState(prev => ({
      ...prev,
      isUploading: true,
      error: null,
      uploadProgress: 0,
      startTime,
      uploadSpeed: 0,
      timeRemaining: 0,
    }));

    onUploadStart?.();

    try {
      // Validate file
      const validation = uploadService.validateFile(file, acceptedFileTypes, maxFileSize);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      let uploadPromise: Promise<UploadResponse>;

      // Choose the appropriate upload method based on type
      switch (uploadType) {
        case 'thumbnail':
        case 'module-thumbnail':
          uploadPromise = uploadService.uploadCourseThumbnail(file);
          break;
        case 'video':
          uploadPromise = uploadService.uploadCourseVideo(file);
          break;
        case 'lesson-video':
          uploadPromise = uploadService.uploadLessonVideo(file);
          break;
        case 'instructor-image':
          uploadPromise = uploadService.uploadInstructorImage(file);
          break;
        default:
          throw new Error('Invalid upload type');
      }

      // Enhanced progress simulation for better UX
      const progressInterval = setInterval(() => {
        setState(prev => {
          const newProgress = Math.min(prev.uploadProgress + (Math.random() * 15), 90);
          const metrics = calculateUploadMetrics(newProgress, file.size, startTime);
          
          return {
            ...prev,
            uploadProgress: newProgress,
            uploadSpeed: metrics.speed,
            timeRemaining: metrics.timeRemaining,
          };
        });
      }, uploadType === 'video' || uploadType === 'lesson-video' ? 500 : 200);

      const result = await uploadPromise;

      clearInterval(progressInterval);

      if (result.success && result.data?.url) {
        setState(prev => ({
          ...prev,
          uploadProgress: 100,
          uploadedFile: { 
            name: file.name, 
            url: result.data!.url!,
            size: file.size 
          },
          uploadSpeed: 0,
          timeRemaining: 0,
        }));

        onUploadComplete(result.data.url, file.name);
        setShowUrlInput(false);
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      onUploadError?.(errorMessage);
    } finally {
      setState(prev => ({
        ...prev,
        isUploading: false,
      }));
    }
  };

  const handleFileSelect = useCallback((file: File) => {
    if (disabled || state.isUploading) return;
    uploadFile(file);
  }, [disabled, state.isUploading]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, dragOver: false }));
    
    if (disabled || state.isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, state.isUploading, handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !state.isUploading) {
      setState(prev => ({ ...prev, dragOver: true }));
    }
  }, [disabled, state.isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, dragOver: false }));
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const removeFile = () => {
    setState(prev => ({
      ...prev,
      uploadedFile: null,
      error: null,
      uploadProgress: 0,
    }));
    setManualUrl('');
    onUploadComplete('', '');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.warn('Failed to copy to clipboard:', error);
    }
  };

  const handleManualUrlSubmit = () => {
    if (manualUrl.trim()) {
      setState(prev => ({
        ...prev,
        uploadedFile: { name: 'External URL', url: manualUrl.trim() },
        error: null,
      }));
      onUploadComplete(manualUrl.trim(), 'External URL');
      setShowUrlInput(false);
    }
  };

  const getFileTypeText = () => {
    switch (uploadType) {
      case 'thumbnail':
      case 'module-thumbnail':
        return 'image';
      case 'video':
      case 'lesson-video':
        return 'video';
      case 'instructor-image':
        return 'image';
      default:
        return 'file';
    }
  };

  const isVideoUpload = uploadType === 'video' || uploadType === 'lesson-video';

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Upload Area */}
      <div className={cn(
        "relative border-2 border-dashed rounded-lg transition-all duration-200",
        state.dragOver && !disabled ? "border-orange-400 bg-orange-50" : "border-gray-300",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-orange-400",
        state.error ? "border-red-300 bg-red-50" : "",
        state.uploadedFile ? "border-green-300 bg-green-50" : ""
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}>
        <input
          type="file"
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileInputChange}
          disabled={disabled || state.isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          multiple={false}
        />

        <div className="p-6 text-center">
          {state.isUploading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">
                  Uploading {getFileTypeText()}...
                </div>
                {showProgress && (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${state.uploadProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{Math.round(state.uploadProgress)}%</span>
                      {isVideoUpload && state.uploadSpeed > 0 && (
                        <span>{formatSpeed(state.uploadSpeed)}</span>
                      )}
                    </div>
                    {isVideoUpload && state.timeRemaining > 0 && (
                      <div className="text-xs text-gray-500">
                        {formatTime(state.timeRemaining)} remaining
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : state.uploadedFile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-green-700">
                  {getFileTypeText()} uploaded successfully
                </div>
                <div className="text-xs text-green-600 break-all">
                  {state.uploadedFile.name}
                </div>
                {state.uploadedFile.size && (
                  <div className="text-xs text-gray-500">
                    {formatFileSize(state.uploadedFile.size)}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(state.uploadedFile!.url)}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                >
                  <Copy className="h-3 w-3" />
                  Copy URL
                </button>
                <a
                  href={state.uploadedFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  View
                </a>
                <button
                  type="button"
                  onClick={removeFile}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  <X className="h-3 w-3" />
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <Upload className="h-8 w-8 text-gray-400" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-700">
                  {placeholder || `Click to upload or drag and drop your ${getFileTypeText()}`}
                </div>
                <div className="text-xs text-gray-500">
                  {acceptedFileTypes.join(', ')} up to {formatFileSize(maxFileSize)}
                </div>
                {isVideoUpload && (
                  <div className="text-xs text-blue-600">
                    Large videos may take several minutes to upload
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">{state.error}</div>
        </div>
      )}

      {/* Manual URL Input */}
      {allowUrlInput && (
        <div className="space-y-2">
          {!showUrlInput ? (
            <button
              type="button"
              onClick={() => setShowUrlInput(true)}
              disabled={disabled || state.isUploading}
              className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
            >
              Or enter {getFileTypeText()} URL manually
            </button>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {getFileTypeText()} URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder={`https://example.com/${getFileTypeText()}.${uploadType === 'video' || uploadType === 'lesson-video' ? 'mp4' : 'jpg'}`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                  disabled={disabled || state.isUploading}
                />
                <button
                  type="button"
                  onClick={handleManualUrlSubmit}
                  disabled={!manualUrl.trim() || disabled || state.isUploading}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 transition-colors text-sm"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUrlInput(false);
                    setManualUrl(currentUrl || '');
                  }}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadComponent; 