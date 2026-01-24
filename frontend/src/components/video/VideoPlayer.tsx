"use client";
import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  AlertCircle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVideoProgressTracking } from "@/app/(pages)/courses/[slug]/watch/hooks/useVideoProgressTracking";

// Types
interface VideoSource {
  quality: "1080p" | "720p" | "480p" | "360p" | string;
  videoUrl?: string;
  src?: string; // Support both videoUrl and src for compatibility
}

interface VideoPlayerProps {
  sources: VideoSource[];
  posterUrl?: string;
  onVideoReady?: (video: HTMLVideoElement) => void;
  onVideoComplete?: () => void; // Callback when video completes
  autoPlay?: boolean; // Auto-play when video loads
  className?: string;
  // Optional progress tracking props
  contentId?: string;
  moduleId?: string;
  lessonId?: string;
  contentType?: "video" | "quiz" | "document";
}

/**
 * Clean VideoPlayer component with multiple source support
 * Designed to prevent unnecessary re-renders
 */
const VideoPlayer: React.FC<VideoPlayerProps> = ({
  sources,
  posterUrl,
  onVideoReady,
  onVideoComplete,
  autoPlay = false,
  className,
  contentId,
  moduleId,
  lessonId,
  contentType = "video",
}) => {
  // Refs - these don't trigger re-renders
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentSrcRef = useRef<string>("");
  const isInitializedRef = useRef(false);
  const onVideoReadyRef = useRef(onVideoReady);

  // Update ref when callback changes (without causing re-render)
  useEffect(() => {
    onVideoReadyRef.current = onVideoReady;
  }, [onVideoReady]);

  // State - only what needs to trigger UI updates
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [currentQuality, setCurrentQuality] = useState<string>("Auto");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile once
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      setIsMobile(mobile);
    };
    checkMobile();
  }, []);

  // Process and validate sources - memoized
  // Support both videoUrl and src formats
  const validSources = useMemo(() => {
    return sources?.filter((source) => {
      const url = source?.videoUrl || source?.src;
      return url && url.trim() !== "";
    }) || [];
  }, [sources]);

  // Track video progress if tracking props are provided
  useVideoProgressTracking({
    contentId,
    moduleId,
    lessonId,
    contentType,
    currentTime,
    duration,
    isPlaying,
    onVideoComplete,
  });

  // Quality options - memoized
  const qualityOptions = useMemo(() => {
    if (validSources.length === 0) return [];
    return ["Auto", ...validSources.map((s) => s.quality)];
  }, [validSources]);

  // Select best quality source - memoized
  const selectedSource = useMemo(() => {
    if (validSources.length === 0) return null;
    
    if (currentQuality === "Auto") {
      // Auto-select highest quality
      return (
        validSources.find((s) => s.quality === "1080p") ||
        validSources.find((s) => s.quality === "720p") ||
        validSources.find((s) => s.quality === "480p") ||
        validSources[0]
      );
    }
    
    return validSources.find((s) => s.quality === currentQuality) || validSources[0];
  }, [validSources, currentQuality]);

  // Get source URL (support both videoUrl and src)
  const getSourceUrl = useCallback((source: VideoSource | null) => {
    if (!source) return "";
    return source.videoUrl || source.src || "";
  }, []);

  // Track contentId changes to reset player
  const prevContentIdRef = useRef<string | undefined>(contentId);
  const shouldAutoPlayRef = useRef(false);
  const autoPlayAttemptedForContentRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (autoPlay) {
      shouldAutoPlayRef.current = true;
    }
  }, [autoPlay]);
  
  // Initialize video source - only when source or contentId changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedSource) return;

    const sourceUrl = getSourceUrl(selectedSource).trim();
    if (!sourceUrl) return;
    
    // Reset when contentId changes (new video)
    const contentChanged = contentId && contentId !== prevContentIdRef.current;
    if (contentChanged) {
      prevContentIdRef.current = contentId;
      isInitializedRef.current = false;
      // Reset video state for new content
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
      
      // Mark that we should autoplay when video is ready (if autoPlay is true)
      shouldAutoPlayRef.current = autoPlay;
    }
    
    // Only set if source URL actually changed or content changed
    const sourceUrlChanged = currentSrcRef.current !== sourceUrl;
    if (sourceUrlChanged || contentChanged || !isInitializedRef.current) {
      currentSrcRef.current = sourceUrl;
      video.src = sourceUrl;
      video.load();
      isInitializedRef.current = true;
      setCurrentQuality(selectedSource.quality);

      // Autoplay (one-time) once the new source is ready.
      // This is more reliable than doing it on loadedmetadata, and works even on fresh mounts.
      if (shouldAutoPlayRef.current) {
        const contentKey = contentId || sourceUrl;
        if (autoPlayAttemptedForContentRef.current !== contentKey) {
          autoPlayAttemptedForContentRef.current = contentKey;
          const tryAutoPlay = () => {
            shouldAutoPlayRef.current = false;
            video
              .play()
              .catch(() => {
                // Autoplay can be blocked by browser policy; ignore.
              });
          };
          video.addEventListener("canplay", tryAutoPlay, { once: true });
        }
      }
    }
  }, [selectedSource, getSourceUrl, contentId]);

  // Handle quality change
  const handleQualityChange = useCallback((quality: string) => {
    setCurrentQuality(quality);
    setShowQualityMenu(false);
    
    const video = videoRef.current;
    if (!video) return;

    const newSource = quality === "Auto"
      ? (validSources.find((s) => s.quality === "1080p") ||
         validSources.find((s) => s.quality === "720p") ||
         validSources.find((s) => s.quality === "480p") ||
         validSources[0])
      : validSources.find((s) => s.quality === quality);

    if (newSource) {
      const newSourceUrl = getSourceUrl(newSource);
      if (newSourceUrl && newSourceUrl !== currentSrcRef.current) {
        const savedTime = video.currentTime;
        const wasPlaying = !video.paused;
        
        currentSrcRef.current = newSourceUrl;
        video.src = newSourceUrl;
        video.load();
        
        video.addEventListener("loadeddata", () => {
          video.currentTime = savedTime;
          if (wasPlaying) {
            video.play().catch(() => {});
          }
        }, { once: true });
      }
    }
  }, [validSources, getSourceUrl]);

  // Video event handlers - stable callbacks
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (onVideoReadyRef.current) {
        onVideoReadyRef.current(video);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };
    const handleCanPlay = () => {
      setIsLoading(false);
      setIsBuffering(false);
    };
    const handleLoadedData = () => {
      setIsLoading(false);
    };
    const handleError = () => {
      setIsLoading(false);
      setIsBuffering(false);
      const videoError = video.error;
      let errorMessage = "An error occurred while loading the video.";
      
      if (videoError) {
        switch (videoError.code) {
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = "Network error. Please check your internet connection.";
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = "Video format not supported or corrupted.";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = "Video source not found or format not supported.";
            break;
          default:
            errorMessage = "Unknown error occurred.";
        }
      }
      setError(errorMessage);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("error", handleError);
    };
  }, []); // Empty deps - handlers are stable

  // Auto-hide controls
  useEffect(() => {
    if (!isPlaying || isMobile) return;

    const resetTimeout = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", resetTimeout);
      container.addEventListener("mouseleave", () => {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        setShowControls(false);
      });
    }

    resetTimeout();

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (container) {
        container.removeEventListener("mousemove", resetTimeout);
      }
    };
  }, [isPlaying, isMobile]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;

      // Don't hijack keys while the user is typing anywhere.
      // (Some modals/portals cause `e.target` to be unexpected, so we also check `activeElement`.)
      const isTypingElement = (el: Element | null) => {
        const node = el as HTMLElement | null;
        const tagName = node?.tagName;
        return (
          tagName === "INPUT" ||
          tagName === "TEXTAREA" ||
          tagName === "SELECT" ||
          node?.isContentEditable === true
        );
      };

      const target = e.target as Element | null;
      const active = document.activeElement;
      if (isTypingElement(target) || isTypingElement(active)) return;
      
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          seek(10);
          break;
        case "ArrowLeft":
          e.preventDefault();
          seek(-10);
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []); // Empty deps - using refs for state

  // Player controls - stable callbacks
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, []);

  const seek = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  }, []);

  const seekTo = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, time));
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video || isMobile) return;
    
    if (video.muted) {
      video.muted = false;
      setIsMuted(false);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  }, [isMobile]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video || isMobile) return;
    
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, [isMobile]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Progress bar interaction
  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    const progressBar = progressRef.current;
    const video = videoRef.current;
    if (!progressBar || !video || !duration) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickTime = (clickX / rect.width) * duration;
    seekTo(clickTime);
  }, [duration, seekTo]);

  // Format time helper
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  // Error state
  if (validSources.length === 0) {
    return (
      <div className={cn("relative w-full h-full rounded-2xl overflow-hidden bg-linear-to-br from-gray-900 to-black flex items-center justify-center border-2 border-gray-800", className)}>
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 text-[#F77124] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Video Not Available</h3>
          <p className="text-gray-400">No valid video sources provided</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-full rounded-2xl overflow-hidden bg-linear-to-br from-gray-900 to-black group border-2 border-gray-800 hover:border-[#F77124]/30 transition-all duration-300", className)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover rounded-2xl"
        poster={posterUrl}
        playsInline
        preload="metadata"
        onClick={togglePlay}
      />

      {/* Loading/Buffering Overlay */}
      {(isLoading || isBuffering) && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-gray-900 to-black rounded-2xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-600 border-t-[#F77124] mx-auto mb-4"></div>
            <p className="text-white text-base font-medium">
              {isLoading ? "Loading video..." : "Buffering..."}
            </p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center p-6 max-w-md mx-4">
            <AlertCircle className="w-16 h-16 text-[#F77124] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Playback Error</h3>
            <p className="text-gray-300 text-sm mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                const video = videoRef.current;
                if (video) {
                  video.load();
                }
              }}
              className="bg-[#F77124] hover:bg-[#e6651f] text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Play/Pause Overlay */}
      {showControls && !isLoading && !isBuffering && !error && !isMobile && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="bg-black/50 hover:bg-[#F77124]/90 text-white p-4 rounded-full transition-all duration-300 hover:scale-110"
          >
            {isPlaying ? <Pause size={32} /> : <Play size={32} />}
          </button>
        </div>
      )}

      {/* Controls Bar */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-2 sm:p-4 transition-all duration-300",
          showControls || isMobile
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-full"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div
          ref={progressRef}
          className="w-full bg-white/20 rounded-full mb-2 sm:mb-4 cursor-pointer hover:bg-white/30 transition-all duration-200 h-1 sm:h-2"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-linear-to-r from-[#F77124] to-[#e6651f] rounded-full transition-all duration-150"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                seek(-10);
              }}
              className="text-white hover:text-[#F77124] transition-colors duration-200 p-1"
              title="10 seconds backward"
            >
              <SkipBack size={18} className="sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="text-white hover:text-[#F77124] transition-colors duration-200 p-1"
            >
              {isPlaying ? <Pause size={20} className="sm:w-5 sm:h-5" /> : <Play size={20} className="sm:w-5 sm:h-5" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                seek(10);
              }}
              className="text-white hover:text-[#F77124] transition-colors duration-200 p-1"
              title="10 seconds forward"
            >
              <SkipForward size={18} className="sm:w-5 sm:h-5" />
            </button>

            {/* Volume controls - hidden on mobile */}
            {!isMobile && (
              <div className="hidden sm:flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-[#F77124] transition-colors duration-200"
                >
                  {isMuted ? <VolumeX size={18} className="sm:w-5 sm:h-5" /> : <Volume2 size={18} className="sm:w-5 sm:h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-12 sm:w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#F77124] [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>
            )}

            <span className="text-white text-xs sm:text-sm whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Quality Selector */}
            {qualityOptions.length > 1 && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowQualityMenu(!showQualityMenu);
                  }}
                  className="text-white hover:text-[#F77124] transition-colors duration-200 flex items-center space-x-1 p-1"
                >
                  <Settings size={20} className="sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm hidden sm:inline">{currentQuality}</span>
                </button>

                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-sm rounded-xl p-2 min-w-[100px] border border-[#F77124]/20 shadow-lg z-50">
                    {qualityOptions.map((quality) => (
                      <button
                        key={quality}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQualityChange(quality);
                        }}
                        className={cn(
                          "block w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[#F77124]/20 transition-all duration-200",
                          currentQuality === quality
                            ? "text-[#F77124] bg-[#F77124]/10"
                            : "text-white"
                        )}
                      >
                        {quality}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="text-white hover:text-[#F77124] transition-colors duration-200 p-1"
            >
              <Maximize size={20} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
