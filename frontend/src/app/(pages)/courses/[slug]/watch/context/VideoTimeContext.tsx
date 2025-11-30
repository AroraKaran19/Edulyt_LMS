"use client";
import React, { createContext, useContext, ReactNode } from "react";
import { useVideoTime } from "../hooks/useVideoTime";

interface VideoTimeContextType {
  currentTime: number;
  duration: number;
  formattedCurrentTime: string;
  formattedDuration: string;
  progress: number;
  isLoaded: boolean;
  isPlaying: boolean;
  connectToVideo: (video: HTMLVideoElement) => void;
  disconnectFromVideo: () => void;
  seekTo: (time: number) => void;
  seekToPercentage: (percentage: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  formatTime: (time: number) => string;
}

interface VideoTimeProviderProps {
  children: ReactNode;
}

const VideoTimeContext = createContext<VideoTimeContextType | undefined>(
  undefined
);

export const VideoTimeProvider: React.FC<VideoTimeProviderProps> = ({
  children,
}) => {
  const videoTimeState = useVideoTime();

  return (
    <VideoTimeContext.Provider value={videoTimeState}>
      {children}
    </VideoTimeContext.Provider>
  );
};

export const useVideoTimeContext = () => {
  const context = useContext(VideoTimeContext);
  if (context === undefined) {
    throw new Error(
      "useVideoTimeContext must be used within a VideoTimeProvider"
    );
  }
  return context;
};
