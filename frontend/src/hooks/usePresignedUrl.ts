import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { getVideoPresignedUrl } from '@/lib/presignedUrl';

interface UsePresignedUrlOptions {
  expiresIn?: number;
  autoRefresh?: boolean;
  refreshThreshold?: number; // Refresh URL when it expires in this many seconds
}

interface PresignedUrlState {
  url: string | null;
  isLoading: boolean;
  error: string | null;
  expiresAt: number | null;
}

/**
 * Hook to manage presigned URLs for secure file access
 * @param s3Key - The S3 key of the file
 * @param options - Configuration options
 * @returns Object with URL state and refresh function
 */
export const usePresignedUrl = (
  s3Key: string | null,
  options: UsePresignedUrlOptions = {}
) => {
  const {
    expiresIn = 3600, // Default 1 hour for videos
    autoRefresh = true,
    refreshThreshold = 300 // Refresh 5 minutes before expiry
  } = options;

  const [state, setState] = useState<PresignedUrlState>({
    url: null,
    isLoading: false,
    error: null,
    expiresAt: null
  });

  const generateUrl = useCallback(async () => {
    if (!s3Key) {
      setState(prev => ({ ...prev, url: null, error: null }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const url = await getVideoPresignedUrl(s3Key, expiresIn);
      const expiresAt = Date.now() + (expiresIn * 1000);
      
      setState({
        url,
        isLoading: false,
        error: null,
        expiresAt
      });
    } catch (error) {
      setState({
        url: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate secure URL',
        expiresAt: null
      });
    }
  }, [s3Key, expiresIn]);

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh || !state.expiresAt) return;

    const timeUntilRefresh = state.expiresAt - Date.now() - (refreshThreshold * 1000);
    
    if (timeUntilRefresh <= 0) {
      // URL is about to expire, refresh immediately
      generateUrl();
      return;
    }

    const timeoutId = setTimeout(() => {
      generateUrl();
    }, timeUntilRefresh);

    return () => clearTimeout(timeoutId);
  }, [state.expiresAt, autoRefresh, refreshThreshold, generateUrl]);

  // Generate URL when s3Key changes
  useEffect(() => {
    generateUrl();
  }, [generateUrl]);

  return {
    ...state,
    refresh: generateUrl
  };
};

/**
 * Hook to convert video sources with S3 keys to presigned URLs
 * @param sources - Array of video sources that may contain S3 keys
 * @param options - Configuration options for presigned URLs
 * @returns Array of video sources with presigned URLs
 */
export const usePresignedVideoSources = (
  sources: Array<{ quality: string; src: string }>,
  options: UsePresignedUrlOptions = {}
) => {
  const [presignedSources, setPresignedSources] = useState<Array<{ quality: string; src: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to track previous values and prevent unnecessary conversions
  const prevSourcesRef = useRef<string>('');
  const prevExpiresInRef = useRef<number | undefined>(options.expiresIn);

  // Create a stable string representation of sources for comparison
  const sourcesKey = useMemo(() => {
    return JSON.stringify(sources.map(s => ({ quality: s.quality, src: s.src })).sort((a, b) => a.quality.localeCompare(b.quality)));
  }, [sources]);

  const convertSources = useCallback(async () => {
    if (!sources || sources.length === 0) {
      setPresignedSources([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const convertedSources = await Promise.all(
        sources.map(async (source) => {
          // Check if the source is already a full URL
          if (source.src.startsWith('http://') || source.src.startsWith('https://')) {
            return source;
          }

          // If it's not a full URL, treat it as an S3 key and generate presigned URL
          try {
            const presignedUrl = await getVideoPresignedUrl(source.src, options.expiresIn || 3600);
            return {
              quality: source.quality,
              src: presignedUrl
            };
          } catch (error) {
            console.error(`Failed to generate presigned URL for ${source.src}:`, error);
            // Return original source if presigned URL generation fails
            return source;
          }
        })
      );

      setPresignedSources(convertedSources);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to convert video sources');
      // Fallback to original sources
      setPresignedSources(sources);
    } finally {
      setIsLoading(false);
    }
  }, [sources, options.expiresIn]);

  useEffect(() => {
    // Only convert if sources actually changed or expiresIn changed
    const sourcesChanged = prevSourcesRef.current !== sourcesKey;
    const expiresInChanged = prevExpiresInRef.current !== options.expiresIn;
    
    if (sourcesChanged || expiresInChanged) {
      prevSourcesRef.current = sourcesKey;
      prevExpiresInRef.current = options.expiresIn;
      convertSources();
    }
  }, [sourcesKey, options.expiresIn, convertSources]);

  return {
    sources: presignedSources,
    isLoading,
    error,
    refresh: convertSources
  };
};
