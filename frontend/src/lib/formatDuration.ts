/**
 * Formats duration in seconds to a human-readable format
 * @param totalSeconds - Total duration in seconds
 * @returns Formatted string like "2h 30m" or "45m" or "30s"
 */
export const formatDuration = (totalSeconds: number): string => {
  if (!totalSeconds || totalSeconds <= 0) {
    return "0s";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    if (minutes > 0) {
    return `${hours} ${hours > 1 ? "Hrs" : "Hr"} ${minutes} ${minutes > 1 ? "Mins" : "Min"}`;
    } else {
    return `${hours} ${hours > 1 ? "Hrs" : "Hr"}`;
    }
  } else if (minutes > 0) {
    if (seconds > 0 && minutes < 5) { // Show seconds for short durations
      return `${minutes} ${minutes > 1 ? "Mins" : "Min"} ${seconds}s`;
  } else {
    return `${minutes} ${minutes > 1 ? "Mins" : "Min"}`;
    }
  } else {
    return `${seconds}s`;
  }
};

/**
 * Parses duration from various formats to seconds
 * @param duration - Duration in various formats (number, "15min", "1h 30m", "45s", etc.)
 * @returns Duration in seconds
 */
export const parseDurationToSeconds = (duration: string | number | undefined): number => {
  if (!duration) return 0;
  
  // If it's already a number, assume it's in seconds
  if (typeof duration === 'number') {
    return duration;
  }
  
  // Handle string formats
  const durationStr = duration.toString().toLowerCase();
  
  // Match patterns like "1h 30m 45s", "2h", "45m", "30s", "15min"
  const hourMatch = durationStr.match(/(\d+)h/);
  const minuteMatch = durationStr.match(/(\d+)m(?!i)/); // m but not followed by 'i' (to avoid matching 'min')
  const minMatch = durationStr.match(/(\d+)min/);
  const secondMatch = durationStr.match(/(\d+)s/);
  
  let totalSeconds = 0;
  
  if (hourMatch) {
    totalSeconds += parseInt(hourMatch[1]) * 3600; // hours to seconds
  }
  
  if (minuteMatch) {
    totalSeconds += parseInt(minuteMatch[1]) * 60; // minutes to seconds
  } else if (minMatch) {
    totalSeconds += parseInt(minMatch[1]) * 60; // minutes to seconds
  }
  
  if (secondMatch) {
    totalSeconds += parseInt(secondMatch[1]); // seconds
  }
  
  // If no pattern matched, try to parse as plain number (assume seconds)
  if (totalSeconds === 0) {
    const num = parseInt(durationStr);
    if (!isNaN(num)) {
      totalSeconds = num;
    }
  }
  
  return totalSeconds;
};

/**
 * Legacy function for backward compatibility - converts minutes to seconds
 * @param duration - Duration in various formats, assuming minutes for numbers
 * @returns Duration in seconds
 * @deprecated Use parseDurationToSeconds instead
 */
export const parseDurationToMinutes = (duration: string | number | undefined): number => {
  if (!duration) return 0;
  
  // If it's a number, assume it's in minutes and convert to seconds
  if (typeof duration === 'number') {
    return duration * 60;
  }
  
  // For strings, use the new seconds parser
  return parseDurationToSeconds(duration);
}; 