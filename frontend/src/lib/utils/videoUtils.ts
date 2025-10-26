/**
 * Utility functions for video handling
 */

/**
 * Extracts video duration from a video file or URL
 * @param video - Video file or URL
 * @returns Promise<number> - Duration in seconds
 */
export const getVideoDuration = (video: File | string): Promise<number> => {
  return new Promise((resolve, reject) => {
    const videoElement = document.createElement('video');
    
    videoElement.addEventListener('loadedmetadata', () => {
      const duration = Math.round(videoElement.duration);
      resolve(duration);
    });
    
    videoElement.addEventListener('error', (e) => {
      reject(new Error('Failed to load video metadata: ' + e.message));
    });
    
    if (video instanceof File) {
      videoElement.src = URL.createObjectURL(video);
    } else {
      videoElement.src = video;
    }
    
    videoElement.load();
  });
};

/**
 * Formats duration in seconds to a human-readable string
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "2:30", "1:05:30")
 */
export const formatDuration = (seconds: number): string => {
  if (!seconds || seconds < 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
};

/**
 * Parses a duration string to seconds
 * @param durationString - Duration string (e.g., "2:30", "1:05:30")
 * @returns Duration in seconds
 */
export const parseDuration = (durationString: string): number => {
  if (!durationString) return 0;
  
  const parts = durationString.split(':').map(part => parseInt(part, 10));
  
  if (parts.length === 2) {
    // MM:SS format
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS format
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  
  return 0;
};

/**
 * Validates if a duration string is in correct format
 * @param durationString - Duration string to validate
 * @returns True if valid format
 */
export const isValidDurationFormat = (durationString: string): boolean => {
  if (!durationString) return false;
  
  const regex = /^(\d{1,2}:)?[0-5]?\d:[0-5]\d$/;
  return regex.test(durationString);
};
