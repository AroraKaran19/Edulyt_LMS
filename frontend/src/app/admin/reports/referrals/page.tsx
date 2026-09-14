"use client";

import { useCallback } from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import { downloadCsv, type CsvColumn } from "@/lib/csv";
import useReports from "@/hooks/useReports";
import type { ReferralReportRow } from "@/types/report";
import useReportTable from "../hooks/useReportTable";
import useScopedRowDetail from "../hooks/useScopedRowDetail";
import ExportCsvMenu from "@/components/admin/ExportCsvMenu";
import ReportRowDetailModal from "../components/ReportRowDetailModal";
import ReportStats from "../components/ReportStats";
import ReportTableFooter from "../components/ReportTableFooter";
import ReportToolbar from "../components/ReportToolbar";
import BrandMark from "@/components/admin/BrandMark";
import { BRANDS, BRAND_LABEL, type Brand } from "@/constants/brands";

const count = (n: number) => (n ?? 0).toLocaleString("en-IN");

const rupees = (n: number) =>
  `₹${(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const CSV_COLUMNS: CsvColumn<ReferralReportRow>[] = [
  { header: "Name", pick: (r) => r.name },
  { header: "Email", pick: (r) => r.email },
  { header: "Referral Code", pick: (r) => r.code },
  { header: "Brand", pick: (r) => BRAND_LABEL[r.brand] },
  { header: "Total Referrals", pick: (r) => r.totalReferrals },
  { header: "Total Earned (INR)", pick: (r) => r.totalEarned },
  { header: "Total Paid (INR)", pick: (r) => r.totalPaid },
  { header: "Pending Payout (INR)", pick: (r) => r.pendingPayout },
  { header: "Balance (INR)", pick: (r) => r.balance },
];

/** All-zero copy of a row, shown when a date window holds no activity. */
const zeroed = (r: ReferralReportRow): ReferralReportRow => ({
  ...r,
  totalReferrals: 0,
  totalEarned: 0,
  totalPaid: 0,
  pendingPayout: 0,
  balance: 0,
});

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

  const resolveScoped = useCallback(
    async (row: ReferralReportRow, from: string, to: string) => {
      if (!row.email) return null;
      const res = await getReferralReport(
        { from, to, q: row.email, brand: row.brand },
        1,
        25,
      );
      return (
        res.items.find(
          (r) => r.userId === row.userId && r.brand === row.brand,
        ) ?? null
      );
    },
    [getReferralReport],
  );

  const d = useScopedRowDetail(resolveScoped, zeroed);
  const totals = t.data?.totals;
  const shown = d.detail;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-black sm:text-2xl">
            Referral Report
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Commission earned against payouts actually settled. Click a referrer
            to scope their figures to a date range.
          </p>
        </div>
        {/* The redeem queue itself lives under All Users — link across so this
            page isn't a dead end when a pending payout needs acting on. */}
        <Link
          href="/admin/users/referral-withdrawals?status=pending"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-[#344054] transition hover:border-[#F77124] hover:text-[#F77124]"
        >
          Pending redeem requests
          <ExternalLink className="size-3.5" />
        </Link>
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
        searchInput={t.searchInput}
        onSearchInputChange={t.setSearchInput}
        onClear={t.clearFilters}
        hasFilters={Boolean(t.brand)}
        filters={
          <label className="flex flex-col gap-1 text-xs font-medium text-[#344054]">
            Brand
            <select
              value={t.brand}
              onChange={(e) => t.setBrand(e.target.value as Brand | "")}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F77124] focus:ring-2 focus:ring-[#F77124]/20"
            >
              <option value="">All brands</option>
              {BRANDS.map((b) => (
                <option key={b} value={b}>
                  {BRAND_LABEL[b]}
                </option>
              ))}
            </select>
          </label>
        }
        actions={
          <ExportCsvMenu
            pageRowCount={t.rows.length}
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
              <th className="px-4 py-3 font-semibold text-black">Brand</th>
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
              <th className="w-10 px-4 py-3" aria-label="View details" />
            </tr>
          </thead>
          <tbody>
            {t.loading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center">
                  <Loader2 className="inline-block size-5 animate-spin text-gray-400" />
                </td>
              </tr>
            ) : t.rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-500">
                  No referral activity matches this search.
                </td>
              </tr>
            ) : (
              t.rows.map((r) => (
                <tr
                  key={`${r.userId}:${r.brand}`}
                  tabIndex={0}
                  role="button"
                  aria-label={`View referral breakdown for ${r.name || r.email}`}
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
                    <p className="font-medium">{r.name || "-"}</p>
                    <p className="text-xs text-gray-500">{r.email}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#344054]">
                    {r.code || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <BrandMark brand={r.brand} />
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
                    {r.pendingPayout > 0 ? rupees(r.pendingPayout) : "-"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#475467]">
                    {rupees(r.balance)}
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
        title={d.row?.name || d.row?.email || "Referrer"}
        subtitle={
          d.row
            ? [
                d.row.email,
                BRAND_LABEL[d.row.brand],
                d.row.code ? `code ${d.row.code}` : "",
              ]
                .filter(Boolean)
                .join(" · ")
            : undefined
        }
        from={d.from}
        to={d.to}
        onFromChange={d.row?.email ? d.setFrom : undefined}
        onToChange={d.row?.email ? d.setTo : undefined}
        onClearDates={d.clearDates}
        loading={d.loading}
        stats={[
          {
            label: "Referrals",
            value: count(shown?.totalReferrals ?? 0),
          },
          {
            label: "Earned",
            value: rupees(shown?.totalEarned ?? 0),
            tone: "credit",
          },
          {
            label: "Paid",
            value: rupees(shown?.totalPaid ?? 0),
            tone: "debit",
          },
          {
            label: "Balance",
            value: rupees(shown?.balance ?? 0),
          },
        ]}
        sections={[
          {
            title: "Commission earned",
            subtitle: "active referral sales, dated by when they were earned",
            tone: "credit",
            total: shown?.totalEarned ?? 0,
            emptyLabel: "No commission earned in this window.",
            items: [
              {
                label: "Qualifying referrals",
                value: shown?.totalReferrals ?? 0,
              },
              {
                label: "Commission (₹)",
                hint: "frozen per sale at the tier live when it was made",
                value: shown?.totalEarned ?? 0,
              },
            ],
          },
          {
            title: "Payouts",
            subtitle: "withdrawals, dated by when they were decided",
            tone: "debit",
            total: (shown?.totalPaid ?? 0) + (shown?.pendingPayout ?? 0),
            emptyLabel: "No withdrawals in this window.",
            items: [
              { label: "Paid out (₹)", value: shown?.totalPaid ?? 0 },
              {
                label: "Pending / processing (₹)",
                hint: "requested but not yet settled",
                value: shown?.pendingPayout ?? 0,
              },
            ],
          },
        ]}
        footnote={
          <>
            Balance is earned minus everything already paid or held for payout,
            so a pending withdrawal is already deducted.{" "}
            {d.row?.email ? (
              <Link
                href={`/admin/users/referral-withdrawals?search=${encodeURIComponent(
                  d.row.email,
                )}&status=pending&brand=${d.row.brand}`}
                className="inline-flex items-center gap-1 font-semibold text-[#F77124] hover:underline"
              >
                View this referrer&apos;s redeem requests
                <ExternalLink className="size-3" />
              </Link>
            ) : null}
          </>
        }
      />
    </div>
  );
}
