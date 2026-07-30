"use client";

import { useCallback } from "react";
import apiClient from "@/configs/apiConfig";

/** A full-window export aggregation can outrun the 10s client default. */
const EXPORT_TIMEOUT_MS = 120_000;

/** Reads the server-supplied filename, falling back to a sensible default. */
function filenameFromDisposition(header: unknown, fallback: string): string {
  if (typeof header !== "string") return fallback;
  const match = header.match(/filename="?([^";]+)"?/i);
  return match?.[1]?.trim() || fallback;
}

/** Hands a Blob to the browser as a download, then releases the object URL. */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Downloads a server-rendered CSV from any admin list endpoint that supports
 * `format=csv`. Auth is a bearer token on the axios client, so a plain anchor
 * href would 401 — the response has to come through `apiClient` as a blob.
 */
export default function useCsvExport() {
  return useCallback(
    async (
      path: string,
      params: Record<string, string | number | undefined>,
      fallbackName: string,
    ): Promise<void> => {
      const clean: Record<string, string | number> = {};
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== "") clean[k] = v;
      }
      const res = await apiClient.get<Blob>(path, {
        params: { ...clean, format: "csv", scope: "range" },
        responseType: "blob",
        timeout: EXPORT_TIMEOUT_MS,
      });
      triggerDownload(
        res.data,
        filenameFromDisposition(
          res.headers?.["content-disposition"],
          fallbackName,
        ),
      );
    },
    [],
  );
}
