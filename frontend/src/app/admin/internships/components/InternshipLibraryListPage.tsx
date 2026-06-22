"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import Container from "@/app/admin/components/ui/Container";
import Pagination from "@/components/admin/Pagination";

export type LibraryColumn<T> = {
  header: string;
  render: (row: T) => ReactNode;
};

type Props<T> = {
  title: string;
  description: string;
  load: (
    page: number,
    search: string,
  ) => Promise<{ rows: T[]; totalPages: number; total: number }>;
  columns: LibraryColumn<T>[];
  searchPlaceholder?: string;
  emptyMessage?: string;
};

export default function InternshipLibraryListPage<T extends { _id: string }>({
  title,
  description,
  load,
  columns,
  searchPlaceholder = "Search…",
  emptyMessage = "Nothing here yet.",
}: Props<T>) {
  const [searchInput, setSearchInput] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<T[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [searchDebounced]);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await load(page, searchDebounced);
      setRows(res.rows);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [load, page, searchDebounced]);

  useEffect(() => {
    void fetchPage();
  }, [fetchPage]);

  return (
    <div className="w-full h-full overflow-y-auto p-4 md:p-6">
      <Container
        title={title}
        description={description}
        className="w-full max-w-6xl mx-auto"
        classNameBody="flex flex-col gap-6"
      >
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none z-10" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
            />
          </div>
          <p className="text-sm text-gray-500">
            {loading ? "Loading…" : `${total} total`}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[520px]">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                {columns.map((c, i) => (
                  <th key={i} className="px-4 py-3 font-medium">
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row._id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60"
                  >
                    {columns.map((c, colIdx) => (
                      <td key={colIdx} className="px-4 py-3 align-top">
                        {c.render(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          disabled={loading}
        />
      </Container>
    </div>
  );
}
