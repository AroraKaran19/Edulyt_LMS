"use client";

import { useCallback, useEffect, useState } from "react";
import apiClient from "@/configs/apiConfig";
import { DASHBOARD_MY_INTERNSHIPS_CHANGED } from "./useMyInternshipEnrollments";

export interface UserStats {
  totalCourses: number;
  totalCertificates: number;
  totalInternships: number;
}

const DEFAULT_STATS: UserStats = {
  totalCourses: 0,
  totalCertificates: 0,
  totalInternships: 0,
};

// Module-level singleton cache so navbar + banner share one fetch.
let cached: UserStats | null = null;
let inflight: Promise<UserStats> | null = null;
const subscribers = new Set<(s: UserStats) => void>();

async function fetchOnce(force = false): Promise<UserStats> {
  if (!force && cached) return cached;
  if (!force && inflight) return inflight;
  inflight = apiClient
    .get("/users/me/stats")
    .then((res) => {
      const data = (res.data?.data ?? {}) as Partial<UserStats>;
      const next: UserStats = {
        totalCourses: Number(data.totalCourses ?? 0),
        totalCertificates: Number(data.totalCertificates ?? 0),
        totalInternships: Number(data.totalInternships ?? 0),
      };
      cached = next;
      subscribers.forEach((cb) => cb(next));
      return next;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Force-refresh outside the hook (e.g. after an action). */
export function refreshUserStats(): Promise<UserStats> {
  return fetchOnce(true);
}

/** Dashboard counts hook. Dedupes across mounts; auto-refreshes when an
 *  internship-list change event fires. */
export default function useUserStats() {
  const [stats, setStats] = useState<UserStats>(cached ?? DEFAULT_STATS);
  const [isLoading, setIsLoading] = useState(!cached);

  useEffect(() => {
    let cancelled = false;
    const onUpdate = (s: UserStats) => {
      if (!cancelled) setStats(s);
    };
    subscribers.add(onUpdate);

    fetchOnce()
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch(() => {
        /* leave defaults */
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    const onInternshipChange = () => {
      void fetchOnce(true);
    };
    window.addEventListener(
      DASHBOARD_MY_INTERNSHIPS_CHANGED,
      onInternshipChange,
    );

    return () => {
      cancelled = true;
      subscribers.delete(onUpdate);
      window.removeEventListener(
        DASHBOARD_MY_INTERNSHIPS_CHANGED,
        onInternshipChange,
      );
    };
  }, []);

  const refresh = useCallback(async () => {
    const s = await fetchOnce(true);
    setStats(s);
    return s;
  }, []);

  return { stats, isLoading, refresh };
}
