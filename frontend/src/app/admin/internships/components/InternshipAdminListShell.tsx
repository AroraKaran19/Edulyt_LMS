"use client";

import type { ReactNode } from "react";
import { Search } from "lucide-react";
import Input from "@/components/ui/inputs/Input";

type Props = {
  title: string;
  subtitle: string;
  /** e.g. OrangeButton “Create …” */
  headerActions?: ReactNode;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  /** Extra controls in the filter row (e.g. Select), after search */
  filterExtras?: ReactNode;
  /** Table + pagination, inside the lower white card */
  children: ReactNode;
};

/** Shared admin list chrome aligned with the courses enrollments page layout. */
export default function InternshipAdminListShell({
  title,
  subtitle,
  headerActions,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filterExtras,
  children,
}: Props) {
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {title}
          </h1>
          <p className="text-gray-600 mt-1">{subtitle}</p>
        </div>
        {headerActions ? (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {headerActions}
          </div>
        ) : null}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          {filterExtras}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
