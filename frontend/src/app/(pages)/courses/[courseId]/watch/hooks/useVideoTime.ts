import { useState, useRef } from 'react';

interface VideoTimeState {
  currentTime: number;
  duration: number;
  formattedCurrentTime: string;
  formattedDuration: string;
  progress: number; // percentage (0-100)
  isLoaded: boolean;
  isPlaying: boolean;
}

export const useVideoTime = () => {
  const [timeState, setTimeState] = useState<VideoTimeState>({
    currentTime: 0,
    duration: 0,
    formattedCurrentTime: '0:00',
    formattedDuration: '0:00',
    progress: 0,
    isLoaded: false,
    isPlaying: false,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Format time in MM:SS or HH:MM:SS format
  const formatTime = (time: number): string => {
    if (!time || isNaN(time)) return '0:00';
    
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  // Update time state
  const updateTimeState = (video: HTMLVideoElement) => {
    const currentTime = video.currentTime || 0;
    const duration = video.duration || 0;
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    setTimeState({
      currentTime,
      duration,
      formattedCurrentTime: formatTime(currentTime),
      formattedDuration: formatTime(duration),
      progress,
      isLoaded: duration > 0,
      isPlaying: !video.paused,
    });
  };

  // Connect to video element
  const connectToVideo = (video: HTMLVideoElement) => {
    videoRef.current = video;

    const handleTimeUpdate = () => updateTimeState(video);
    const handleLoadedMetadata = () => updateTimeState(video);
    const handleDurationChange = () => updateTimeState(video);
    const handlePlay = () => updateTimeState(video);
    const handlePause = () => updateTimeState(video);

    // Add event listeners
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    // Initial update
    updateTimeState(video);

    // Return cleanup function
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  };

  // Disconnect from video element
  const disconnectFromVideo = () => {
    videoRef.current = null;
    setTimeState({
      currentTime: 0,
      duration: 0,
      formattedCurrentTime: '0:00',
      formattedDuration: '0:00',
      progress: 0,
      isLoaded: false,
      isPlaying: false,
    });
  };

  // Seek to specific time
  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(time, videoRef.current.duration || 0));
    }
  };

  // Seek to percentage
  const seekToPercentage = (percentage: number) => {
    if (videoRef.current && videoRef.current.duration) {
      const time = (percentage / 100) * videoRef.current.duration;
      seekTo(time);
    }
  };

  // Play video
  const play = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  // Pause video
  const pause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        play();
      } else {
        pause();
      }
    }
  };

  return {
    ...timeState,
    connectToVideo,
    disconnectFromVideo,
    seekTo,
    seekToPercentage,
    play,
    pause,
    togglePlay,
    formatTime, // Export for external use
  };
}; 