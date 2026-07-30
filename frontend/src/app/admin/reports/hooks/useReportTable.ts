"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import type { ReportFilters, ReportPage } from "@/types/report";

/**
 * Filter / paging / fetch state shared by every report table.
 *
 * The table itself is always all-time: a date window belongs either to one
 * user's drill-down modal or to a CSV export, never to the list. The search box
 * is debounced so each keystroke does not fire an aggregation, and any filter
 * change resets to page 1.
 */
export default function useReportTable<TRow, TTotals>(
  fetcher: (
    filters: ReportFilters,
    page: number,
    limit: number,
  ) => Promise<ReportPage<TRow, TTotals>>,
  errorMessage = "Could not load the report.",
) {
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [data, setData] = useState<ReportPage<TRow, TTotals> | null>(null);
  const [loading, setLoading] = useState(true);

  // Debounce the search box into the committed query.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ((prev) => (prev === searchInput ? prev : searchInput));
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filters = useMemo<ReportFilters>(
    () => ({ from: "", to: "", q }),
    [q],
  );

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setQ("");
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
