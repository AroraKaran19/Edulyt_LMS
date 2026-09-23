"use client";

import { BadgeCheck, Loader2 } from "lucide-react";
import { formatStoredPhone } from "@/lib/phone";
import { formatIstDate } from "@/lib/ist";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { AMBASSADOR_KIND_LABELS } from "@/hooks/useCrm";
import type { CaApplicationRow } from "@/types/ca-application";

const CHIP =
  "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset";

const formatApplied = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

interface Props {
  rows: CaApplicationRow[];
  loading: boolean;
  status: "pending" | "approved";
  isOwner: boolean;
  onOpen: (id: string) => void;
  onApprove: (row: CaApplicationRow) => void;
  onDecline: (row: CaApplicationRow) => void;
}

export default function CaLeadsTable({
  rows,
  loading,
  status,
  isOwner,
  onOpen,
  onApprove,
  onDecline,
}: Props) {
  const columnCount = isOwner ? 5 : 6;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="px-5 py-3">Applicant</th>
              <th className="px-5 py-3">College</th>
              {!isOwner ? <th className="px-5 py-3">Referred by</th> : null}
              <th className="px-5 py-3">Batch</th>
              <th className="px-5 py-3">Applied</th>
              <th className="px-5 py-3">Action</th>
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
                  No applications here yet.
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
                    <div className="mt-0.5 text-xs text-gray-500">{row.email}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      {formatStoredPhone(row.phone)}
                      <BadgeCheck className="size-3.5 text-green-600" />
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-700">
                    {row.collegeName || "-"}
                    {row.degree || row.careerStage ? (
                      <div className="text-xs text-gray-500">
                        {[row.degree, row.careerStage].filter(Boolean).join(", ")}
                      </div>
                    ) : null}
                  </td>
                  {!isOwner ? (
                    <td className="px-5 py-3">
                      {row.referrer ? (
                        <span className={`${CHIP} bg-orange-50 text-orange-700 ring-orange-600/20`}>
                          {row.referrer.name}
                        </span>
                      ) : (
                        <span className={`${CHIP} bg-gray-100 text-gray-600 ring-gray-500/20`}>
                          Direct
                        </span>
                      )}
                    </td>
                  ) : null}
                  <td className="px-5 py-3 whitespace-nowrap text-gray-700">
                    {row.joiningDate ? formatIstDate(row.joiningDate) : "-"}
                    <div className="text-xs text-gray-500">{row.durationMonths} months</div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-gray-500">
                    {formatApplied(row.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    {status === "pending" ? (
                      <div className="flex items-center gap-2">
                        <WhiteButton
                          type="button"
                          glow={false}
                          className="px-3! py-1.5! text-red-600 border-red-300 hover:border-red-400"
                          onClick={() => onDecline(row)}
                        >
                          Decline
                        </WhiteButton>
                        <OrangeButton
                          type="button"
                          glow={false}
                          className="px-3! py-1.5!"
                          onClick={() => onApprove(row)}
                        >
                          {isOwner ? "Accept" : "Approve"}
                        </OrangeButton>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-xs text-gray-700">
                          to {row.owner?.name ?? "-"}
                          {row.kind ? `, ${AMBASSADOR_KIND_LABELS[row.kind]}` : ""}
                        </div>
                        {row.attachIssue === "not-student" ? (
                          <span className={`${CHIP} bg-amber-50 text-amber-700 ring-amber-600/20`}>
                            Account is not a student
                          </span>
                        ) : row.attachIssue === "other-owner" ? (
                          <span className={`${CHIP} bg-amber-50 text-amber-700 ring-amber-600/20`}>
                            On another team
                          </span>
                        ) : (
                          <span className={`${CHIP} bg-blue-50 text-blue-700 ring-blue-600/20`}>
                            Waiting for signup
                          </span>
                        )}
                      </div>
                    )}
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
