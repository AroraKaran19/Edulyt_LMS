import { useCallback, useState } from "react";

const STORAGE_KEY = "airkrit-watch-autoplay-next";

function readStored(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

/**
 * Persisted preference: when true, video/quiz completion auto-advances to the next item.
 * Default true (matches previous behavior). Stored in localStorage.
 */
export function useWatchAutoplayNext() {
  const [autoplayNext, setAutoplayNextState] = useState(readStored);

  const setAutoplayNext = useCallback((value: boolean) => {
    setAutoplayNextState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? "true" : "false");
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  return { autoplayNext, setAutoplayNext };
}
