"use client";

import { useCallback } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { downloadCsv, type CsvColumn } from "@/lib/csv";
import useReports from "@/hooks/useReports";
import type { PlatformPointsRow } from "@/types/report";
import useReportTable from "../../hooks/useReportTable";
import useScopedRowDetail from "../../hooks/useScopedRowDetail";
import ExportCsvMenu from "@/components/admin/ExportCsvMenu";
import ReportRowDetailModal from "../../components/ReportRowDetailModal";
import ReportStats from "../../components/ReportStats";
import ReportTableFooter from "../../components/ReportTableFooter";
import ReportToolbar from "../../components/ReportToolbar";

const points = (n: number) => (n ?? 0).toLocaleString("en-IN");

const CSV_COLUMNS: CsvColumn<PlatformPointsRow>[] = [
  { header: "Name", pick: (r) => r.name },
  { header: "Email", pick: (r) => r.email },
  { header: "Total Earned", pick: (r) => r.earned },
  { header: "Total Spent", pick: (r) => r.spent },
  { header: "Net", pick: (r) => r.earned - r.spent },
  { header: "Current Balance", pick: (r) => r.balance },
  { header: "Earned: Courses", pick: (r) => r.earnedBreakdown.courses },
  { header: "Earned: Rewards", pick: (r) => r.earnedBreakdown.rewards },
  { header: "Earned: Transfers In", pick: (r) => r.earnedBreakdown.transfersIn },
  { header: "Earned: Admin Grants", pick: (r) => r.earnedBreakdown.adminGrants },
  { header: "Spent: Redeemed", pick: (r) => r.spentBreakdown.redeemed },
  { header: "Spent: Transfers Out", pick: (r) => r.spentBreakdown.transfersOut },
  {
    header: "Spent: Admin Deductions",
    pick: (r) => r.spentBreakdown.adminDeductions,
  },
];

/** All-zero copy of a row, shown when a date window holds no activity. */
const zeroed = (r: PlatformPointsRow): PlatformPointsRow => ({
  ...r,
  earned: 0,
  spent: 0,
  earnedBreakdown: {
    courses: 0,
    rewards: 0,
    transfersIn: 0,
    adminGrants: 0,
  },
  spentBreakdown: { redeemed: 0, transfersOut: 0, adminDeductions: 0 },
});

/**
 * Platform (wallet) success points. `successPointsHistory` is a real dated
 * ledger, so earned and spent are both exact for any window.
 */
export default function PlatformPointsReport() {
  const { getPlatformPoints, exportRangeCsv } = useReports();
  const t = useReportTable(
    getPlatformPoints,
    "Could not load the platform success points report.",
  );

  // Re-resolve one student's figures for a window by searching on their email,
  // which is unique — no extra endpoint needed.
  const resolveScoped = useCallback(
    async (row: PlatformPointsRow, from: string, to: string) => {
      if (!row.email) return null;
      const res = await getPlatformPoints({ from, to, q: row.email }, 1, 25);
      return res.items.find((r) => r.userId === row.userId) ?? null;
    },
    [getPlatformPoints],
  );

  const d = useScopedRowDetail(resolveScoped, zeroed);
  const totals = t.data?.totals;
  const shown = d.detail;

  return (
    <div className="space-y-4">
      <ReportStats
        loading={t.loading && !t.data}
        stats={[
          {
            label: "Total Earned",
            value: points(totals?.earned ?? 0),
            hint: "credits into wallets",
            tone: "credit",
          },
          {
            label: "Total Spent",
            value: points(totals?.spent ?? 0),
            hint: "redeemed, transferred out, clawed back",
            tone: "debit",
          },
          {
            label: "Net",
            value: points(totals?.net ?? 0),
            hint: "earned − spent",
          },
          {
            label: "Students",
            value: points(totals?.users ?? 0),
            hint: "with wallet activity",
          },
        ]}
      />

      <ReportToolbar
        searchInput={t.searchInput}
        onSearchInputChange={t.setSearchInput}
        onClear={t.clearFilters}
        actions={
          <ExportCsvMenu
            pageRowCount={t.rows.length}
            disabled={t.loading}
            onExportCurrentPage={() =>
              downloadCsv(
                t.rows,
                CSV_COLUMNS,
                `platform-success-points_page-${t.page}.csv`,
              )
            }
            onExportRange={(from, to) =>
              exportRangeCsv(
                "platform",
                { ...t.filters, from, to },
                "platform-success-points.csv",
              )
            }
          />
        }
      />

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3 font-semibold text-black">Student</th>
              <th className="px-4 py-3 text-right font-semibold text-black">
                Earned
              </th>
              <th className="px-4 py-3 text-right font-semibold text-black">
                Spent
              </th>
              <th className="px-4 py-3 text-right font-semibold text-black">
                Net
              </th>
              <th className="px-4 py-3 text-right font-semibold text-black">
                Balance
              </th>
              <th className="w-10 px-4 py-3" aria-label="View details" />
            </tr>
          </thead>
          <tbody>
            {t.loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <Loader2 className="inline-block size-5 animate-spin text-gray-400" />
                </td>
              </tr>
            ) : t.rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500">
                  No wallet activity matches this search.
                </td>
              </tr>
            ) : (
              t.rows.map((r) => (
                <tr
                  key={r.userId}
                  tabIndex={0}
                  role="button"
                  aria-label={`View success points breakdown for ${r.name || r.email}`}
                  onClick={() => d.open(r)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      d.open(r);
                    }
                  }}
                  className="group cursor-pointer border-b border-gray-100 transition last:border-0 hover:bg-orange-50/50 focus:bg-orange-50/70 focus:outline-none"
                >
                  <td className="px-4 py-3 text-[#1D2939]">
                    <p className="font-medium">{r.name || "—"}</p>
                    <p className="text-xs text-gray-500">{r.email}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-700">
                    {points(r.earned)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-red-700">
                    {points(r.spent)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-[#1D2939]">
                    {points(r.earned - r.spent)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#475467]">
                    {points(r.balance)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronRight className="inline size-4 text-gray-300 transition group-hover:text-[#F77124]" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ReportTableFooter
        page={t.page}
        totalPages={t.totalPages}
        onPageChange={t.setPage}
        pageSize={t.pageSize}
        onPageSizeChange={(n) => {
          t.setPageSize(n);
          t.setPage(1);
        }}
        loading={t.loading}
        summary={
          t.total === 0
            ? "No rows"
            : `Showing ${t.rangeStart}–${t.rangeEnd} of ${t.total}`
        }
      />

      <ReportRowDetailModal
        isOpen={d.isOpen}
        onClose={d.close}
        title={d.row?.name || d.row?.email || "Student"}
        subtitle={d.row?.email}
        from={d.from}
        to={d.to}
        onFromChange={d.row?.email ? d.setFrom : undefined}
        onToChange={d.row?.email ? d.setTo : undefined}
        onClearDates={d.clearDates}
        loading={d.loading}
        stats={[
          {
            label: "Earned",
            value: points(shown?.earned ?? 0),
            tone: "credit",
          },
          { label: "Spent", value: points(shown?.spent ?? 0), tone: "debit" },
          {
            label: "Net",
            value: points((shown?.earned ?? 0) - (shown?.spent ?? 0)),
          },
          {
            label: "Balance",
            value: points(d.row?.balance ?? 0),
          },
        ]}
        sections={[
          {
            title: "Earned from",
            tone: "credit",
            total: shown?.earned ?? 0,
            emptyLabel: "No points earned in this window.",
            items: [
              {
                label: "Course completion & plan purchase",
                value: shown?.earnedBreakdown.courses ?? 0,
              },
              {
                label: "Milestone rewards",
                hint: "signup bonus, community review, internship registration",
                value: shown?.earnedBreakdown.rewards ?? 0,
              },
              {
                label: "Transfers in",
                hint: "received from another student",
                value: shown?.earnedBreakdown.transfersIn ?? 0,
              },
              {
                label: "Admin grants",
                value: shown?.earnedBreakdown.adminGrants ?? 0,
              },
            ],
          },
          {
            title: "Spent on",
            tone: "debit",
            total: shown?.spent ?? 0,
            emptyLabel: "No points spent in this window.",
            items: [
              {
                label: "Redeemed at checkout",
                value: shown?.spentBreakdown.redeemed ?? 0,
              },
              {
                label: "Transfers out",
                hint: "sent to another student",
                value: shown?.spentBreakdown.transfersOut ?? 0,
              },
              {
                label: "Admin deductions",
                value: shown?.spentBreakdown.adminDeductions ?? 0,
              },
            ],
          },
        ]}
        footnote="Balance is the live wallet figure and is always all-time — it does not change with the date range above."
      />
    </div>
  );
}
