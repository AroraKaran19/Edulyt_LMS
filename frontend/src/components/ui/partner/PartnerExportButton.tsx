"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import type { ExcelRow } from "@/lib/exportToExcel";

interface PartnerExportButtonProps {
  /**
   * Produces the rows to export. May be async so callers can fetch every
   * page of a server-paginated list before building the sheet.
   */
  getRows: () => Promise<ExcelRow[]> | ExcelRow[];
  /** File name without extension (".xlsx" is appended). */
  fileName: string;
  sheetName?: string;
  disabled?: boolean;
  label?: string;
  className?: string;
}

/**
 * "Export to Excel" button for the partner portal. Downloads the rows from
 * `getRows` as an .xlsx file. The SheetJS bundle is loaded lazily on first
 * click so it never weighs on the initial page load.
 */
export default function PartnerExportButton({
  getRows,
  fileName,
  sheetName,
  disabled = false,
  label = "Export to Excel",
  className,
}: PartnerExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const rows = await getRows();
      if (!rows.length) {
        toast.info("Nothing to export.");
        return;
      }
      const { exportRowsToExcel } = await import("@/lib/exportToExcel");
      exportRowsToExcel(rows, { fileName, sheetName });
    } catch (e) {
      console.error("Excel export failed:", e);
      toast.error("Could not export to Excel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#F77124] bg-white px-3 py-2 text-sm font-semibold text-[#F77124] transition-colors hover:bg-[#FFF4EB] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <Download className="size-4" />
      {loading ? "Exporting…" : label}
    </button>
  );
}
