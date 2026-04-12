"use client";

import { Search, RefreshCw } from "lucide-react";
import Input from "@/components/ui/inputs/Input";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import Select from "@/components/ui/inputs/Select";

interface PartnershipImportConfigsToolbarProps {
  searchInput: string;
  onSearchChange: (v: string) => void;
  filterActive: boolean | undefined;
  onFilterChange: (v: boolean | undefined) => void;
  total: number;
  isLoading: boolean;
  onRefresh: () => void;
  onCreate: () => void;
}

export default function PartnershipImportConfigsToolbar({
  searchInput,
  onSearchChange,
  filterActive,
  onFilterChange,
  total,
  isLoading,
  onRefresh,
  onCreate,
}: PartnershipImportConfigsToolbarProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-3 lg:items-end lg:justify-between">
      <div className="flex flex-col sm:flex-row gap-3 flex-1">
        <div className="flex-1 min-w-[200px]">
          <Input
            type="text"
            placeholder="Search by name..."
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            icon={<Search className="w-5 h-5 text-gray-400" />}
            className="w-full"
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            options={[
              { value: "all", label: "All statuses" },
              { value: "true", label: "Active only" },
              { value: "false", label: "Inactive only" },
            ]}
            value={
              filterActive === undefined
                ? "all"
                : filterActive
                  ? "true"
                  : "false"
            }
            onChange={(v) => {
              if (v === "all") onFilterChange(undefined);
              else onFilterChange(v === "true");
            }}
            placeholder="Status"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{total}</span>{" "}
          configuration{total !== 1 ? "s" : ""}
        </span>
        <WhiteButton
          glow={false}
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh"
        >
          <RefreshCw
            className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
          />
        </WhiteButton>
        <OrangeButton glow={false} onClick={onCreate}>
          New configuration
        </OrangeButton>
      </div>
    </div>
  );
}
