import React, { useState } from 'react';
import UploadMediaContainer from '../ui/container/UploadMediaContainer';
import { useUpload } from '@/hooks/useUpload';
import { generateCourseFolderName } from '@/utils/folderUtils';

const CourseUploadExample: React.FC = () => {
  const [courseTitle, setCourseTitle] = useState('JavaScript Fundamentals for Beginners');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  
  const { uploadFile, isUploading, error, clearError } = useUpload();

  // Generate folder names based on course title
  const thumbnailFolder = generateCourseFolderName(courseTitle, 'thumbnails');
  const videoFolder = generateCourseFolderName(courseTitle, 'videos');
  const materialsFolder = generateCourseFolderName(courseTitle, 'materials');

  const handleThumbnailUpload = async (file: File, folderName: string): Promise<string> => {
    try {
      const result = await uploadFile(file, folderName);
      if (result.success && result.data) {
        setThumbnailUrl(result.data.url);
        return result.data.url;
      }
      throw new Error(result.error || 'Upload failed');
    } catch (err) {
      console.error('Thumbnail upload failed:', err);
      throw err;
    }
  };

  const handleVideoUpload = async (file: File, folderName: string): Promise<string> => {
    try {
      const result = await uploadFile(file, folderName);
      if (result.success && result.data) {
        setVideoUrl(result.data.url);
        return result.data.url;
      }
      throw new Error(result.error || 'Upload failed');
    } catch (err) {
      console.error('Video upload failed:', err);
      throw err;
    }
  };

  const handleUploadConfirmation = async (file: File, folderName: string): Promise<boolean> => {
    // Custom confirmation logic can go here
    // For example, check if folder already exists, validate course title, etc.
    
    if (!courseTitle.trim()) {
      alert('Please enter a course title first!');
      return false;
    }
    
    // Return true to proceed with upload
    return true;
  };

  const handleRemoveThumbnail = () => {
    setThumbnailUrl('');
    clearError();
  };

  const handleRemoveVideo = () => {
    setVideoUrl('');
    clearError();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Course-Based Upload System
        </h1>
        <p className="text-gray-600">
          Files are organized by course name with confirmation dialogs
        </p>
      </div>

      {/* Course Title Input */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Course Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder="Enter your course title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be used to create organized folders in S3
            </p>
          </div>
        </div>
      </div>

      {/* Folder Structure Preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-800 mb-3">
          📁 S3 Folder Structure
        </h3>
        <div className="space-y-2 font-mono text-sm">
          <div className="text-blue-700">
            <span className="text-blue-500">├──</span> {thumbnailFolder}/
          </div>
          <div className="text-blue-700">
            <span className="text-blue-500">├──</span> {videoFolder}/
          </div>
          <div className="text-blue-700">
            <span className="text-blue-500">└──</span> {materialsFolder}/
          </div>
        </div>
        <p className="text-sm text-blue-600 mt-3">
          All course-related files will be organized under the course name folder
        </p>
      </div>

      {/* Upload Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Thumbnail Upload */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Course Thumbnail</h2>
          <UploadMediaContainer
            title="Upload Thumbnail"
            description={`Upload thumbnail for "${courseTitle}"`}
            type="image"
            mediaUrl={thumbnailUrl}
            maxSize={5}
            onFileUpload={handleThumbnailUpload}
            onFileRemove={handleRemoveThumbnail}
            folderName={thumbnailFolder}
            showConfirmation={true}
            onConfirmUpload={handleUploadConfirmation}
            isUploading={isUploading}
            error={error}
            required={true}
            allowUrlInput={true}
            urlPlaceholder="Enter thumbnail URL..."
          />
        </div>

        {/* Video Upload */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Course Preview Video</h2>
          <UploadMediaContainer
            title="Upload Preview Video"
            description={`Upload preview video for "${courseTitle}"`}
            type="video"
            mediaUrl={videoUrl}
            maxSize={100}
            onFileUpload={handleVideoUpload}
            onFileRemove={handleRemoveVideo}
            folderName={videoFolder}
            showConfirmation={true}
            onConfirmUpload={handleUploadConfirmation}
            isUploading={isUploading}
            error={error}
            required={false}
            allowUrlInput={true}
            urlPlaceholder="Enter video URL..."
          />
        </div>
      </div>

      {/* Upload Results */}
      {(thumbnailUrl || videoUrl) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-green-800 mb-4">
            ✅ Upload Results
          </h3>
          <div className="space-y-3">
            {thumbnailUrl && (
              <div>
                <p className="text-sm font-medium text-green-700">Thumbnail:</p>
                <a 
                  href={thumbnailUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-green-600 hover:text-green-800 underline break-all"
                >
                  {thumbnailUrl}
                </a>
              </div>
            )}
            {videoUrl && (
              <div>
                <p className="text-sm font-medium text-green-700">Video:</p>
                <a 
                  href={videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-green-600 hover:text-green-800 underline break-all"
                >
                  {videoUrl}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Features */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          🚀 Key Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">📂 Organized Structure</h4>
            <p className="text-sm text-gray-600">
              Files are automatically organized by course name and content type
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">✅ Upload Confirmation</h4>
            <p className="text-sm text-gray-600">
              Users see exactly where their files will be uploaded before confirming
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">🔄 Dynamic Folders</h4>
            <p className="text-sm text-gray-600">
              Folder names are generated automatically from course title
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">🎯 Type-Specific</h4>
            <p className="text-sm text-gray-600">
              Different content types go to appropriate subfolders
            </p>
          </div>
        </div>
      </div>

      {/* Example Folder Names */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-yellow-800 mb-3">
          💡 Example Folder Names
        </h3>
        <div className="space-y-2 text-sm">
          <div>
            <strong>Course:</strong> "React.js Complete Guide 2024!" 
            <br />
            <strong>Becomes:</strong> <code className="bg-yellow-100 px-1 rounded">reactjs-complete-guide-2024</code>
          </div>
          <div>
            <strong>Course:</strong> "Python for Data Science & AI" 
            <br />
            <strong>Becomes:</strong> <code className="bg-yellow-100 px-1 rounded">python-for-data-science-ai</code>
          </div>
        </div>
        <p className="text-sm text-yellow-700 mt-3">
          Special characters are removed and spaces become hyphens for clean folder names
        </p>
      </div>
    </div>
  );
};

export default CourseUploadExample;