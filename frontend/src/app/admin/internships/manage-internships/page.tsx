"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useInternshipAdmin } from "@/hooks/useInternshipAdmin";
import type { InternshipResponse } from "@/types/internship";
import { toast } from "react-toastify";
import {
  Search,
  Plus,
  Eye,
  Edit3,
  Trash2,
  Calendar,
  Users,
  MoreVertical,
  Briefcase,
  Filter,
  ChevronDown,
} from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { InfiniteScrollSelect } from "@/components/ui/dropdown/InfiniteScrollSelect";

type AudienceFilter = "" | "college-students" | "professionals";

const STORAGE_KEY = "manage-internships-filters";

function readStoredFilters() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      audience:
        parsed.audience === "college-students" ||
        parsed.audience === "professionals"
          ? (parsed.audience as AudienceFilter)
          : "",
      status:
        parsed.status === "active" || parsed.status === "inactive"
          ? (parsed.status as string)
          : "",
      sortOrder: ["newest", "a-z", "z-a"].includes(parsed.sortOrder as string)
        ? (parsed.sortOrder as string)
        : "newest",
    };
  } catch {
    return null;
  }
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ManageInternshipsPage = () => {
  const router = useRouter();
  const { listAdmin, deleteInternship, updateMetadata } = useInternshipAdmin();

  const [internships, setInternships] = useState<InternshipResponse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [filterAudience, setFilterAudience] = useState<AudienceFilter>(() => {
    const stored = readStoredFilters();
    return stored?.audience ?? "";
  });
  const [filterStatus, setFilterStatus] = useState<string>(() => {
    const stored = readStoredFilters();
    return stored?.status ?? "";
  });
  const [sortOrder, setSortOrder] = useState<string>(() => {
    const stored = readStoredFilters();
    return stored?.sortOrder ?? "newest";
  });
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [internshipToDelete, setInternshipToDelete] =
    useState<InternshipResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const sortedInternships = useMemo(() => {
    const list = [...internships];
    if (sortOrder === "a-z") {
      list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortOrder === "z-a") {
      list.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
    }
    return list;
  }, [internships, sortOrder]);

  const loadInternships = useCallback(
    async (
      page: number = 1,
      search: string = "",
      append: boolean = false,
      filters?: {
        audience: AudienceFilter;
        status: string;
      },
    ) => {
      const audience = filters?.audience ?? filterAudience;
      const status = filters?.status ?? filterStatus;

      if (append) setIsLoadingMore(true);
      else setIsLoadingList(true);

      try {
        const response = await listAdmin({
          page,
          limit: 12,
          search: search || undefined,
          audience: audience || undefined,
          isActive:
            status === "active"
              ? true
              : status === "inactive"
                ? false
                : undefined,
        });

        if (response) {
          if (append) {
            setInternships((prev) => [...prev, ...response.internships]);
          } else {
            setInternships(response.internships);
          }
          setTotalPages(response.totalPages);
          setTotalCount(response.total);
          setCurrentPage(page);
          setHasMore(page < response.totalPages);
        } else {
          if (!append) {
            setInternships([]);
            toast.error("Failed to load internships");
          }
        }
      } catch (error) {
        console.error("Failed to load internships:", error);
        toast.error("Failed to load internships");
      } finally {
        setIsLoadingMore(false);
        setIsLoadingList(false);
      }
    },
    [listAdmin, filterAudience, filterStatus],
  );

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setHasMore(true);
    loadInternships(1, searchDebounced, false);
  }, [searchDebounced, filterAudience, filterStatus, loadInternships]);

  useEffect(() => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        audience: filterAudience,
        status: filterStatus,
        sortOrder,
      }),
    );
  }, [filterAudience, filterStatus, sortOrder]);

  const handleAudienceFilterChange = useCallback((value: string | string[]) => {
    const aud = (Array.isArray(value) ? value[0] : value) as AudienceFilter;
    setFilterAudience(aud);
  }, []);

  const handleStatusFilterChange = useCallback((value: string | string[]) => {
    const stat = Array.isArray(value) ? value[0] : value;
    setFilterStatus(stat);
  }, []);

  const handleSortOrderChange = useCallback((value: string | string[]) => {
    const sort = Array.isArray(value) ? value[0] : value;
    setSortOrder(sort);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoadingMore || isLoadingList) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry?.isIntersecting &&
          hasMore &&
          !isLoadingMore &&
          !isLoadingList
        ) {
          setIsLoadingMore(true);
          void loadInternships(currentPage + 1, searchDebounced, true);
        }
      },
      { root: null, rootMargin: "200px", threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    hasMore,
    isLoadingMore,
    isLoadingList,
    currentPage,
    searchDebounced,
    loadInternships,
  ]);

  const handleStatusToggle = async (id: string, currentStatus: boolean) => {
    if (!id) return;
    setIsUpdating(id);
    try {
      const updated = await updateMetadata(id, { isActive: !currentStatus });
      if (updated) {
        setInternships((prev) =>
          prev.map((row) =>
            row._id === id ? { ...row, isActive: !currentStatus } : row,
          ),
        );
        toast.success(
          `Internship ${!currentStatus ? "activated" : "deactivated"} successfully`,
        );
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleView = (slug: string) => {
    if (slug) {
      setOpenMenuId(null);
      window.open(`/internships/${slug}`, "_blank");
    }
  };

  const handleEdit = (id: string) => {
    if (id) {
      setOpenMenuId(null);
      router.push(`/admin/internships/manage-internships/edit/${id}`);
    }
  };

  const handleDelete = async () => {
    if (!internshipToDelete?._id) return;
    setIsDeleting(true);
    try {
      const ok = await deleteInternship(internshipToDelete._id);
      if (ok) {
        setInternships((prev) =>
          prev.filter((x) => x._id !== internshipToDelete._id),
        );
        setTotalCount((c) => Math.max(0, c - 1));
        toast.success("Internship deleted");
        setInternshipToDelete(null);
      } else {
        toast.error("Failed to delete internship");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete internship");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        openMenuId &&
        !(event.target as HTMLElement).closest(".internship-menu")
      ) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openMenuId]);

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (isActive: boolean) =>
    isActive
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-gray-100 text-gray-800 border-gray-200";

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Manage Internships
            </h1>
            <p className="text-gray-600 mt-1">
              {totalCount} {totalCount === 1 ? "internship" : "internships"}{" "}
              total
            </p>
          </div>
          <OrangeButton
            onClick={() =>
              router.push("/admin/internships/manage-internships/create")
            }
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Internship
          </OrangeButton>
        </div>

        <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-gray-700 mb-3">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <InfiniteScrollSelect
                label="Audience"
                placeholder="All audiences"
                value={filterAudience}
                onChange={handleAudienceFilterChange}
                multi={false}
                showSearch={false}
                fetchOptions={async () => ({
                  items: [
                    { value: "college-students", label: "College Students" },
                    { value: "professionals", label: "Professionals" },
                  ],
                  totalPages: 1,
                })}
                searchPlaceholder="Search audiences..."
                emptyMessage="No audiences found"
              />
            </div>
            <div>
              <InfiniteScrollSelect
                label="Status"
                placeholder="All statuses"
                value={filterStatus}
                onChange={handleStatusFilterChange}
                multi={false}
                showSearch={false}
                fetchOptions={async () => ({
                  items: [
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ],
                  totalPages: 1,
                })}
                searchPlaceholder="Search status..."
                emptyMessage="No status found"
              />
            </div>
            <div>
              <InfiniteScrollSelect
                label="Sort By"
                placeholder="Newest first"
                value={sortOrder}
                onChange={handleSortOrderChange}
                multi={false}
                showSearch={false}
                fetchOptions={async () => ({
                  items: [
                    { value: "newest", label: "Newest First" },
                    { value: "a-z", label: "A-Z" },
                    { value: "z-a", label: "Z-A" },
                  ],
                  totalPages: 1,
                })}
                searchPlaceholder="Search sort..."
                emptyMessage="No sort options found"
              />
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search internships…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {isLoadingList && internships.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {sortedInternships.map((internship) => (
              <div
                key={internship._id ?? internship.slug}
                className="bg-white rounded-xl flex flex-col border border-gray-200 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="relative h-48 bg-gray-100 shrink-0">
                  {internship.thumbnail ? (
                    <img
                      src={internship.thumbnail}
                      alt={internship.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Briefcase className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                    {internship.featured ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium border border-amber-200 bg-amber-50 text-amber-800">
                        Featured
                      </span>
                    ) : null}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        internship.isActive,
                      )}`}
                    >
                      {internship.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
                    {internship.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                    {stripHtml(internship.description || "")}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-4 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(internship.updatedAt ?? internship.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {internship.audience === "college-students"
                        ? "College"
                        : "Professionals"}
                    </div>
                    <span className="capitalize text-gray-600">
                      {internship.mode}
                    </span>
                    <span>
                      {internship.batches?.length ?? 0}{" "}
                      {(internship.batches?.length ?? 0) === 1
                        ? "batch"
                        : "batches"}
                    </span>
                  </div>

                  <div className="space-y-3 mt-auto">
                    <div className="flex items-center justify-end">
                      <div className="relative internship-menu">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(
                              openMenuId === internship._id
                                ? null
                                : (internship._id ?? null),
                            );
                          }}
                          className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 cursor-pointer"
                          title="More options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openMenuId === internship._id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleView(internship.slug || "")}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-gray-500" />
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEdit(internship._id || "")}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4 text-gray-500" />
                              Edit
                            </button>
                            <div className="border-t border-gray-200">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setInternshipToDelete(internship);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">
                          Status:
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            internship.isActive
                              ? "text-green-600"
                              : "text-gray-500"
                          }`}
                        >
                          {internship.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusToggle(
                            internship._id || "",
                            internship.isActive,
                          )
                        }
                        disabled={isUpdating === internship._id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                          internship.isActive ? "bg-green-600" : "bg-gray-300"
                        } ${
                          isUpdating === internship._id
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                        title={internship.isActive ? "Deactivate" : "Activate"}
                      >
                        {isUpdating === internship._id ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                          </div>
                        ) : (
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              internship.isActive
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {internships.length === 0 && !isLoadingList && (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No internships found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchDebounced
                  ? "Try adjusting your search or filters"
                  : "Create your first internship to get started"}
              </p>
              {!searchDebounced && (
                <OrangeButton
                  glow={false}
                  onClick={() =>
                    router.push("/admin/internships/manage-internships/create")
                  }
                >
                  <Plus className="w-5 h-5" />
                  Create Internship
                </OrangeButton>
              )}
            </div>
          )}

          {hasMore && internships.length > 0 && (
            <div ref={sentinelRef} className="h-1 w-full" aria-hidden />
          )}

          {isLoadingMore && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-gray-500">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-orange-600 rounded-full animate-spin" />
                Loading more…
              </div>
            </div>
          )}

          {!hasMore && internships.length > 0 && (
            <div className="text-center py-6 text-gray-500 text-sm">
              No more internships to load
            </div>
          )}
        </>
      )}

      {internshipToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete internship
                </h3>
                <p className="text-sm text-gray-600">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Delete <strong>&quot;{internshipToDelete.title}&quot;</strong>?
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setInternshipToDelete(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageInternshipsPage;
