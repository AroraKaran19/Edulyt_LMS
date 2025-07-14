/**
 * Formats duration in minutes to a human-readable format
 * @param totalMinutes - Total duration in minutes
 * @returns Formatted string like "2h 30m" or "45m"
 */
export const formatDuration = (totalMinutes: number): string => {
  if (!totalMinutes || totalMinutes <= 0) {
    return "0 M";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours} ${hours > 1 ? "Hrs" : "Hr"} ${minutes} ${minutes > 1 ? "Mins" : "Min"}`;
  } else if (hours > 0) {
    return `${hours} ${hours > 1 ? "Hrs" : "Hr"}`;
  } else {
    return `${minutes} ${minutes > 1 ? "Mins" : "Min"}`;
  }
};

/**
 * Parses duration from various formats to minutes
 * @param duration - Duration in various formats (number, "15min", "1h 30m", etc.)
 * @returns Duration in minutes
 */
export const parseDurationToMinutes = (duration: string | number | undefined): number => {
  if (!duration) return 0;
  
  // If it's already a number, assume it's in minutes
  if (typeof duration === 'number') {
    return duration;
  }
  
  // Handle string formats
  const durationStr = duration.toString().toLowerCase();
  
  // Match patterns like "1h 30m", "2h", "45m", "15min"
  const hourMatch = durationStr.match(/(\d+)H/);
  const minuteMatch = durationStr.match(/(\d+)M/);
  const minMatch = durationStr.match(/(\d+)MIN/);
  
  let totalMinutes = 0;
  
  if (hourMatch) {
    totalMinutes += parseInt(hourMatch[1]) * 60;
  }
  
  if (minuteMatch) {
    totalMinutes += parseInt(minuteMatch[1]);
  } else if (minMatch) {
    totalMinutes += parseInt(minMatch[1]);
  }
  
  // If no pattern matched, try to parse as plain number
  if (totalMinutes === 0) {
    const num = parseInt(durationStr);
    if (!isNaN(num)) {
      totalMinutes = num;
    }
  }
  
  return totalMinutes;
}; 