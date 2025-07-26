'use client';

import React, { useState, useRef } from 'react';
import { largeFileUploader, UploadProgress } from '../utils/largeFileUpload';

interface LargeFileUploadProps {
  onUploadComplete?: (result: { success: boolean; url?: string; fileName?: string; error?: string }) => void;
  acceptedFileTypes?: string;
  maxFileSize?: number; // in bytes, default 50GB
}

const LargeFileUpload: React.FC<LargeFileUploadProps> = ({
  onUploadComplete,
  acceptedFileTypes = "video/*,.zip,.pdf",
  maxFileSize = 50 * 1024 * 1024 * 1024 // 50GB
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadStartTime, setUploadStartTime] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxFileSize) {
      setError(`File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(maxFileSize)})`);
      return;
    }

    setSelectedFile(file);
    setError(null);
    setUploadResult(null);
    setUploadProgress(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    setUploadResult(null);
    setUploadProgress(null);

    const startTime = Date.now();
    setUploadStartTime(startTime);

    try {
      const result = await largeFileUploader.uploadLargeFile(selectedFile, {
        chunkSize: 100 * 1024 * 1024, // 100MB chunks
        maxConcurrentUploads: 3,
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
        onError: (error) => {
          setError(error.message);
        }
      });

      const endTime = Date.now();
      const uploadTime = (endTime - startTime) / 1000;

      if (result.success) {
        setUploadResult(`✅ Upload completed successfully in ${formatTime(uploadTime)}!\nFile URL: ${result.url}`);
      } else {
        setError(result.error || 'Upload failed');
      }

      if (onUploadComplete) {
        onUploadComplete(result);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      setUploadStartTime(null);
    }
  };

  const handleCancel = () => {
    largeFileUploader.cancelUpload();
    setIsUploading(false);
    setUploadProgress(null);
    setUploadStartTime(null);
    setError('Upload cancelled by user');
  };

  const handleReset = () => {
    setSelectedFile(null);
    setIsUploading(false);
    setUploadProgress(null);
    setUploadResult(null);
    setError(null);
    setUploadStartTime(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Large File Upload (up to 50GB)</h2>
      
      {/* File Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Large File
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFileTypes}
          onChange={handleFileSelect}
          disabled={isUploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
        />
        <p className="text-xs text-gray-500 mt-1">
          Supported formats: Videos, ZIP files, PDFs. Maximum size: {formatFileSize(maxFileSize)}
        </p>
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">Selected File:</h3>
          <p className="text-sm text-gray-600">
            <strong>Name:</strong> {selectedFile.name}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Size:</strong> {formatFileSize(selectedFile.size)}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Type:</strong> {selectedFile.type || 'Unknown'}
          </p>
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-blue-800">
              Uploading... {uploadProgress.percentage}%
            </span>
            <span className="text-sm text-blue-600">
              Part {uploadProgress.currentPart} of {uploadProgress.totalParts}
            </span>
          </div>
          
          <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress.percentage}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-blue-600">
            <span>{formatFileSize(uploadProgress.loaded)} / {formatFileSize(uploadProgress.total)}</span>
            <span>
              {uploadProgress.loaded > 0 && uploadProgress.total > 0 && uploadStartTime && (
                `${formatFileSize(uploadProgress.loaded / ((Date.now() - uploadStartTime) / 1000))}/s`
              )}
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {uploadResult && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <pre className="text-green-800 text-sm whitespace-pre-wrap">{uploadResult}</pre>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        {!isUploading ? (
          <>
            <button
              onClick={handleUpload}
              disabled={!selectedFile}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Start Upload
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </>
        ) : (
          <button
            onClick={handleCancel}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Cancel Upload
          </button>
        )}
      </div>

      {/* Upload Tips */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-medium text-yellow-800 mb-2">💡 Upload Tips:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Large files are uploaded in 100MB chunks for reliability</li>
          <li>• You can safely close this tab during upload - it will continue</li>
          <li>• Upload speed depends on your internet connection</li>
          <li>• Files are stored securely in AWS S3</li>
        </ul>
      </div>
    </div>
  );
};

export default LargeFileUpload; 