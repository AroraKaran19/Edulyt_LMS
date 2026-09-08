"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GraduationCap, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import Select from "@/components/ui/inputs/Select";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import Pagination from "@/components/admin/Pagination";
// Generic list chrome despite living under internships/: same header, filter row,
// and table card every admin list page uses. Reused rather than duplicated.
import InternshipAdminListShell from "../../internships/components/InternshipAdminListShell";
import useAuth from "@/hooks/useAuth";
import StatusPill from "./components/StatusPill";
import CopyCampaignLink from "./components/CopyCampaignLink";
import ScholarshipTestUpsertModal from "./components/ScholarshipTestUpsertModal";
import ScholarshipTestDetailModal from "./components/ScholarshipTestDetailModal";
import DeleteScholarshipTestConfirmModal from "./components/DeleteScholarshipTestConfirmModal";
import {
  campaignStatusOf,
  type ScholarshipTestListRow,
} from "@/types/scholarship";

const PAGE_LIMIT = 20;
/** Fixed columns; the Created by column is conditional, see `colSpan` below. */
const BASE_COL_SPAN = 7;

function formatIst(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

const errorMessage = (error: unknown, fallback: string): string => {
  const e = error as {
    response?: { data?: { error?: { message?: string }; message?: string } };
  };
  return (
    e?.response?.data?.error?.message || e?.response?.data?.message || fallback
  );
};

export default function ScholarshipCampaignsAdminPage() {
  const { user } = useAuth();
  /**
   * Marketers and sales only ever get their own campaigns from the server, so
   * an owner filter would be a no-op implying otherwise, and a Created by
   * column would repeat their own name on every row.
   */
  const canSeeOthers =
    user?.userType !== "marketer" && user?.userType !== "sales";
  const colSpan = canSeeOthers ? BASE_COL_SPAN + 1 : BASE_COL_SPAN;

  const [rows, setRows] = useState<ScholarshipTestListRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mineOnly, setMineOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search]);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: PAGE_LIMIT,
      };
      if (statusFilter !== "all") params.status = statusFilter;
      if (debouncedSearch) params.search = debouncedSearch;
      if (mineOnly) params.mine = "true";

      const res = await apiClient.get(ENDPOINTS.scholarshipTests.adminList, {
        params,
      });
      const d = res.data?.data as {
        items?: ScholarshipTestListRow[];
        total?: number;
      };
      setRows(Array.isArray(d?.items) ? d.items : []);
      setTotal(d?.total ?? 0);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to load campaigns"));
      setRows([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, debouncedSearch, mineOnly]);

  useEffect(() => {
    void fetchCampaigns();
  }, [fetchCampaigns]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  const hasActiveFilters =
    Boolean(debouncedSearch) || statusFilter !== "all" || mineOnly;

  const upsertOpen = createOpen || !!editId;

  return (
    <>
      <InternshipAdminListShell
        title="Scholarship campaigns"
        subtitle="Short tests that reward anyone who finishes with a discount code, usable once per person on any course."
        searchPlaceholder="Search by campaign name…"
        searchValue={search}
        onSearchChange={setSearch}
        headerActions={
          <OrangeButton
            type="button"
            glow={false}
            className="inline-flex items-center gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" />
            New campaign
          </OrangeButton>
        }
        filterExtras={
          <div className="sm:w-48">
            <Select
              options={[
                { value: "all", label: "All statuses" },
                { value: "live", label: "Live" },
                { value: "paused", label: "Paused" },
              ]}
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
              placeholder="Status"
            />
          </div>
        }
        filterRow2={
          canSeeOthers ? (
            <CheckBoxContainer
              label="Only campaigns I created"
              checked={mineOnly}
              onChange={(v) => {
                setMineOnly(v);
                setPage(1);
              }}
            />
          ) : undefined
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 min-w-[200px]">
                  Campaign
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
                  Status
                </th>
                {canSeeOthers ? (
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
                    Created by
                  </th>
                ) : null}
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
                  Created (IST)
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
                  Discount
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
                  Questions
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
                  Attempts
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={colSpan} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                      <p className="text-gray-500 text-sm">Loading…</p>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <GraduationCap className="w-12 h-12 text-gray-400" />
                      {/* Two distinct empty states: "nothing exists" and "your
                          filters matched nothing" are different problems. */}
                      {hasActiveFilters ? (
                        <>
                          <p className="text-gray-500 font-medium">
                            No campaigns match these filters
                          </p>
                          <p className="text-gray-400 text-sm">
                            Try a different status or clear the search
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-500 font-medium">
                            No campaigns yet
                          </p>
                          <p className="text-gray-400 text-sm">
                            Create one to start collecting leads
                          </p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const status = campaignStatusOf(row);
                  return (
                    <tr
                      key={row._id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setDetailId(row._id)}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === " ") {
                          ev.preventDefault();
                          setDetailId(row._id);
                        }
                      }}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 sm:px-6 py-4 text-sm max-w-xs">
                        <span className="line-clamp-2 font-medium text-gray-900">
                          {row.title || "—"}
                        </span>
                        <span className="block text-xs text-gray-400 truncate mt-0.5">
                          /scholarship/{row.slug}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <StatusPill status={status} />
                      </td>
                      {canSeeOthers ? (
                        <td className="px-4 sm:px-6 py-4 text-xs whitespace-nowrap">
                          {row.createdByName ? (
                            <span className="text-gray-700">
                              {row.createdByName}
                            </span>
                          ) : (
                            // Campaigns made before the name was snapshotted.
                            <span className="text-gray-400">Unknown</span>
                          )}
                        </td>
                      ) : null}
                      <td className="px-4 sm:px-6 py-4 text-xs text-gray-600 whitespace-nowrap">
                        {formatIst(row.createdAt)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 tabular-nums whitespace-nowrap">
                        {row.minDiscountPercent === row.maxDiscountPercent
                          ? `${row.minDiscountPercent}%`
                          : `${row.minDiscountPercent}-${row.maxDiscountPercent}%`}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 tabular-nums whitespace-nowrap">
                        {row.questions?.length ?? 0}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 tabular-nums whitespace-nowrap">
                        {row.attemptsAllowed}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {/* Copy sits first: sharing the link is the action a
                              marketer performs constantly, editing is rare. */}
                          <CopyCampaignLink slug={row.slug} />
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setEditId(row._id);
                            }}
                            className="p-2 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors"
                            aria-label="Edit campaign"
                            title="Edit"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setDeleteTarget({
                                id: row._id,
                                title: row.title,
                              });
                            }}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            aria-label="Delete campaign"
                            title="Delete"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 sm:px-6">
            <p className="text-sm text-gray-700">{total} total</p>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              disabled={isLoading}
            />
          </div>
        )}
      </InternshipAdminListShell>

      <ScholarshipTestUpsertModal
        isOpen={upsertOpen}
        mode={editId ? "edit" : "create"}
        testId={editId}
        onClose={() => {
          setCreateOpen(false);
          setEditId(null);
        }}
        onSuccess={() => void fetchCampaigns()}
      />

      <ScholarshipTestDetailModal
        isOpen={!!detailId}
        testId={detailId}
        onClose={() => setDetailId(null)}
        onEdit={(id) => {
          setDetailId(null);
          setEditId(id);
        }}
      />

      <DeleteScholarshipTestConfirmModal
        isOpen={!!deleteTarget}
        testId={deleteTarget?.id ?? null}
        title={deleteTarget?.title ?? ""}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => void fetchCampaigns()}
      />
    </>
  );
}
