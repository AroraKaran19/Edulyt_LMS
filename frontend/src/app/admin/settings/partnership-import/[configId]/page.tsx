"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Upload,
  Loader2,
  RotateCcw,
  Trash2,
  Search,
} from "lucide-react";
import * as XLSX from "xlsx";
import Container from "@/app/admin/components/ui/Container";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import Input from "@/components/ui/inputs/Input";
import Select from "@/components/ui/inputs/Select";
import { usePartnershipImportConfig } from "@/hooks/usePartnershipImportConfig";
import type {
  PartnershipImportConfig,
  PartnershipWhitelistEntry,
  CollaborationWhitelistStatus,
} from "@/types/partnershipImportConfig";
import { toast } from "react-toastify";

const LIMIT = 25;
const PAGE_BUTTON_WINDOW = 5;

/** Page indices to show as direct buttons (sliding window around current). */
function visiblePageNumbers(
  current: number,
  total: number,
  windowSize: number,
): number[] {
  if (total < 1) return [1];
  if (total <= windowSize) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, current - half);
  let end = start + windowSize - 1;
  if (end > total) {
    end = total;
    start = Math.max(1, end - windowSize + 1);
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function parseEmailsFromFile(file: File): Promise<{ email: string }[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buf = e.target?.result;
        if (!buf) {
          resolve([]);
          return;
        }
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0] || ""];
        if (!ws) {
          resolve([]);
          return;
        }
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
          defval: "",
          raw: false,
        });
        const out: { email: string }[] = [];
        const seen = new Set<string>();
        for (const row of rows) {
          const keys = Object.keys(row || {});
          const emailKey = keys.find((k) => k.trim().toLowerCase() === "email");
          const value =
            emailKey !== undefined
              ? row[emailKey]
              : keys.length === 1
                ? row[keys[0]]
                : "";
          const email = String(value || "")
            .trim()
            .toLowerCase();
          if (email && email.includes("@") && !seen.has(email)) {
            seen.add(email);
            out.push({ email });
          }
        }
        resolve(out);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

export default function PartnershipImportDetailPage() {
  const params = useParams();
  const configId = params.configId as string;

  const {
    getConfigById,
    getWhitelistStats,
    listWhitelist,
    importWhitelist,
    deleteWhitelistEntry,
    retryWhitelistEntry,
    isLoading,
  } = usePartnershipImportConfig();

  const [config, setConfig] = useState<PartnershipImportConfig | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [entries, setEntries] = useState<PartnershipWhitelistEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    CollaborationWhitelistStatus | ""
  >("");
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [importPhase, setImportPhase] = useState<
    null | "reading" | "uploading"
  >(null);

  const loadConfig = useCallback(async () => {
    const c = await getConfigById(configId);
    setConfig(c);
  }, [configId, getConfigById]);

  const loadStats = useCallback(async () => {
    const s = await getWhitelistStats(configId);
    setStats(s);
  }, [configId, getWhitelistStats]);

  const loadEntries = useCallback(async () => {
    const r = await listWhitelist(configId, {
      page,
      limit: LIMIT,
      search: searchQuery || undefined,
      status: statusFilter || undefined,
    });
    if (r) {
      setEntries(r.entries as PartnershipWhitelistEntry[]);
      setTotalPages(r.totalPages);
      setTotal(r.total);
    }
  }, [configId, listWhitelist, page, searchQuery, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    if (importPhase) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [importPhase]);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setImportPhase("reading");
    try {
      const rows = await parseEmailsFromFile(file);
      if (rows.length === 0) {
        toast.error('No emails found. Use a column named "email".');
        return;
      }
      setImportPhase("uploading");
      const result = await importWhitelist(configId, {
        mode: importMode,
        rows,
      });
      if (result) {
        const extra =
          importMode === "replace"
            ? `, ${result.expired} removed from previous list`
            : "";
        toast.success(
          `Import: ${result.inserted} inserted, ${result.updated} updated${extra}`,
        );
        void loadStats();
        void loadEntries();
      }
    } catch {
      toast.error(
        "Could not parse file. Use CSV or Excel with an email column.",
      );
    } finally {
      setImportPhase(null);
    }
  };

  const statusLabel = (s: string) =>
    ({
      pending: "Pending",
      queued: "Queued",
      enrolled: "Enrolled",
      benefit_applied: "Discount OK",
      failed: "Failed",
      expired: "Expired",
    })[s] ?? s;

  return (
    <Container
      title={config?.title ?? "Partnership import"}
      description="Upload student emails (CSV/Excel). Registration or the background worker will apply course access or discount eligibility."
      className="min-h-0"
      classNameBody="flex min-h-0 flex-col gap-6 overflow-x-hidden overflow-y-visible"
    >
      {importPhase && (
        <div
          className="fixed inset-0 z-200 flex items-center justify-center bg-gray-950/75 backdrop-blur-[2px] p-6"
          role="alertdialog"
          aria-modal="true"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="w-full max-w-md rounded-2xl bg-white px-8 py-10 shadow-2xl text-center space-y-5">
            <Loader2
              className="w-12 h-12 text-orange-500 animate-spin mx-auto"
              aria-hidden
            />
            <div>
              <p className="text-lg font-semibold text-gray-900">
                Processing import
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {importPhase === "reading"
                  ? "Reading your file and extracting emails…"
                  : "Uploading to the server…"}
              </p>
              <p className="text-xs text-gray-400 mt-3">
                Please wait — do not close or refresh this page.
              </p>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full w-[34%] rounded-full bg-linear-to-r from-orange-400 to-orange-600 csv-import-shuttle" />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/settings/partnership-import">
          <WhiteButton glow={false} className="gap-2 flex items-center">
            <ArrowLeft className="w-4 h-4" />
            All configurations
          </WhiteButton>
        </Link>
        <WhiteButton
          glow={false}
          onClick={() => void loadEntries()}
          title="Refresh list"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </WhiteButton>
      </div>

      {config && (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 flex flex-wrap gap-4">
          <span>
            Type:{" "}
            <strong>
              {config.kind === "discount"
                ? "Checkout discount"
                : "Course enrollment"}
            </strong>
          </span>
          <span>
            Status:{" "}
            <strong
              className={config.isActive ? "text-green-700" : "text-gray-500"}
            >
              {config.isActive ? "Active" : "Inactive"}
            </strong>
          </span>
        </div>
      )}

      {stats && (
        <div className="flex flex-wrap gap-2">
          {(
            [
              "pending",
              "queued",
              "enrolled",
              "benefit_applied",
              "failed",
              "expired",
            ] as const
          ).map((k) => (
            <span
              key={k}
              className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 text-xs font-medium"
            >
              {statusLabel(k)}: {stats[k] ?? 0}
            </span>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Import emails</h3>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end flex-wrap">
          <div className="w-full sm:w-fit">
            <Select
              options={[
                { value: "append", label: "Append / upsert" },
                { value: "replace", label: "Replace list (expire missing)" },
              ]}
              value={importMode}
              onChange={(v) => setImportMode(v as "append" | "replace")}
              placeholder="Import mode"
            />
          </div>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            id="pi-csv-upload"
            disabled={!!importPhase}
            onChange={(e) => {
              const f = e.target.files?.[0];
              void handleFile(f ?? null);
              e.target.value = "";
            }}
          />
          <WhiteButton
            glow={false}
            type="button"
            disabled={!!importPhase}
            onClick={() => document.getElementById("pi-csv-upload")?.click()}
            className="gap-2 flex items-center"
          >
            <Upload className="w-4 h-4" />
            Choose CSV / Excel
          </WhiteButton>
          <p className="text-xs text-gray-500 sm:flex-1 sm:min-w-[200px]">
            First column header should be{" "}
            <code className="bg-white px-1 rounded">email</code>. Duplicate
            emails in the file are deduplicated.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search email or name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            icon={<Search className="w-5 h-5 text-gray-400" />}
            className="w-full"
          />
        </div>
        <div className="w-full md:w-48">
          <Select
            options={[
              { value: "", label: "All statuses" },
              { value: "pending", label: "Pending" },
              { value: "queued", label: "Queued" },
              { value: "enrolled", label: "Enrolled" },
              { value: "benefit_applied", label: "Discount OK" },
              { value: "failed", label: "Failed" },
              { value: "expired", label: "Expired" },
            ]}
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter((v || "") as CollaborationWhitelistStatus | "");
              setPage(1);
            }}
            placeholder="Status"
          />
        </div>
      </div>

      <div className="min-w-0 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="sticky top-0 z-10 bg-gray-50 px-3 py-2 font-semibold shadow-[0_1px_0_0_rgb(229,231,235)]">
                Email
              </th>
              <th className="sticky top-0 z-10 bg-gray-50 px-3 py-2 font-semibold shadow-[0_1px_0_0_rgb(229,231,235)]">
                Status
              </th>
              <th className="sticky top-0 z-10 bg-gray-50 px-3 py-2 text-right font-semibold shadow-[0_1px_0_0_rgb(229,231,235)]">
                Actions
              </th>
            </tr>
          </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-8 text-center text-gray-500"
                  >
                    <Loader2 className="w-6 h-6 animate-spin inline text-orange-500" />
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-8 text-center text-gray-500"
                  >
                    No rows yet. Import a CSV above.
                  </td>
                </tr>
              ) : (
                entries.map((row) => (
                  <tr key={row._id} className="hover:bg-orange-50/30">
                    <td className="px-3 py-2 font-mono text-xs sm:text-sm">
                      {row.email}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs font-medium text-gray-800">
                        {statusLabel(row.status)}
                      </span>
                      {row.lastError && (
                        <div className="text-xs text-red-600 truncate max-w-[200px]">
                          {row.lastError}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex gap-1">
                        {(row.status === "failed" ||
                          (row.lastError &&
                            String(row.lastError).trim().length > 0)) && (
                          <WhiteButton
                            glow={false}
                            className="!px-2 !py-1"
                            title="Retry"
                            onClick={async () => {
                              if (!row._id) return;
                              const r = await retryWhitelistEntry(
                                configId,
                                row._id,
                              );
                              if (r) {
                                toast.success("Retry scheduled");
                                void loadEntries();
                                void loadStats();
                              }
                            }}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </WhiteButton>
                        )}
                        <WhiteButton
                          glow={false}
                          className="!px-2 !py-1 text-red-600"
                          title="Delete row"
                          onClick={async () => {
                            if (
                              !row._id ||
                              !confirm("Remove this email from the list?")
                            )
                              return;
                            const ok = await deleteWhitelistEntry(
                              configId,
                              row._id,
                            );
                            if (ok) {
                              toast.success("Removed");
                              void loadEntries();
                              void loadStats();
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </WhiteButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <p className="text-sm text-gray-600 order-2 sm:order-1">
            {total} rows total
          </p>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end sm:flex-wrap sm:gap-2 order-1 sm:order-2">
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              <WhiteButton
                glow={false}
                type="button"
                className="px-3! py-1.5! text-orange-600 border-orange-200 hover:bg-orange-50"
                disabled={page <= 1}
                title="First page"
                onClick={() => setPage(1)}
              >
                First
              </WhiteButton>
              <OrangeButton
                glow={false}
                type="button"
                className="px-3! py-1.5!"
                disabled={page <= 1}
                title="Previous page"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </OrangeButton>
              {visiblePageNumbers(page, totalPages, PAGE_BUTTON_WINDOW).map(
                (n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`min-w-9 px-2.5 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      n === page
                        ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                        : "bg-white text-gray-800 border-gray-300 hover:bg-orange-50/80 hover:border-orange-200"
                    }`}
                  >
                    {n}
                  </button>
                ),
              )}
              <span className="text-sm text-gray-600 px-1 sm:px-2 whitespace-nowrap tabular-nums">
                Page {page} of {totalPages}
              </span>
              <OrangeButton
                glow={false}
                type="button"
                className="px-3! py-1.5!"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </OrangeButton>
              <WhiteButton
                glow={false}
                type="button"
                className="px-3! py-1.5! text-orange-600 border-orange-200 hover:bg-orange-50"
                disabled={page >= totalPages}
                title="Last page"
                onClick={() => setPage(totalPages)}
              >
                Last
              </WhiteButton>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
