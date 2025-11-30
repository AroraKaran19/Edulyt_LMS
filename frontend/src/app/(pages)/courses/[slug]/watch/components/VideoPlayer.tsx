import React, { useRef, useState, useEffect, useMemo } from "react";
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
import { useVideoProgressTracking } from "../hooks/useVideoProgressTracking";

// Extend HTMLVideoElement to include webkit methods for iOS
interface WebkitHTMLVideoElement extends HTMLVideoElement {
  webkitEnterFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
}

// Extend HTMLElement for webkit fullscreen methods
interface WebkitHTMLElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
}

// Extend Document for webkit fullscreen methods
interface WebkitDocument extends Document {
  webkitExitFullscreen?: () => Promise<void>;
}

interface VideoSource {
  quality: string;
  src: string;
}

interface VideoPlayerProps {
  sources: VideoSource[];
  posterUrl?: string;
  onVideoReady?: (video: HTMLVideoElement) => void;
  className?: string;
  contentId?: string; // Track content changes for smooth transitions
  moduleId?: string; // For progress tracking
  lessonId?: string; // For progress tracking
  contentType?: "video" | "quiz" | "document"; // For progress tracking
}

/**
 * VideoPlayer component
 * @param sources - Array of video sources e.g. [{ quality: "1080p", src: "https://www.example.com/video.mp4" }]
 * @param posterUrl - URL of the poster image
 * @returns VideoPlayer component
 */
const VideoPlayer: React.FC<VideoPlayerProps> = ({
  sources,
  posterUrl,
  onVideoReady,
  className,
  contentId,
  moduleId,
  lessonId,
  contentType = "video",
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [currentQuality, setCurrentQuality] = useState("Auto");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSrc, setCurrentSrc] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showSeekButtons, setShowSeekButtons] = useState(false);

  // Track video progress and completion
  useVideoProgressTracking({
    contentId,
    moduleId,
    lessonId,
    contentType,
    currentTime,
    duration,
    isPlaying,
  });

  // Detect mobile/iOS devices
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const mobile =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          userAgent
        );
      setIsMobile(mobile);
    };

    checkMobile();
  }, []);

  // Check if sources are provided and valid
  const hasValidSources = useMemo(
    () =>
      sources &&
      sources.length > 0 &&
      sources.some((source) => source.src && source.src.trim() !== ""),
    [sources]
  );

  // Filter out invalid sources
  const validSources = useMemo(
    () =>
      sources?.filter((source) => source.src && source.src.trim() !== "") || [],
    [sources]
  );

  // Get available quality options from valid sources
  const qualityOptions = useMemo(
    () =>
      hasValidSources
        ? ["Auto", ...validSources.map((source) => source.quality)]
        : [],
    [hasValidSources, validSources]
  );

  // Track previous contentId to detect content changes
  const prevContentIdRef = useRef<string | undefined>(contentId);

  // Initialize with first valid source or auto-select best quality
  // Reset when content changes (new contentId)
  useEffect(() => {
    if (validSources.length > 0) {
      // Check if content has changed
      const contentChanged = prevContentIdRef.current !== contentId;
      prevContentIdRef.current = contentId;

      // Auto-select highest quality by default
      const bestQuality =
        validSources.find((s) => s.quality === "1080p") ||
        validSources.find((s) => s.quality === "720p") ||
        validSources.find((s) => s.quality === "480p") ||
        validSources[0];

      // If content changed, reset to beginning and pause
      if (contentChanged) {
        const video = videoRef.current;
        if (video) {
          video.pause();
          video.currentTime = 0;
        }
        setIsPlaying(false);
        setCurrentTime(0);
      }

      setCurrentSrc(bestQuality.src);
      setCurrentQuality(bestQuality.quality);
    }
  }, [validSources, contentId]);

  // Handle source changes - set video src when currentSrc changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentSrc) return;

    // Use the source URL directly (AWS presigned URLs are already full URLs)
    const sourceUrl = currentSrc.trim();

    // Get current video src - normalize both URLs for comparison
    // video.src returns the full resolved URL, so we need to compare properly
    let currentVideoSrc = "";
    try {
      if (video.src) {
        // Remove hash/fragment and normalize
        const url = new URL(video.src);
        url.hash = "";
        currentVideoSrc = url.href;
      }
    } catch (e) {
      // If video.src is not a valid URL, use it as-is
      currentVideoSrc = video.src || "";
    }

    let normalizedSourceUrl = "";
    try {
      const url = new URL(sourceUrl);
      url.hash = "";
      normalizedSourceUrl = url.href;
    } catch (e) {
      // If sourceUrl is not a valid URL, use it as-is
      normalizedSourceUrl = sourceUrl;
    }

    // Only update if the source actually changed
    if (currentVideoSrc !== normalizedSourceUrl && video.src !== sourceUrl) {
      // Check if this is a content change (different contentId)
      const isContentChange = prevContentIdRef.current !== contentId;

      // Save current state before changing source (only if not changing content)
      const savedTime = isContentChange ? 0 : video.currentTime || 0; // Reset to 0 for new content
      const wasPlaying = !isContentChange && !video.paused; // Don't autoplay on content change
      const savedVolume = video.volume;

      // Set loading state
      setIsLoading(true);
      setError(null);
      setIsBuffering(false);

      // Pause video before changing source to prevent glitches
      video.pause();

      // Update the video source directly - this ensures AWS presigned URLs are used correctly
      video.src = sourceUrl;
      video.load();

      // Set up one-time event listeners for smooth transition
      const handleCanPlay = () => {
        // Restore volume (except on iOS where it's controlled by system)
        if (!isMobile) {
          video.volume = savedVolume;
        }

        // Reset time to 0 for new content, or restore for quality change
        video.currentTime = savedTime;

        // Only resume playback if it was a quality change (not content change)
        if (wasPlaying && !isContentChange) {
          video.play().catch((error) => {
            console.error("Error resuming playback:", error);
          });
        }

        setIsLoading(false);

        // Notify parent that video is ready
        if (onVideoReady) {
          onVideoReady(video);
        }
      };

      const handleError = () => {
        console.error("Error loading new source:", sourceUrl);
        setError("Failed to load video source");
        setIsLoading(false);
        setIsBuffering(false);
      };

      // Add event listeners with once option for automatic cleanup
      video.addEventListener("canplay", handleCanPlay, { once: true });
      video.addEventListener("error", handleError, { once: true });

      // Cleanup function
      return () => {
        video.removeEventListener("canplay", handleCanPlay);
        video.removeEventListener("error", handleError);
      };
    }
  }, [currentSrc, isMobile, contentId, onVideoReady]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      // Notify parent component that video is ready
      if (onVideoReady) {
        onVideoReady(video);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);

      // Clear any existing timeout
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }

      // Set timeout for loading (30 seconds)
      const timeout = setTimeout(() => {
        setIsLoading(false);
        setError(
          "Video loading timeout. Please check your connection and try again."
        );
      }, 30000);

      setLoadingTimeout(timeout);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setIsBuffering(false);
      setError(null);

      // Clear timeout when video can play
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        setLoadingTimeout(null);
      }
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handlePlaying = () => {
      setIsBuffering(false);
    };

    const handleLoadedData = () => {
      setIsLoading(false);

      // Clear timeout when video data is loaded
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        setLoadingTimeout(null);
      }
    };

    const handleError = () => {
      setIsLoading(false);
      setIsBuffering(false);

      // Clear timeout on error
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        setLoadingTimeout(null);
      }

      // Determine error type
      const videoError = video.error;
      let errorMessage = "An error occurred while loading the video.";

      if (videoError) {
        switch (videoError.code) {
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage =
              "Network error. Please check your internet connection.";
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = "Video format not supported or corrupted.";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = "Video source not found or format not supported.";
            break;
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = "Video loading was aborted.";
            break;
          default:
            errorMessage = "Unknown error occurred while loading video.";
        }
      }

      setError(errorMessage);
    };

    const handleStalled = () => {
      // Video stalled - might be network issue
      setIsBuffering(true);
    };

    const handleSeeked = () => {
      // Seeking completed - clear buffering
      setIsBuffering(false);
    };

    const handleProgress = () => {
      // Video is downloading/buffering data
      // Only clear buffering if we have enough buffered data
      const video = videoRef.current;
      if (video && video.buffered.length > 0) {
        const currentTime = video.currentTime;
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);

        // If we have at least 3 seconds of buffer ahead, clear buffering
        if (bufferedEnd - currentTime > 3) {
          setIsBuffering(false);
        }
      }
    };

    const handleSeeking = () => {
      // User is seeking - show buffering
      setIsBuffering(true);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("error", handleError);
    video.addEventListener("stalled", handleStalled);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("seeking", handleSeeking);
    video.addEventListener("progress", handleProgress);

    return () => {
      // Clear timeout on cleanup
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }

      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("error", handleError);
      video.removeEventListener("stalled", handleStalled);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("seeking", handleSeeking);
      video.removeEventListener("progress", handleProgress);
    };
  }, [loadingTimeout]);

  // Auto-hide controls with better mobile handling
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimeout = () => {
      setShowControls(true);
      setShowSeekButtons(true);
      clearTimeout(timeout);
      timeout = setTimeout(
        () => {
          if (isPlaying && !isMobile) {
            setShowControls(false);
            setShowSeekButtons(false);
          }
        },
        isMobile ? 5000 : 3000
      ); // Longer timeout on mobile
    };

    const handleInteraction = () => resetTimeout();
    const handleMouseLeave = () => {
      clearTimeout(timeout);
      if (isPlaying && !isMobile) {
        setShowControls(false);
        setShowSeekButtons(false);
      }
    };

    const container = containerRef.current;
    if (container) {
      // Use both mouse and touch events for better mobile support
      container.addEventListener("mousemove", handleInteraction);
      container.addEventListener("touchstart", handleInteraction);
      container.addEventListener("touchmove", handleInteraction);
      container.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      clearTimeout(timeout);
      if (container) {
        container.removeEventListener("mousemove", handleInteraction);
        container.removeEventListener("touchstart", handleInteraction);
        container.removeEventListener("touchmove", handleInteraction);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [isPlaying, isMobile]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      // iOS requires user interaction to play
      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch((error) => {
          console.error("Error playing video:", error);
          // Handle autoplay policy errors on iOS
        });
      }
    }
  };

  const seekForward = () => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = Math.min(video.currentTime + 10, video.duration);
    video.currentTime = newTime;
  };

  const seekBackward = () => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = Math.max(video.currentTime - 10, 0);
    video.currentTime = newTime;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard shortcuts when the video container is focused or when video is playing
      if (!videoRef.current) return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          seekForward();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekBackward();
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
  }, [isPlaying, isMuted, isFullscreen]);

  // Enhanced progress bar handling for mobile
  const handleProgressInteraction = (clientX: number) => {
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar || !duration) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const width = rect.width;
    const clickTime = Math.max(
      0,
      Math.min(duration, (clickX / width) * duration)
    );

    video.currentTime = clickTime;
  };

  const handleProgressClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleProgressInteraction(e.clientX);
  };

  const handleProgressTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const touch = e.touches[0];
    handleProgressInteraction(touch.clientX);
  };

  const handleProgressTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isDragging) return;
    const touch = e.touches[0];
    handleProgressInteraction(touch.clientX);
  };

  const handleProgressTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video || isMobile) return; // iOS doesn't allow volume control via JS

    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    video.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video || isMobile) return; // iOS doesn't allow volume control via JS

    if (isMuted) {
      video.volume = volume;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    // iOS Safari uses webkitEnterFullscreen on video element
    const webkitVideo = video as WebkitHTMLVideoElement;
    if (isMobile && webkitVideo.webkitEnterFullscreen) {
      if (!isFullscreen) {
        webkitVideo.webkitEnterFullscreen();
      } else if (webkitVideo.webkitExitFullscreen) {
        webkitVideo.webkitExitFullscreen();
      }
    } else {
      // Desktop browsers
      const webkitContainer = container as WebkitHTMLElement;
      const webkitDocument = document as WebkitDocument;

      if (!isFullscreen) {
        if (container.requestFullscreen) {
          container.requestFullscreen();
        } else if (webkitContainer.webkitRequestFullscreen) {
          webkitContainer.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (webkitDocument.webkitExitFullscreen) {
          webkitDocument.webkitExitFullscreen();
        }
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleQualityChange = (quality: string) => {
    const video = videoRef.current;
    if (!video) return;

    console.log("Changing quality to:", quality);

    // Determine new source
    let newSrc = "";
    if (quality === "Auto") {
      // Auto-select best quality based on network/screen
      const bestQuality =
        validSources.find((s) => s.quality === "1080p") ||
        validSources.find((s) => s.quality === "720p") ||
        validSources.find((s) => s.quality === "480p") ||
        validSources[0];
      newSrc = bestQuality.src;
      setCurrentQuality("Auto");
    } else {
      // Find the selected quality source
      const selectedSource = validSources.find((s) => s.quality === quality);
      if (selectedSource) {
        newSrc = selectedSource.src;
        setCurrentQuality(quality);
      }
    }

    // Only change if we have a valid new source
    if (newSrc && newSrc !== currentSrc) {
      // Update the source through React state
      // The useEffect will handle the smooth transition
      setCurrentSrc(newSrc);
    }

    setShowQualityMenu(false);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const retryVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    console.log("Retrying video playback...");

    // Clear all states
    setError(null);
    setIsLoading(true);
    setIsBuffering(false);

    // Clear any existing timeout
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      setLoadingTimeout(null);
    }

    // Force React to re-render with empty src, then restore
    const currentSrcValue = currentSrc;
    console.log("Retrying with source:", currentSrcValue);

    // Temporarily clear the source to force reload
    setCurrentSrc("");

    // After React re-renders, restore the source
    // The useEffect will handle the smooth transition
    setTimeout(() => {
      setCurrentSrc(currentSrcValue);
    }, 50);
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  // Error component for missing or invalid sources
  if (!hasValidSources) {
    return (
      <div className="relative w-full h-full rounded-2xl overflow-hidden bg-linear-to-br from-gray-900 to-black flex items-center justify-center border-2 border-gray-800">
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 text-[#F77124] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Video Not Available
          </h3>
          <p className="text-gray-400 mb-4">
            {!sources || sources.length === 0
              ? "No video sources provided"
              : "All video sources are empty or invalid"}
          </p>
          <div className="bg-[#F77124]/10 border border-[#F77124]/20 rounded-xl p-3">
            <p className="text-[#F77124] text-sm">
              Please check the video configuration and try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full rounded-2xl overflow-hidden bg-linear-to-br from-gray-900 to-black group border-2 border-gray-800 hover:border-[#F77124]/30 transition-all duration-300",
        className
      )}
      style={{
        opacity: isLoading ? 0.7 : 1,
        transition: "opacity 0.2s ease-in-out",
      }}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover rounded-2xl"
        poster={posterUrl}
        playsInline // Important for iOS
        webkit-playsinline="true" // Legacy iOS support
        preload="metadata"
        onClick={(e) => {
          e.stopPropagation();
          // Only toggle play if clicking on the video itself, not on controls
          if (e.target === e.currentTarget || e.target === videoRef.current) {
            togglePlay();
          }
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          // Only toggle play if touching the video itself, not on controls
          if (e.target === e.currentTarget || e.target === videoRef.current) {
            togglePlay();
          }
        }}
      />

      {/* Loading/Buffering Overlay */}
      {(isLoading || isBuffering) && !error && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-gray-900 to-black rounded-2xl animate-in fade-in duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center animate-in slide-in-from-bottom-4 duration-500">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-600 border-t-[#F77124] mx-auto mb-4 shadow-[0_0_20px_rgba(247,113,36,0.3)]"></div>
            <p className="text-white text-base font-medium mb-2">
              {isLoading ? "Loading video..." : "Buffering..."}
            </p>
            <p className="text-gray-400 text-sm">
              {isLoading ? "Preparing video player" : "Loading video content"}
            </p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center p-6 max-w-md mx-4">
            <AlertCircle className="w-16 h-16 text-[#F77124] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Playback Error
            </h3>
            <p className="text-gray-300 text-sm mb-4">{error}</p>
            <button
              onClick={retryVideo}
              className="bg-[#F77124] hover:bg-[#e6651f] text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Play/Pause Overlay */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          showControls && !isLoading && !isBuffering && !error && !isMobile
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="bg-black/50 hover:bg-[#F77124]/90 text-white p-4 rounded-full transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(247,113,36,0.5)] z-20"
          disabled={isLoading || !!error}
        >
          {isPlaying ? <Pause size={32} /> : <Play size={32} />}
        </button>
      </div>

      {/* Seek Buttons Overlay */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          showSeekButtons && !isLoading && !isBuffering && !error
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-16 sm:gap-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              seekBackward();
            }}
            className="bg-black/50 hover:bg-[#F77124]/90 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(247,113,36,0.5)] z-10"
            disabled={isLoading || !!error}
            title="Seek 10 seconds backward (←)"
          >
            <SkipBack size={24} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              seekForward();
            }}
            className="bg-black/50 hover:bg-[#F77124]/90 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(247,113,36,0.5)] z-10"
            disabled={isLoading || !!error}
            title="Seek 10 seconds forward (→)"
          >
            <SkipForward size={24} />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-2 sm:p-4 transition-all duration-300 ${
          showControls || isMobile
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-full"
        }`}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div
          ref={progressRef}
          className={cn(
            "w-full bg-white/20 rounded-full mb-2 sm:mb-4 cursor-pointer hover:bg-white/30 transition-all duration-200",
            isMobile ? "h-3 sm:h-4" : "h-1 sm:h-2"
          )}
          onClick={handleProgressClick}
          onTouchStart={handleProgressTouchStart}
          onTouchMove={handleProgressTouchMove}
          onTouchEnd={handleProgressTouchEnd}
        >
          <div
            className="h-full bg-linear-to-r from-[#F77124] to-[#e6651f] rounded-full transition-all duration-150 shadow-[0_0_8px_rgba(247,113,36,0.5)]"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                seekBackward();
              }}
              className="text-white hover:text-[#F77124] transition-colors duration-200 p-1 touch-manipulation"
              title="10 seconds backward"
            >
              <SkipBack size={18} className="sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="text-white hover:text-[#F77124] transition-colors duration-200 p-1 touch-manipulation"
            >
              {isPlaying ? (
                <Pause size={20} className="sm:w-5 sm:h-5" />
              ) : (
                <Play size={20} className="sm:w-5 sm:h-5" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                seekForward();
              }}
              className="text-white hover:text-[#F77124] transition-colors duration-200 p-1 touch-manipulation"
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
                  {isMuted ? (
                    <VolumeX size={18} className="sm:w-5 sm:h-5" />
                  ) : (
                    <Volume2 size={18} className="sm:w-5 sm:h-5" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-12 sm:w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#F77124] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(247,113,36,0.5)]"
                  style={{
                    background: `linear-linear(to right, #F77124 0%, #F77124 ${
                      (isMuted ? 0 : volume) * 100
                    }%, rgba(255,255,255,0.2) ${
                      (isMuted ? 0 : volume) * 100
                    }%, rgba(255,255,255,0.2) 100%)`,
                  }}
                />
              </div>
            )}

            <span className="text-white text-xs sm:text-sm whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Quality Selector */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowQualityMenu(!showQualityMenu);
                }}
                className="text-white hover:text-[#F77124] transition-colors duration-200 flex items-center space-x-1 p-1 touch-manipulation"
              >
                <Settings size={20} className="sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm hidden sm:inline">
                  {currentQuality}
                </span>
              </button>

              {showQualityMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-sm rounded-xl p-2 min-w-[100px] border border-[#F77124]/20 shadow-[0_0_20px_rgba(247,113,36,0.3)] z-50">
                  {qualityOptions.map((quality) => (
                    <button
                      key={quality}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQualityChange(quality);
                      }}
                      className={cn(
                        "block w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[#F77124]/20 transition-all duration-200 touch-manipulation",
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

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="text-white hover:text-[#F77124] transition-colors duration-200 p-1 touch-manipulation"
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
