import apiClient from '@/configs/apiConfig';

/**
 * Get a presigned URL for secure file access
 * @param key - The S3 key of the file
 * @param expiresInSeconds - Number of seconds until the URL expires (default: 60)
 * @returns Promise<string> - The presigned URL
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const url = await getPresignedUrl('course-videos/lesson1.mp4');
 * 
 * // With custom expiration
 * const url = await getPresignedUrl('course-videos/lesson1.mp4', 3600); // 1 hour
 * ```
 */
export const getPresignedUrl = async (
  key: string, 
  expiresInSeconds: number = 60
): Promise<string> => {
  try {
    const response = await apiClient.post('/api/upload/presigned-url/access', {
      s3Key: key,
      expiresIn: expiresInSeconds
    });

    if (response.data.success) {
      return response.data.data.presignedUrl;
    } else {
      throw new Error(response.data.message || 'Failed to generate presigned URL');
    }
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error('Failed to generate secure access URL');
  }
};

/**
 * Get a presigned URL for video streaming with longer expiration
 * @param key - The S3 key of the video file
 * @param expiresInSeconds - Number of seconds until the URL expires (default: 3600 for videos)
 * @returns Promise<string> - The presigned URL
 * 
 * @example
 * ```typescript
 * // For video streaming (1 hour default)
 * const videoUrl = await getVideoPresignedUrl('course-videos/lesson1.mp4');
 * 
 * // For longer video sessions
 * const videoUrl = await getVideoPresignedUrl('course-videos/lesson1.mp4', 7200); // 2 hours
 * ```
 */
export const getVideoPresignedUrl = async (
  key: string, 
  expiresInSeconds: number = 3600
): Promise<string> => {
  return getPresignedUrl(key, expiresInSeconds);
};

/**
 * Utility function to check if a string is an S3 key (not a full URL)
 * @param str - The string to check
 * @returns boolean - True if it's likely an S3 key
 * 
 * @example
 * ```typescript
 * const isS3Key = isS3Key('course-videos/lesson1.mp4'); // true
 * const isS3Key = isS3Key('https://example.com/video.mp4'); // false
 * ```
 */
export const isS3Key = (str: string): boolean => {
  return !str.startsWith('http://') && !str.startsWith('https://');
};
