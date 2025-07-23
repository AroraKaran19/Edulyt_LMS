"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2, Pause, Play, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import uploadService, { UploadResponse } from '@/services/uploadService';

export interface QueuedUpload {
  id: string;
  file: File;
  uploadType: 'thumbnail' | 'video' | 'instructor-image' | 'lesson-video' | 'module-thumbnail';
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'paused' | 'cancelled';
  progress: number;
  uploadSpeed: number;
  timeRemaining: number;
  startTime: number;
  result?: UploadResponse;
  error?: string;
  onComplete?: (url: string, fileName: string, id: string) => void;
  onError?: (error: string, id: string) => void;
}

interface UploadQueueProps {
  uploads: QueuedUpload[];
  onUpdate: (uploads: QueuedUpload[]) => void;
  maxConcurrent?: number;
  autoStart?: boolean;
  className?: string;
}

export const UploadQueue: React.FC<UploadQueueProps> = ({
  uploads,
  onUpdate,
  maxConcurrent = 2,
  autoStart = true,
  className,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

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

  const calculateUploadMetrics = (progress: number, fileSize: number, startTime: number) => {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - startTime) / 1000;
    const uploadedBytes = (progress / 100) * fileSize;
    const speed = uploadedBytes / elapsedTime;
    const remainingBytes = fileSize - uploadedBytes;
    const timeRemaining = remainingBytes / speed;

    return {
      speed: speed || 0,
      timeRemaining: isFinite(timeRemaining) ? timeRemaining : 0,
    };
  };

  const updateUpload = useCallback((id: string, updates: Partial<QueuedUpload>) => {
    const updatedUploads = uploads.map(upload => 
      upload.id === id ? { ...upload, ...updates } : upload
    );
    onUpdate(updatedUploads);
  }, [uploads, onUpdate]);

  const removeUpload = useCallback((id: string) => {
    const updatedUploads = uploads.filter(upload => upload.id !== id);
    onUpdate(updatedUploads);
  }, [uploads, onUpdate]);

  const uploadFile = async (upload: QueuedUpload) => {
    const startTime = Date.now();
    updateUpload(upload.id, {
      status: 'uploading',
      progress: 0,
      startTime,
      uploadSpeed: 0,
      timeRemaining: 0,
    });

    try {
      let uploadPromise: Promise<UploadResponse>;

      // Choose the appropriate upload method
      switch (upload.uploadType) {
        case 'thumbnail':
        case 'module-thumbnail':
          uploadPromise = uploadService.uploadCourseThumbnail(upload.file);
          break;
        case 'video':
          uploadPromise = uploadService.uploadCourseVideo(upload.file);
          break;
        case 'lesson-video':
          uploadPromise = uploadService.uploadLessonVideo(upload.file);
          break;
        case 'instructor-image':
          uploadPromise = uploadService.uploadInstructorImage(upload.file);
          break;
        default:
          throw new Error('Invalid upload type');
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        const currentUpload = uploads.find(u => u.id === upload.id);
        if (currentUpload?.status !== 'uploading') {
          clearInterval(progressInterval);
          return;
        }

        const newProgress = Math.min(currentUpload.progress + (Math.random() * 10), 90);
        const metrics = calculateUploadMetrics(newProgress, upload.file.size, startTime);
        
        updateUpload(upload.id, {
          progress: newProgress,
          uploadSpeed: metrics.speed,
          timeRemaining: metrics.timeRemaining,
        });
      }, upload.uploadType.includes('video') ? 500 : 200);

      const result = await uploadPromise;
      clearInterval(progressInterval);

      if (result.success && result.data?.url) {
        updateUpload(upload.id, {
          status: 'completed',
          progress: 100,
          result,
          uploadSpeed: 0,
          timeRemaining: 0,
        });

        upload.onComplete?.(result.data.url, upload.file.name, upload.id);
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      updateUpload(upload.id, {
        status: 'error',
        error: errorMessage,
        uploadSpeed: 0,
        timeRemaining: 0,
      });

      upload.onError?.(errorMessage, upload.id);
    }
  };

  const processQueue = useCallback(async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    const pendingUploads = uploads.filter(upload => upload.status === 'pending');
    const activeUploads = uploads.filter(upload => upload.status === 'uploading');
    
    // Start new uploads up to the concurrent limit
    const availableSlots = maxConcurrent - activeUploads.length;
    const uploadsToStart = pendingUploads.slice(0, availableSlots);
    
    const uploadPromises = uploadsToStart.map(upload => uploadFile(upload));
    
    if (uploadPromises.length > 0) {
      await Promise.all(uploadPromises);
    }
    
    setIsProcessing(false);
    
    // Check if there are more pending uploads
    const remainingPending = uploads.filter(upload => upload.status === 'pending');
    if (remainingPending.length > 0 && autoStart) {
      setTimeout(() => processQueue(), 100);
    }
  }, [uploads, isProcessing, maxConcurrent, autoStart]);

  // Auto-start processing when new uploads are added
  useEffect(() => {
    if (autoStart && uploads.some(upload => upload.status === 'pending')) {
      processQueue();
    }
  }, [uploads, autoStart, processQueue]);

  const pauseUpload = (id: string) => {
    updateUpload(id, { status: 'paused' });
  };

  const resumeUpload = (id: string) => {
    updateUpload(id, { status: 'pending' });
  };

  const cancelUpload = (id: string) => {
    updateUpload(id, { status: 'cancelled' });
  };

  const retryUpload = (id: string) => {
    updateUpload(id, { 
      status: 'pending', 
      progress: 0, 
      error: undefined,
      uploadSpeed: 0,
      timeRemaining: 0,
    });
  };

  const clearCompleted = () => {
    const activeUploads = uploads.filter(upload => 
      !['completed', 'error', 'cancelled'].includes(upload.status)
    );
    onUpdate(activeUploads);
  };

  const getStatusIcon = (upload: QueuedUpload) => {
    switch (upload.status) {
      case 'pending':
        return <Upload className="h-4 w-4 text-blue-500" />;
      case 'uploading':
        return <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-500" />;
      default:
        return <Upload className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-blue-600 bg-blue-50';
      case 'uploading': return 'text-orange-600 bg-orange-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'paused': return 'text-yellow-600 bg-yellow-50';
      case 'cancelled': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (uploads.length === 0) {
    return null;
  }

  const totalUploads = uploads.length;
  const completedUploads = uploads.filter(u => u.status === 'completed').length;
  const errorUploads = uploads.filter(u => u.status === 'error').length;
  const activeUploads = uploads.filter(u => u.status === 'uploading').length;

  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg shadow-sm", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Upload className="h-5 w-5 text-gray-600" />
          <div>
            <h3 className="text-sm font-medium text-gray-900">Upload Queue</h3>
            <p className="text-xs text-gray-500">
              {completedUploads}/{totalUploads} completed
              {errorUploads > 0 && `, ${errorUploads} failed`}
              {activeUploads > 0 && `, ${activeUploads} uploading`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearCompleted}
            disabled={completedUploads === 0 && errorUploads === 0}
            className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            Clear completed
          </button>
        </div>
      </div>

      {/* Upload List */}
      <div className="max-h-64 overflow-y-auto">
        {uploads.map((upload) => (
          <div key={upload.id} className="p-3 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {getStatusIcon(upload)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {upload.file.name}
                  </p>
                  <span className={cn(
                    "px-2 py-1 text-xs font-medium rounded-full",
                    getStatusColor(upload.status)
                  )}>
                    {upload.status}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                  <span>{formatFileSize(upload.file.size)}</span>
                  {upload.status === 'uploading' && upload.uploadSpeed > 0 && (
                    <span>{formatSpeed(upload.uploadSpeed)}</span>
                  )}
                </div>

                {/* Progress Bar */}
                {upload.status === 'uploading' && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{Math.round(upload.progress)}%</span>
                      {upload.timeRemaining > 0 && (
                        <span>{formatTime(upload.timeRemaining)} remaining</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {upload.status === 'error' && upload.error && (
                  <p className="text-xs text-red-600 mt-1">{upload.error}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {upload.status === 'uploading' && (
                  <button
                    onClick={() => pauseUpload(upload.id)}
                    className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                    title="Pause upload"
                  >
                    <Pause className="h-3 w-3" />
                  </button>
                )}
                
                {upload.status === 'paused' && (
                  <button
                    onClick={() => resumeUpload(upload.id)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    title="Resume upload"
                  >
                    <Play className="h-3 w-3" />
                  </button>
                )}
                
                {upload.status === 'error' && (
                  <button
                    onClick={() => retryUpload(upload.id)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    title="Retry upload"
                  >
                    <Upload className="h-3 w-3" />
                  </button>
                )}
                
                {!['uploading'].includes(upload.status) && (
                  <button
                    onClick={() => removeUpload(upload.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Remove from queue"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadQueue; 