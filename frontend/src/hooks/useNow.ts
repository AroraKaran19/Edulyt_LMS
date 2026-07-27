"use client";

import { useEffect, useState } from "react";

/**
 * A clock that re-renders the caller on an interval.
 *
 * Time-derived UI — "closes in 4 min", an Open/Closed badge, a Live Now chip —
 * is wrong the moment it's painted if it reads `Date.now()` during render: the
 * value never changes again until something else happens to re-render. Reading
 * the clock from state instead keeps those labels truthful on their own.
 */
export function useNow(intervalMs: number = 30_000): number {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}

export default useNow;
