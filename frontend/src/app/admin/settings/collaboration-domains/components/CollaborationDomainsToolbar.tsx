import { Search, RefreshCw, Loader2 } from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";

interface CollaborationDomainsToolbarProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  filterActive: boolean | undefined;
  onFilterChange: (value: boolean | undefined) => void;
  total: number;
  isLoading: boolean;
  onRefresh: () => void;
  onAddDomain: () => void;
}

export default function CollaborationDomainsToolbar({
  searchInput,
  onSearchChange,
  filterActive,
  onFilterChange,
  total,
  isLoading,
  onRefresh,
  onAddDomain,
}: CollaborationDomainsToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex items-center gap-2">
          <Search className="absolute left-3 size-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search title or domain..."
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-[38px] min-w-[200px]"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-700">Status</label>
          <select
            value={
              filterActive === undefined
                ? ""
                : filterActive
                  ? "active"
                  : "inactive"
            }
            onChange={(e) => {
              const v = e.target.value;
              onFilterChange(
                v === "" ? undefined : v === "active" ? true : false
              );
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-[38px]"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <WhiteButton
          type="button"
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
        <OrangeButton
          type="button"
          onClick={onAddDomain}
          className="py-2 px-4 h-[38px] text-sm font-medium"
        >
          Add domain
        </OrangeButton>
      </div>
      <p className="text-sm text-gray-600">
        <span className="font-semibold text-gray-800">{total}</span> domain
        {total !== 1 ? "s" : ""} total
      </p>
    </div>
  );
}
