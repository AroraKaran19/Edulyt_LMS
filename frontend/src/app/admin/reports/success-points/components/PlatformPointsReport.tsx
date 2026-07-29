"use client";

import { Loader2 } from "lucide-react";
import { downloadCsv, type CsvColumn } from "@/lib/csv";
import useReports from "@/hooks/useReports";
import type { PlatformPointsRow } from "@/types/report";
import useReportTable from "../../hooks/useReportTable";
import BreakdownList from "../../components/BreakdownList";
import ReportExportMenu from "../../components/ReportExportMenu";
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

  const totals = t.data?.totals;

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
            hint: "with activity in this window",
          },
        ]}
      />

      <ReportToolbar
        filters={t.filters}
        searchInput={t.searchInput}
        onSearchInputChange={t.setSearchInput}
        onDateChange={t.setDates}
        onClear={t.clearFilters}
        actions={
          <ReportExportMenu
            pageRowCount={t.rows.length}
            initialFrom={t.filters.from}
            initialTo={t.filters.to}
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
        <table className="w-full min-w-[880px] text-sm">
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
              <th className="px-4 py-3 font-semibold text-black">
                Earned from
              </th>
              <th className="px-4 py-3 font-semibold text-black">Spent on</th>
            </tr>
          </thead>
          <tbody>
            {t.loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <Loader2 className="inline-block size-5 animate-spin text-gray-400" />
                </td>
              </tr>
            ) : t.rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-500">
                  No wallet activity matches these filters.
                </td>
              </tr>
            ) : (
              t.rows.map((r) => (
                <tr
                  key={r.userId}
                  className="border-b border-gray-100 align-top last:border-0"
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
                  <td className="px-4 py-3 text-xs text-[#475467]">
                    <BreakdownList
                      entries={[
                        ["Courses", r.earnedBreakdown.courses],
                        ["Rewards", r.earnedBreakdown.rewards],
                        ["Transfers in", r.earnedBreakdown.transfersIn],
                        ["Admin grants", r.earnedBreakdown.adminGrants],
                      ]}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-[#475467]">
                    <BreakdownList
                      entries={[
                        ["Redeemed", r.spentBreakdown.redeemed],
                        ["Transfers out", r.spentBreakdown.transfersOut],
                        ["Admin deductions", r.spentBreakdown.adminDeductions],
                      ]}
                    />
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
    </div>
  );
}
