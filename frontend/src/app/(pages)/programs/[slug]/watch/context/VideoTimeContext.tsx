"use client";
import React, { createContext, useContext, ReactNode, useMemo } from "react";
import { useVideoTime, formatTime } from "../hooks/useVideoTime";

/**
 * Playback state is split across two contexts on purpose.
 *
 * `useVideoTime` calls `setState` on every `timeupdate`, roughly four times a
 * second. React re-renders *every* consumer of a context when its value
 * changes, regardless of which field that consumer actually reads, so a single
 * combined context makes the whole subtree re-render for the duration of
 * playback. Splitting lets a consumer that only needs `seekTo` subscribe to a
 * value that never changes identity, and pay nothing.
 *
 * Rule of thumb: if you need a number that moves, use `useVideoTimeState`. For
 * anything else, use `useVideoControls`.
 */

interface VideoControlsContextType {
  connectToVideo: (video: HTMLVideoElement) => void;
  disconnectFromVideo: () => void;
  seekTo: (time: number) => void;
  seekToPercentage: (percentage: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  /** Reads the attached-player sequence without subscribing to it. */
  getConnectionSeq: () => number;
  formatTime: (time: number) => string;
}

interface VideoTimeStateContextType {
  currentTime: number;
  duration: number;
  formattedCurrentTime: string;
  formattedDuration: string;
  progress: number;
  isLoaded: boolean;
  isPlaying: boolean;
  /** Increments each time a new <video> element is attached. */
  connectionSeq: number;
}

interface VideoTimeProviderProps {
  children: ReactNode;
}

const VideoControlsContext = createContext<VideoControlsContextType | undefined>(
  undefined
);

const VideoTimeStateContext = createContext<
  VideoTimeStateContextType | undefined
>(undefined);

export const VideoTimeProvider: React.FC<VideoTimeProviderProps> = ({
  children,
}) => {
  const {
    currentTime,
    duration,
    formattedCurrentTime,
    formattedDuration,
    progress,
    isLoaded,
    isPlaying,
    connectionSeq,
    connectToVideo,
    disconnectFromVideo,
    seekTo,
    seekToPercentage,
    play,
    pause,
    togglePlay,
    getConnectionSeq,
  } = useVideoTime();

  // Every member is a stable `useCallback` (or a module-scope function), so
  // this object is built once and never invalidates its consumers.
  const controls = useMemo<VideoControlsContextType>(
    () => ({
      connectToVideo,
      disconnectFromVideo,
      seekTo,
      seekToPercentage,
      play,
      pause,
      togglePlay,
      getConnectionSeq,
      formatTime,
    }),
    [
      connectToVideo,
      disconnectFromVideo,
      seekTo,
      seekToPercentage,
      play,
      pause,
      togglePlay,
      getConnectionSeq,
    ]
  );

  const timeStateValue = useMemo<VideoTimeStateContextType>(
    () => ({
      currentTime,
      duration,
      formattedCurrentTime,
      formattedDuration,
      progress,
      isLoaded,
      isPlaying,
      connectionSeq,
    }),
    [
      currentTime,
      duration,
      formattedCurrentTime,
      formattedDuration,
      progress,
      isLoaded,
      isPlaying,
      connectionSeq,
    ]
  );

  return (
    <VideoControlsContext.Provider value={controls}>
      <VideoTimeStateContext.Provider value={timeStateValue}>
        {children}
      </VideoTimeStateContext.Provider>
    </VideoControlsContext.Provider>
  );
};

/** Player actions. Subscribing to these never causes a re-render. */
export const useVideoControls = () => {
  const context = useContext(VideoControlsContext);
  if (context === undefined) {
    throw new Error("useVideoControls must be used within a VideoTimeProvider");
  }
  return context;
};

/** Live playback position. Re-renders roughly four times a second. */
export const useVideoTimeState = () => {
  const context = useContext(VideoTimeStateContext);
  if (context === undefined) {
    throw new Error(
      "useVideoTimeState must be used within a VideoTimeProvider"
    );
  }
  return context;
};

/**
 * Both halves at once.
 *
 * Convenience for existing callers; prefer the narrower hooks in new code,
 * since this one re-renders on every playback tick whether or not you read a
 * ticking field.
 */
export const useVideoTimeContext = () => {
  const controls = useVideoControls();
  const timeState = useVideoTimeState();
  return { ...timeState, ...controls };
};
