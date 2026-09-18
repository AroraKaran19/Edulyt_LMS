"use client";

import { useCallback, useEffect, useState } from "react";
import apiClient from "@/configs/apiConfig";
import { EMPTY_PIPELINE, type LeadPipeline } from "@/lib/leadPipeline";

/**
 * Module-level, not per-hook: five screens need the pipeline and it changes
 * about never, so the first one to mount fetches it and the rest read the same
 * copy. `inflight` keeps two screens mounting together to a single request.
 */
let cache: LeadPipeline | null = null;
let inflight: Promise<LeadPipeline> | null = null;

const fetchPipeline = async (): Promise<LeadPipeline> => {
  const res = await apiClient.get("/leads/pipeline");
  const data = res.data?.data;
  return Array.isArray(data?.stages) ? (data as LeadPipeline) : EMPTY_PIPELINE;
};

/** Called after the admin saves, so the other screens pick the change up. */
export const clearLeadPipelineCache = (): void => {
  cache = null;
  inflight = null;
};

export const useLeadPipeline = () => {
  const [pipeline, setPipeline] = useState<LeadPipeline>(cache ?? EMPTY_PIPELINE);
  const [loading, setLoading] = useState(!cache);

  const load = useCallback(async (force = false) => {
    if (force) clearLeadPipelineCache();
    if (cache) {
      setPipeline(cache);
      setLoading(false);
      return cache;
    }
    setLoading(true);
    inflight = inflight ?? fetchPipeline();
    try {
      const next = await inflight;
      cache = next;
      setPipeline(next);
      return next;
    } catch {
      // Left uncached so the next mount retries. The screens fall back to an
      // empty funnel, which renders stored keys rather than nothing.
      return EMPTY_PIPELINE;
    } finally {
      inflight = null;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { pipeline, loading, reload: () => load(true) };
};

export default useLeadPipeline;
