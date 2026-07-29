"use client";

import { Info, Loader2 } from "lucide-react";
import { downloadCsv, type CsvColumn } from "@/lib/csv";
import useReports from "@/hooks/useReports";
import type { InternshipPointsRow } from "@/types/report";
import useReportTable from "../../hooks/useReportTable";
import BreakdownList from "../../components/BreakdownList";
import ReportExportMenu from "../../components/ReportExportMenu";
import ReportStats from "../../components/ReportStats";
import ReportTableFooter from "../../components/ReportTableFooter";
import ReportToolbar from "../../components/ReportToolbar";

const points = (n: number) => (n ?? 0).toLocaleString("en-IN");

const CSV_COLUMNS: CsvColumn<InternshipPointsRow>[] = [
  { header: "Name", pick: (r) => r.name },
  { header: "Email", pick: (r) => r.email },
  { header: "Total Earned", pick: (r) => r.earned },
  { header: "Total Spent", pick: (r) => r.spent },
  { header: "Earned: Tasks & Exams", pick: (r) => r.earnedBreakdown.tasks },
  { header: "Earned: Live Meetings", pick: (r) => r.earnedBreakdown.meetings },
  { header: "Earned: Purchased", pick: (r) => r.earnedBreakdown.purchased },
];

/**
 * Internship success points. Unlike the wallet these have no ledger of their
 * own, so the figures are rebuilt from the three dated sources that credit
 * them. There is no redemption path, hence no spend.
 */
export default function InternshipPointsReport() {
  const { getInternshipPoints, exportRangeCsv } = useReports();
  const t = useReportTable(
    getInternshipPoints,
    "Could not load the internship success points report.",
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
            hint: "tasks + meetings + purchased",
            tone: "credit",
          },
          {
            label: "Total Spent",
            value: points(0),
            hint: "no redemption path exists",
          },
          {
            label: "From Tasks & Exams",
            value: points(totals?.tasks ?? 0),
            hint: "graded submissions",
          },
          {
            label: "Learners",
            value: points(totals?.users ?? 0),
            hint: "with points in this window",
          },
        ]}
      />

      <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-xs text-sky-900">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          Internship points are a certification score, not a wallet, so nothing
          spends them and <strong>Spent is always 0</strong>. Earned figures are
          rebuilt from graded submissions, finalized live-meeting attendance, and
          purchased-point orders. Lifetime totals are exact; a narrow date window
          attributes a post-finalize attendance correction to the meeting&apos;s
          finalize date rather than the day an admin changed the verdict.
        </p>
      </div>

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
                `internship-success-points_page-${t.page}.csv`,
              )
            }
            onExportRange={(from, to) =>
              exportRangeCsv(
                "internship",
                { ...t.filters, from, to },
                "internship-success-points.csv",
              )
            }
          />
        }
      />

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3 font-semibold text-black">Learner</th>
              <th className="px-4 py-3 text-right font-semibold text-black">
                Earned
              </th>
              <th className="px-4 py-3 text-right font-semibold text-black">
                Spent
              </th>
              <th className="px-4 py-3 font-semibold text-black">
                Earned from
              </th>
            </tr>
          </thead>
          <tbody>
            {t.loading ? (
              <tr>
                <td colSpan={4} className="py-12 text-center">
                  <Loader2 className="inline-block size-5 animate-spin text-gray-400" />
                </td>
              </tr>
            ) : t.rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-gray-500">
                  No internship points match these filters.
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
                  <td className="px-4 py-3 text-right tabular-nums text-gray-400">
                    0
                  </td>
                  <td className="px-4 py-3 text-xs text-[#475467]">
                    <BreakdownList
                      entries={[
                        ["Tasks & exams", r.earnedBreakdown.tasks],
                        ["Live meetings", r.earnedBreakdown.meetings],
                        ["Purchased", r.earnedBreakdown.purchased],
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
