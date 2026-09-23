"use client";

import { Loader2 } from "lucide-react";
import { formatIstDate } from "@/lib/ist";
import { AMBASSADOR_KIND_LABELS } from "@/hooks/useCrm";
import type { CaDirectoryOutcome, CaDirectoryRow } from "@/types/ca-application";

const CHIP =
  "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset";

const OUTCOME_STYLES: Record<CaDirectoryOutcome, string> = {
  active: "bg-green-50 text-green-700 ring-green-600/20",
  upcoming: "bg-blue-50 text-blue-700 ring-blue-600/20",
  issued: "bg-gray-100 text-gray-600 ring-gray-500/20",
  "not-eligible": "bg-red-50 text-red-700 ring-red-600/20",
  "on-hold": "bg-amber-50 text-amber-700 ring-amber-600/20",
  "awaiting-review": "bg-orange-50 text-orange-700 ring-orange-600/20",
};

const OUTCOME_LABELS: Record<CaDirectoryOutcome, string> = {
  active: "Active",
  upcoming: "Upcoming",
  issued: "Issued",
  "not-eligible": "Not eligible",
  "on-hold": "On hold",
  "awaiting-review": "Awaiting review",
};

interface Props {
  rows: CaDirectoryRow[];
  loading: boolean;
  isOwner: boolean;
  onOpen: (id: string) => void;
}

export default function CasTable({ rows, loading, isOwner, onOpen }: Props) {
  const columnCount = isOwner ? 7 : 8;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Intern ID</th>
              {!isOwner ? <th className="px-5 py-3">Team</th> : null}
              <th className="px-5 py-3">Kind</th>
              <th className="px-5 py-3">Joined</th>
              <th className="px-5 py-3">Ends</th>
              <th className="px-5 py-3">Points</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={columnCount} className="px-5 py-12 text-center">
                  <Loader2 className="mx-auto size-6 animate-spin text-gray-400" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-5 py-12 text-center text-gray-500">
                  No campus ambassadors here yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => onOpen(row.id)}
                      className="text-left font-medium text-gray-900 hover:text-orange-600 hover:underline"
                    >
                      {row.name}
                    </button>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                      {row.email}
                      {row.migrated ? (
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 ring-1 ring-inset ring-gray-300">
                          Migrated
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-gray-700">{row.internId ?? "-"}</td>
                  {!isOwner ? (
                    <td className="px-5 py-3 text-gray-700">{row.ownerName || "-"}</td>
                  ) : null}
                  <td className="px-5 py-3 text-gray-700">
                    {row.kind ? AMBASSADOR_KIND_LABELS[row.kind] : "-"}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-gray-700">
                    {row.joiningDate ? formatIstDate(row.joiningDate) : "-"}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-gray-700">
                    {row.endDate ? formatIstDate(row.endDate) : "-"}
                    <div className="text-xs text-gray-500">{row.durationMonths} months</div>
                  </td>
                  <td className="px-5 py-3 text-gray-700 tabular-nums">{row.caPoints}</td>
                  <td className="px-5 py-3">
                    <span className={`${CHIP} ${OUTCOME_STYLES[row.outcome]}`}>
                      {OUTCOME_LABELS[row.outcome]}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
