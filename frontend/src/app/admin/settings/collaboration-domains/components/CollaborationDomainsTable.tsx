import {
  AlertCircle,
  Loader2,
  Pause,
  Play,
  Pencil,
  Trash2,
} from "lucide-react";
import { CollaborationDomain } from "@/types/collaborationDomain";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import {
  getAccessLabel,
  getBenefitDisplay,
  getCoursesColumnDisplay,
} from "../utils/display";

interface CollaborationDomainsTableProps {
  isLoading: boolean;
  domains: CollaborationDomain[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onAddDomain: () => void;
  onToggleActive: (domain: CollaborationDomain) => void;
  onEdit: (domain: CollaborationDomain) => void;
  onDelete: (id: string) => void;
}

export default function CollaborationDomainsTable({
  isLoading,
  domains,
  hasActiveFilters,
  onClearFilters,
  onAddDomain,
  onToggleActive,
  onEdit,
  onDelete,
}: CollaborationDomainsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-white p-8 flex flex-col items-center justify-center gap-4">
          <Loader2 className="size-10 text-orange-500 animate-spin" />
          <p className="text-gray-600 font-medium">Loading domains…</p>
          <div className="w-full max-w-md h-2 bg-gray-200 rounded-full overflow-hidden" />
        </div>
      </div>
    );
  }

  if (domains.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
        <div className="inline-flex p-4 rounded-full bg-gray-100 mb-4">
          <AlertCircle className="size-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          No collaboration domains found
        </h3>
        <p className="text-gray-500 text-sm mb-4">
          {hasActiveFilters
            ? "Try adjusting search or status filter."
            : "Add a domain to offer partnership pricing and access rules."}
        </p>
        {hasActiveFilters ? (
          <WhiteButton onClick={onClearFilters}>Clear filters</WhiteButton>
        ) : (
          <WhiteButton onClick={onAddDomain}>Add domain</WhiteButton>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
      <div className="overflow-x-auto overflow-y-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-4 px-4 font-semibold text-gray-700">
                Domain
              </th>
              <th className="text-left py-4 px-4 font-semibold text-gray-700">
                Title
              </th>
              <th className="text-left py-4 px-4 font-semibold text-gray-700">
                Status
              </th>
              <th className="text-left py-4 px-4 font-semibold text-gray-700">
                Courses
              </th>
              <th
                className="text-left py-4 px-4 font-semibold text-gray-700"
                title="Course allot only: full, partial, or top-N content. Not used for global discount partnerships."
              >
                Access
              </th>
              <th
                className="text-left py-4 px-4 font-semibold text-gray-700"
                title="Discount only: global % or fixed off at checkout. None for course allot."
              >
                Discount
              </th>
              <th className="text-right py-4 px-4 font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {domains.map((domain) => {
              const benefit = getBenefitDisplay(domain);
              const accessLabel = getAccessLabel(domain);
              const coursesLabel = getCoursesColumnDisplay(domain);
              return (
                <tr
                  key={domain._id}
                  className="hover:bg-orange-50/30 transition-colors"
                >
                  <td className="py-3 px-4">
                    <code className="font-mono text-xs text-gray-800">
                      {domain.domain}
                    </code>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-800 max-w-[200px] truncate">
                    {domain.title}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                        domain.isActive
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      {domain.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700 tabular-nums">
                    {coursesLabel}
                  </td>
                  <td
                    className="py-3 px-4 text-gray-700 max-w-[160px] truncate"
                    title={
                      accessLabel
                        ? undefined
                        : "No per-course enrollment rules; this partnership is checkout discount only."
                    }
                  >
                    {accessLabel ?? (
                      <span className="text-gray-400">None</span>
                    )}
                  </td>
                  <td
                    className="py-3 px-4 text-gray-700 max-w-[120px] truncate"
                    title={
                      benefit
                        ? undefined
                        : "No checkout discount. Partnership is course access only (see Access column)."
                    }
                  >
                    {benefit ?? (
                      <span className="text-gray-400">None</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onToggleActive(domain)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 cursor-pointer"
                        title={domain.isActive ? "Pause" : "Activate"}
                      >
                        {domain.isActive ? (
                          <Pause className="size-3.5" />
                        ) : (
                          <Play className="size-3.5" />
                        )}
                        {domain.isActive ? "Pause" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(domain)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-orange-600 hover:bg-orange-50 cursor-pointer"
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(domain._id!)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
