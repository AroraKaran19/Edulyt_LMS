"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import type { ReportFilters, ReportPage } from "@/types/report";

const EMPTY_FILTERS: ReportFilters = { from: "", to: "", q: "" };

/**
 * Filter / paging / fetch state shared by every report table.
 *
 * Dates apply immediately; the search box is debounced so each keystroke does
 * not fire an aggregation. Any filter change resets to page 1.
 */
export default function useReportTable<TRow, TTotals>(
  fetcher: (
    filters: ReportFilters,
    page: number,
    limit: number,
  ) => Promise<ReportPage<TRow, TTotals>>,
  errorMessage = "Could not load the report.",
) {
  const [filters, setFilters] = useState<ReportFilters>(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [data, setData] = useState<ReportPage<TRow, TTotals> | null>(null);
  const [loading, setLoading] = useState(true);

  // Debounce the search box into the committed filters.
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => (f.q === searchInput ? f : { ...f, q: searchInput }));
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setDates = useCallback(
    (patch: Partial<Pick<ReportFilters, "from" | "to">>) => {
      setFilters((f) => ({ ...f, ...patch }));
      setPage(1);
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setSearchInput("");
    setPage(1);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetcher(filters, page, pageSize));
    } catch (err: unknown) {
      const e = err as { serverMessage?: string; message?: string };
      toast.error(e?.serverMessage ?? e?.message ?? errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetcher, filters, page, pageSize, errorMessage]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(total, page * pageSize);

  return {
    filters,
    searchInput,
    setSearchInput,
    setDates,
    clearFilters,
    page,
    setPage,
    pageSize,
    setPageSize,
    data,
    rows,
    total,
    totalPages: Math.max(1, data?.totalPages ?? 1),
    rangeStart,
    rangeEnd,
    loading,
    reload: load,
  };
}
