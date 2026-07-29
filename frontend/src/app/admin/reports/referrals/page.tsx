"use client";

import { Loader2 } from "lucide-react";
import { downloadCsv, type CsvColumn } from "@/lib/csv";
import useReports from "@/hooks/useReports";
import type { ReferralReportRow } from "@/types/report";
import useReportTable from "../hooks/useReportTable";
import ReportExportMenu from "../components/ReportExportMenu";
import ReportStats from "../components/ReportStats";
import ReportTableFooter from "../components/ReportTableFooter";
import ReportToolbar from "../components/ReportToolbar";

const count = (n: number) => (n ?? 0).toLocaleString("en-IN");

const rupees = (n: number) =>
  `₹${(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const CSV_COLUMNS: CsvColumn<ReferralReportRow>[] = [
  { header: "Name", pick: (r) => r.name },
  { header: "Email", pick: (r) => r.email },
  { header: "Referral Code", pick: (r) => r.code },
  { header: "Total Referrals", pick: (r) => r.totalReferrals },
  { header: "Total Earned (INR)", pick: (r) => r.totalEarned },
  { header: "Total Paid (INR)", pick: (r) => r.totalPaid },
  { header: "Pending Payout (INR)", pick: (r) => r.pendingPayout },
  { header: "Balance (INR)", pick: (r) => r.balance },
];

/**
 * Per-referrer commission vs. payout. Referral counts exclude `reversed`
 * (refunded) sales, matching what the learner sees in their own dashboard.
 */
export default function ReferralReportPage() {
  const { getReferralReport, exportRangeCsv } = useReports();
  const t = useReportTable(
    getReferralReport,
    "Could not load the referral report.",
  );

  const totals = t.data?.totals;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-lg font-bold text-black sm:text-2xl">
          Referral Report
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Commission earned against payouts actually settled. Sales are dated by
          when they were earned, payouts by when they were decided.
        </p>
      </div>

      <ReportStats
        loading={t.loading && !t.data}
        stats={[
          {
            label: "Total Referrals",
            value: count(totals?.totalReferrals ?? 0),
            hint: "active sales, reversals excluded",
          },
          {
            label: "Total Earned",
            value: rupees(totals?.totalEarned ?? 0),
            hint: "commission accrued",
            tone: "credit",
          },
          {
            label: "Total Paid",
            value: rupees(totals?.totalPaid ?? 0),
            hint: "withdrawals settled",
            tone: "debit",
          },
          {
            label: "Pending Payout",
            value: rupees(totals?.pendingPayout ?? 0),
            hint: "requested, not yet settled",
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
                `referral-report_page-${t.page}.csv`,
              )
            }
            onExportRange={(from, to) =>
              exportRangeCsv(
                "referrals",
                { ...t.filters, from, to },
                "referral-report.csv",
              )
            }
          />
        }
      />

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3 font-semibold text-black">Referrer</th>
              <th className="px-4 py-3 font-semibold text-black">Code</th>
              <th className="px-4 py-3 text-right font-semibold text-black">
                Total Referrals
              </th>
              <th className="px-4 py-3 text-right font-semibold text-black">
                Total Earned
              </th>
              <th className="px-4 py-3 text-right font-semibold text-black">
                Total Paid
              </th>
              <th className="px-4 py-3 text-right font-semibold text-black">
                Pending
              </th>
              <th className="px-4 py-3 text-right font-semibold text-black">
                Balance
              </th>
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
                  No referral activity matches these filters.
                </td>
              </tr>
            ) : (
              t.rows.map((r) => (
                <tr
                  key={r.userId}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="px-4 py-3 text-[#1D2939]">
                    <p className="font-medium">{r.name || "—"}</p>
                    <p className="text-xs text-gray-500">{r.email}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#344054]">
                    {r.code || "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-[#1D2939]">
                    {count(r.totalReferrals)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-700">
                    {rupees(r.totalEarned)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-red-700">
                    {rupees(r.totalPaid)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-amber-700">
                    {r.pendingPayout > 0 ? rupees(r.pendingPayout) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#475467]">
                    {rupees(r.balance)}
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
