import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoSource {
  quality: string;
  src: string;
}

interface VideoPlayerProps {
  sources: VideoSource[];
  posterUrl?: string;
  onVideoReady?: (video: HTMLVideoElement) => void;
  className?: string;
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

  // Initialize with first valid source or auto-select best quality
  useEffect(() => {
    if (validSources.length > 0) {
      // Auto-select highest quality by default
      const bestQuality =
        validSources.find((s) => s.quality === "1080p") ||
        validSources.find((s) => s.quality === "720p") ||
        validSources.find((s) => s.quality === "480p") ||
        validSources[0];
      setCurrentSrc(bestQuality.src);
      setCurrentQuality(bestQuality.quality);
    }
  }, [validSources]);

  // Handle source changes smoothly
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentSrc) return;

    // Create full URL if currentSrc is relative
    const fullCurrentSrc = currentSrc.startsWith("http")
      ? currentSrc
      : new URL(currentSrc, window.location.origin).href;

    // Only update if the source actually changed
    if (video.src !== fullCurrentSrc) {
      // Save current state before changing source
      const savedTime = video.currentTime || 0;
      const wasPlaying = !video.paused;
      const savedVolume = video.volume;

      // Set loading state
      setIsLoading(true);
      setError(null);

      // Pause video before changing source to prevent glitches
      if (wasPlaying) {
        video.pause();
      }

      // Update the video source
      video.src = fullCurrentSrc;
      video.load();

      // Set up one-time event listeners for smooth transition
      const handleCanPlay = () => {
        console.log("New source can play, restoring state");

        // Restore volume
        video.volume = savedVolume;

        // Restore time
        if (savedTime > 0) {
          video.currentTime = savedTime;
        }

        // Resume playback if it was playing before
        if (wasPlaying) {
          video.play().catch((error) => {
            console.error("Error resuming playback:", error);
          });
        }

        // Clean up event listener
        video.removeEventListener("canplay", handleCanPlay);
      };

      const handleError = () => {
        console.error("Error loading new source");
        setError("Failed to load video source");
        setIsLoading(false);
        video.removeEventListener("error", handleError);
        video.removeEventListener("canplay", handleCanPlay);
      };

      // Add event listeners
      video.addEventListener("canplay", handleCanPlay);
      video.addEventListener("error", handleError);

      // Cleanup after timeout to prevent memory leaks
      setTimeout(() => {
        video.removeEventListener("canplay", handleCanPlay);
        video.removeEventListener("error", handleError);
      }, 10000);
    }
  }, [currentSrc]);

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

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimeout = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };

    const handleMouseMove = () => resetTimeout();
    const handleMouseLeave = () => {
      clearTimeout(timeout);
      if (isPlaying) setShowControls(false);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      clearTimeout(timeout);
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [isPlaying]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleProgressClick = (e: React.MouseEvent) => {
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickTime = (clickX / width) * duration;

    video.currentTime = clickTime;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    video.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

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
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
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
      <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-black flex items-center justify-center border-2 border-gray-800">
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
      className={cn("relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-black group border-2 border-gray-800 hover:border-[#F77124]/30 transition-all duration-300 cursor-pointer", className)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover rounded-2xl"
        poster={posterUrl}
      />

      {/* Loading/Buffering Overlay */}
      {(isLoading || isBuffering) && !error && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black rounded-2xl animate-in fade-in duration-300"
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
          showControls && !isLoading && !isBuffering && !error
            ? "opacity-100"
            : "opacity-0"
        }`}
      >
        <button
          onClick={togglePlay}
          className="bg-black/50 hover:bg-[#F77124]/90 text-white p-4 rounded-full transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(247,113,36,0.5)]"
          disabled={isLoading || !!error}
        >
          {isPlaying ? <Pause size={32} /> : <Play size={32} />}
        </button>
      </div>

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 sm:p-4 transition-all duration-300 ${
          showControls
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div
          ref={progressRef}
          className="w-full h-1 sm:h-2 bg-white/20 rounded-full mb-2 sm:mb-4 cursor-pointer hover:bg-white/30 transition-all duration-200"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-gradient-to-r from-[#F77124] to-[#e6651f] rounded-full transition-all duration-150 shadow-[0_0_8px_rgba(247,113,36,0.5)]"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={togglePlay}
              className="text-white hover:text-[#F77124] transition-colors duration-200 p-1"
            >
              {isPlaying ? <Pause size={18} className="sm:w-5 sm:h-5" /> : <Play size={18} className="sm:w-5 sm:h-5" />}
            </button>

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
                className="w-12 sm:w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#F77124] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(247,113,36,0.5)]"
                style={{
                  background: `linear-gradient(to right, #F77124 0%, #F77124 ${
                    (isMuted ? 0 : volume) * 100
                  }%, rgba(255,255,255,0.2) ${
                    (isMuted ? 0 : volume) * 100
                  }%, rgba(255,255,255,0.2) 100%)`,
                }}
              />
            </div>

            <span className="text-white text-xs sm:text-sm whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile Volume Control */}
            <button
              onClick={toggleMute}
              className="sm:hidden text-white hover:text-[#F77124] transition-colors duration-200 p-1"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {/* Quality Selector */}
            <div className="relative">
              <button
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                className="text-white hover:text-[#F77124] transition-colors duration-200 flex items-center space-x-1 p-1"
              >
                <Settings size={18} className="sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm hidden sm:inline">{currentQuality}</span>
              </button>

              {showQualityMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-sm rounded-xl p-2 min-w-[100px] border border-[#F77124]/20 shadow-[0_0_20px_rgba(247,113,36,0.3)] z-50">
                  {qualityOptions.map((quality) => (
                    <button
                      key={quality}
                      onClick={() => {
                        handleQualityChange(quality);
                        setShowQualityMenu(false);
                      }}
                      className={`block w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[#F77124]/20 transition-all duration-200 ${
                        currentQuality === quality
                          ? "text-[#F77124] bg-[#F77124]/10"
                          : "text-white"
                      }`}
                    >
                      {quality}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-[#F77124] transition-colors duration-200 p-1"
            >
              <Maximize size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
