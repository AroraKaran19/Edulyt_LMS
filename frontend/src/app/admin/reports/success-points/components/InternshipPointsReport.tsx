"use client";

import { useCallback } from "react";
import { ChevronRight, Info, Loader2 } from "lucide-react";
import { downloadCsv, type CsvColumn } from "@/lib/csv";
import useReports from "@/hooks/useReports";
import type { InternshipPointsRow } from "@/types/report";
import useReportTable from "../../hooks/useReportTable";
import useScopedRowDetail from "../../hooks/useScopedRowDetail";
import type { DetailSection } from "../../components/ReportRowDetailModal";
import ExportCsvMenu from "@/components/admin/ExportCsvMenu";
import ReportRowDetailModal from "../../components/ReportRowDetailModal";
import ReportStats from "../../components/ReportStats";
import ReportTableFooter from "../../components/ReportTableFooter";
import ReportToolbar from "../../components/ReportToolbar";

const points = (n: number) => (n ?? 0).toLocaleString("en-IN");

/**
 * The API nests each learner's internships; a spreadsheet wants them flat, so
 * the client-side export mirrors the server's one-line-per-(learner × internship)
 * shape.
 */
interface FlatRow {
  name: string;
  email: string;
  internshipTitle: string;
  batches: string[];
  earned: number;
  tasks: number;
  meetings: number;
  purchased: number;
  currentPoints: number;
  learnerTotalEarned: number;
}

function flatten(rows: readonly InternshipPointsRow[]): FlatRow[] {
  return rows.flatMap((r) =>
    r.internships.length === 0
      ? [
          {
            name: r.name,
            email: r.email,
            internshipTitle: "",
            batches: [],
            earned: r.earned,
            tasks: r.earnedBreakdown.tasks,
            meetings: r.earnedBreakdown.meetings,
            purchased: r.earnedBreakdown.purchased,
            currentPoints: r.currentPoints,
            learnerTotalEarned: r.earned,
          },
        ]
      : r.internships.map((s) => ({
          name: r.name,
          email: r.email,
          internshipTitle: s.internshipTitle,
          batches: s.batches,
          earned: s.earned,
          tasks: s.tasks,
          meetings: s.meetings,
          purchased: s.purchased,
          currentPoints: s.currentPoints,
          learnerTotalEarned: r.earned,
        })),
  );
}

const CSV_COLUMNS: CsvColumn<FlatRow>[] = [
  { header: "Name", pick: (r) => r.name },
  { header: "Email", pick: (r) => r.email },
  { header: "Internship", pick: (r) => r.internshipTitle },
  { header: "Batches", pick: (r) => r.batches.join(" | ") },
  { header: "Earned (this internship)", pick: (r) => r.earned },
  { header: "Earned: Tasks & Exams", pick: (r) => r.tasks },
  { header: "Earned: Live Meetings", pick: (r) => r.meetings },
  { header: "Earned: Purchased", pick: (r) => r.purchased },
  { header: "Current Points (all-time)", pick: (r) => r.currentPoints },
  { header: "Learner Total Earned", pick: (r) => r.learnerTotalEarned },
];

/** All-zero copy of a row, shown when a date window holds no activity. */
const zeroed = (r: InternshipPointsRow): InternshipPointsRow => ({
  ...r,
  earned: 0,
  earnedBreakdown: { tasks: 0, meetings: 0, purchased: 0 },
  internships: [],
});

/**
 * Internship success points per learner, divided by internship in the
 * drill-down. There is no spend figure: these are a certification score, not a
 * wallet, and nothing in the product debits them.
 */
export default function InternshipPointsReport() {
  const { getInternshipPoints, exportRangeCsv } = useReports();
  const t = useReportTable(
    getInternshipPoints,
    "Could not load the internship success points report.",
  );

  // Re-resolve one learner's figures for a window by searching on their email,
  // which is unique — no extra endpoint needed.
  const resolveScoped = useCallback(
    async (row: InternshipPointsRow, from: string, to: string) => {
      if (!row.email) return null;
      const res = await getInternshipPoints({ from, to, q: row.email }, 1, 25);
      return res.items.find((r) => r.userId === row.userId) ?? null;
    },
    [getInternshipPoints],
  );

  const d = useScopedRowDetail(resolveScoped, zeroed);
  const totals = t.data?.totals;
  const shown = d.detail;

  // One section per internship, so the modal reads as a division of the
  // learner's total rather than one merged pile of points.
  const sections: DetailSection[] =
    (shown?.internships.length ?? 0) === 0
      ? [
          {
            title: "No internship points in this window",
            total: 0,
            items: [],
            emptyLabel:
              "This learner earned no internship success points between the selected dates.",
          },
        ]
      : (shown?.internships ?? []).map((s) => ({
          title: s.internshipTitle || "(unnamed internship)",
          subtitle:
            s.batches.length > 0
              ? `Batch: ${s.batches.join(", ")}`
              : undefined,
          tone: "credit" as const,
          total: s.earned,
          items: [
            { label: "Tasks & exams", value: s.tasks },
            { label: "Live meetings", value: s.meetings },
            { label: "Purchased", value: s.purchased },
            {
              label: "Current points on enrollment",
              hint: "live counter, always all-time",
              value: s.currentPoints,
            },
          ],
        }));

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
            label: "Learners",
            value: points(totals?.learners ?? 0),
            hint: "with internship points",
          },
          {
            label: "Internships",
            value: points(totals?.internships ?? 0),
            hint: "programmes represented",
          },
          {
            label: "Purchased",
            value: points(totals?.purchased ?? 0),
            hint: "points bought outright",
          },
        ]}
      />

      <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-xs text-sky-900">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          Internship points are a certification score, not a wallet, so nothing
          spends them. Earned figures are rebuilt from graded submissions,
          finalized live-meeting attendance, and purchased-point orders. Click a
          learner to see the split by internship. Lifetime totals are exact; a
          narrow date window attributes a post-finalize attendance correction to
          the meeting&apos;s finalize date rather than the day an admin changed
          the verdict.
        </p>
      </div>

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
                flatten(t.rows),
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
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3 font-semibold text-black">Learner</th>
              <th className="px-4 py-3 font-semibold text-black">Internship</th>
              <th className="px-4 py-3 text-right font-semibold text-black">
                Earned
              </th>
              <th className="px-4 py-3 text-right font-semibold text-black">
                Current Points
              </th>
              <th className="w-10 px-4 py-3" aria-label="View details" />
            </tr>
          </thead>
          <tbody>
            {t.loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <Loader2 className="inline-block size-5 animate-spin text-gray-400" />
                </td>
              </tr>
            ) : t.rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-500">
                  No internship points match this search.
                </td>
              </tr>
            ) : (
              t.rows.map((r) => {
                const first = r.internships[0];
                const extra = r.internships.length - 1;
                return (
                  <tr
                    key={r.userId}
                    tabIndex={0}
                    role="button"
                    aria-label={`View internship points breakdown for ${r.name || r.email}`}
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
                    <td className="px-4 py-3 text-[#344054]">
                      <p className="line-clamp-1">
                        {first?.internshipTitle || "—"}
                      </p>
                      {extra > 0 ? (
                        <p className="text-xs font-medium text-[#F77124]">
                          +{extra} more internship{extra === 1 ? "" : "s"}
                        </p>
                      ) : first?.batches.length ? (
                        <p className="text-xs text-gray-500">
                          {first.batches.join(", ")}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-700">
                      {points(r.earned)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#475467]">
                      {points(r.currentPoints)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight className="inline size-4 text-gray-300 transition group-hover:text-[#F77124]" />
                    </td>
                  </tr>
                );
              })
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
        title={d.row?.name || d.row?.email || "Learner"}
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
          {
            label: "Internships",
            value: points(shown?.internships.length ?? 0),
          },
          {
            label: "Tasks & exams",
            value: points(shown?.earnedBreakdown.tasks ?? 0),
          },
          {
            label: "Live meetings",
            value: points(shown?.earnedBreakdown.meetings ?? 0),
          },
        ]}
        sections={sections}
        footnote="Points are divided by internship. “Current points on enrollment” is the live counter used for certification and is always all-time, so it does not change with the date range above."
      />
    </div>
  );
}
