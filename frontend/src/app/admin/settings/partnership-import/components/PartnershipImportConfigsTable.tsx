"use client";

import Link from "next/link";
import { Pencil, Trash2, ListChecks } from "lucide-react";
import type { PartnershipImportConfig } from "@/types/partnershipImportConfig";
import WhiteButton from "@/components/ui/buttons/WhiteButton";

interface PartnershipImportConfigsTableProps {
  isLoading: boolean;
  configs: PartnershipImportConfig[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onCreate: () => void;
  onEdit: (c: PartnershipImportConfig) => void | Promise<void>;
  onDelete: (id: string) => void;
  onToggleActive: (c: PartnershipImportConfig) => void;
}

export default function PartnershipImportConfigsTable({
  isLoading,
  configs,
  hasActiveFilters,
  onClearFilters,
  onCreate,
  onEdit,
  onDelete,
  onToggleActive,
}: PartnershipImportConfigsTableProps) {
  if (isLoading && configs.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500">
        Loading…
      </div>
    );
  }

  if (!isLoading && configs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/80 p-12 text-center">
        <p className="text-gray-700 font-medium mb-2">
          No partnership import configurations yet
        </p>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-orange-600 hover:underline text-sm"
          >
            Clear filters
          </button>
        ) : (
          <button
            type="button"
            onClick={onCreate}
            className="text-orange-600 hover:underline text-sm font-medium"
          >
            Create your first configuration
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-w-0 overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className="sticky top-0 z-10 bg-gray-50 px-4 py-3 font-semibold text-gray-900 shadow-[0_1px_0_0_rgb(229,231,235)]">
              Name
            </th>
            <th className="sticky top-0 z-10 bg-gray-50 px-4 py-3 font-semibold text-gray-900 shadow-[0_1px_0_0_rgb(229,231,235)]">
              Type
            </th>
            <th className="sticky top-0 z-10 bg-gray-50 px-4 py-3 font-semibold text-gray-900 shadow-[0_1px_0_0_rgb(229,231,235)]">
              Status
            </th>
            <th className="sticky top-0 z-10 bg-gray-50 px-4 py-3 text-right font-semibold text-gray-900 shadow-[0_1px_0_0_rgb(229,231,235)]">
              Actions
            </th>
          </tr>
        </thead>
          <tbody className="divide-y divide-gray-100">
            {configs.map((c) => (
              <tr key={c._id} className="hover:bg-orange-50/40">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {c.title}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${
                      c.kind === "discount"
                        ? "bg-violet-100 text-violet-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {c.kind === "discount"
                      ? "Discount"
                      : "Course enrollment"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onToggleActive(c)}
                    className={`text-xs font-medium px-2 py-1 rounded-md ${
                      c.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {c.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1 flex-wrap">
                    <Link
                      href={`/admin/settings/partnership-import/${c._id}`}
                      className="inline-flex items-center justify-center px-2 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
                      title="Emails & import"
                    >
                      <ListChecks className="w-4 h-4" />
                    </Link>
                    <WhiteButton
                      glow={false}
                      className="!px-2 !py-1.5"
                      title="Edit"
                      onClick={() => onEdit(c)}
                    >
                      <Pencil className="w-4 h-4" />
                    </WhiteButton>
                    <WhiteButton
                      glow={false}
                      className="!px-2 !py-1.5 text-red-600"
                      title="Delete"
                      onClick={() => c._id && onDelete(c._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </WhiteButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
    </div>
  );
}
