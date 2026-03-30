import { RefreshCw, Loader2, Search } from "lucide-react";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import type { JobStatus } from "./types";

interface CollaborationJobsFiltersProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  statusFilter: JobStatus | "";
  onStatusChange: (value: JobStatus | "") => void;
  onRefresh: () => void;
  isLoading: boolean;
  total: number;
}

export function CollaborationJobsFilters({
  searchInput,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onRefresh,
  isLoading,
  total,
}: CollaborationJobsFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex items-center gap-2">
          <Search className="absolute left-3 size-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search job ID, user, domain..."
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-[38px] min-w-[220px]"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-700">Status</label>
          <select
            value={statusFilter}
            onChange={(e) =>
              onStatusChange(e.target.value as JobStatus | "")
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-[38px]"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <WhiteButton
          onClick={onRefresh}
          disabled={isLoading}
          className="gap-2 font-medium py-2 px-4 h-[38px] flex items-center"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          {isLoading ? "Refreshing…" : "Refresh"}
        </WhiteButton>
      </div>
      <p className="text-sm text-gray-600">
        <span className="font-semibold text-gray-800">{total}</span> job
        {total !== 1 ? "s" : ""} total
      </p>
    </div>
  );
}
