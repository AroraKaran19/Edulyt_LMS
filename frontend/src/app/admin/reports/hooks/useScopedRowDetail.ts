"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

/**
 * Drives the row drill-down modal: which row is open, the date window applied
 * to it, and the re-resolved figures for that window.
 *
 * Opening a row costs nothing — the table row already carries all-time figures,
 * so `detail` starts as the row itself. A fetch fires only once a date bound is
 * set, and clearing the dates snaps straight back to the original row.
 *
 * `resolve` should return the same row shape scoped to `[from, to]`, or `null`
 * when the user had no activity in that window.
 */
export default function useScopedRowDetail<TRow>(
  resolve: (row: TRow, from: string, to: string) => Promise<TRow | null>,
  /** Zeroed copy of a row, used when the window contains no activity. */
  emptyOf: (row: TRow) => TRow,
) {
  const [row, setRow] = useState<TRow | null>(null);
  const [detail, setDetail] = useState<TRow | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  // Guards against a slow response for an abandoned window overwriting a newer
  // one (or a row the admin has since closed).
  const requestRef = useRef(0);

  const open = useCallback((next: TRow) => {
    requestRef.current += 1;
    setRow(next);
    setDetail(next);
    setFrom("");
    setTo("");
    setLoading(false);
  }, []);

  const close = useCallback(() => {
    requestRef.current += 1;
    setRow(null);
    setDetail(null);
    setFrom("");
    setTo("");
    setLoading(false);
  }, []);

  const clearDates = useCallback(() => {
    setFrom("");
    setTo("");
  }, []);

  useEffect(() => {
    if (!row) return;

    // No window → the row's own all-time figures already answer it.
    if (!from && !to) {
      requestRef.current += 1;
      setDetail(row);
      setLoading(false);
      return;
    }

    if (from && to && from > to) return;

    const token = ++requestRef.current;
    setLoading(true);
    void (async () => {
      try {
        const scoped = await resolve(row, from, to);
        if (requestRef.current !== token) return;
        setDetail(scoped ?? emptyOf(row));
      } catch (err: unknown) {
        if (requestRef.current !== token) return;
        const e = err as { serverMessage?: string; message?: string };
        toast.error(
          e?.serverMessage ?? e?.message ?? "Could not load this date range.",
        );
        setDetail(row);
      } finally {
        if (requestRef.current === token) setLoading(false);
      }
    })();
  }, [row, from, to, resolve, emptyOf]);

  return {
    row,
    detail,
    isOpen: row !== null,
    from,
    to,
    setFrom,
    setTo,
    clearDates,
    loading,
    open,
    close,
  };
}
