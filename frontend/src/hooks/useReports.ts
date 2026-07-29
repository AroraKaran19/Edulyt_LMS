"use client";

import { useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type {
  InternshipPointsReport,
  PlatformPointsReport,
  ReferralReport,
  ReportFilters,
} from "@/types/report";

interface ApiSuccessBody<T> {
  success: boolean;
  data: T;
  message?: string;
}

/** A report aggregation over a wide window can outrun the 10s client default. */
const EXPORT_TIMEOUT_MS = 120_000;

export type ReportKind = "platform" | "internship" | "referrals";

const ENDPOINT_FOR: Record<ReportKind, string> = {
  platform: ENDPOINTS.reports.successPointsPlatform,
  internship: ENDPOINTS.reports.successPointsInternship,
  referrals: ENDPOINTS.reports.referrals,
};

function buildParams(
  filters: ReportFilters,
  page?: number,
  limit?: number,
): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  if (filters.q.trim()) params.q = filters.q.trim();
  if (page !== undefined) params.page = page;
  if (limit !== undefined) params.limit = limit;
  return params;
}

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

/** Client for the three admin report endpoints. */
export default function useReports() {
  const getPlatformPoints = useCallback(
    async (
      filters: ReportFilters,
      page: number,
      limit: number,
    ): Promise<PlatformPointsReport> => {
      const res = await apiClient.get<ApiSuccessBody<PlatformPointsReport>>(
        ENDPOINTS.reports.successPointsPlatform,
        { params: buildParams(filters, page, limit), timeout: EXPORT_TIMEOUT_MS },
      );
      return res.data.data;
    },
    [],
  );

  const getInternshipPoints = useCallback(
    async (
      filters: ReportFilters,
      page: number,
      limit: number,
    ): Promise<InternshipPointsReport> => {
      const res = await apiClient.get<ApiSuccessBody<InternshipPointsReport>>(
        ENDPOINTS.reports.successPointsInternship,
        { params: buildParams(filters, page, limit), timeout: EXPORT_TIMEOUT_MS },
      );
      return res.data.data;
    },
    [],
  );

  const getReferralReport = useCallback(
    async (
      filters: ReportFilters,
      page: number,
      limit: number,
    ): Promise<ReferralReport> => {
      const res = await apiClient.get<ApiSuccessBody<ReferralReport>>(
        ENDPOINTS.reports.referrals,
        { params: buildParams(filters, page, limit), timeout: EXPORT_TIMEOUT_MS },
      );
      return res.data.data;
    },
    [],
  );

  /**
   * Server-side CSV covering the ENTIRE date range (every matching row, not
   * just the visible page). The "current page" export is built client-side
   * from rows already in state — see `downloadRowsAsCsv`.
   */
  const exportRangeCsv = useCallback(
    async (
      kind: ReportKind,
      filters: ReportFilters,
      fallbackName: string,
    ): Promise<void> => {
      const res = await apiClient.get<Blob>(ENDPOINT_FOR[kind], {
        params: { ...buildParams(filters), format: "csv", scope: "range" },
        responseType: "blob",
        timeout: EXPORT_TIMEOUT_MS,
      });
      const filename = filenameFromDisposition(
        res.headers?.["content-disposition"],
        fallbackName,
      );
      triggerDownload(res.data, filename);
    },
    [],
  );

  return {
    getPlatformPoints,
    getInternshipPoints,
    getReferralReport,
    exportRangeCsv,
  };
}
