"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Image from "next/image";
import {
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  Loader2,
  Search,
  Tag as TagIcon,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import useCommunityReview, {
  COMMUNITY_REVIEW_TAGS,
  type CommunityReviewItem,
  type CommunityReviewStatus,
  type CommunityReviewTag,
  type CommunityReviewUser,
} from "@/hooks/useCommunityReview";

type StatusFilter = CommunityReviewStatus | "all";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "pending_approval", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

const STATUS_BADGE: Record<CommunityReviewStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  pending_approval: {
    label: "Pending",
    cls: "bg-yellow-100 text-yellow-700",
    icon: <Clock className="w-4 h-4" />,
  },
  approved: {
    label: "Approved",
    cls: "bg-green-100 text-green-700",
    icon: <CheckCircle className="w-4 h-4" />,
  },
  rejected: {
    label: "Rejected",
    cls: "bg-red-100 text-red-700",
    icon: <XCircle className="w-4 h-4" />,
  },
};

const AVATAR_PALETTE = [
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-red-500",
  "bg-teal-500",
];

const formatDate = (date?: string) =>
  date
    ? new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const isPopulatedUser = (
  u: CommunityReviewItem["userId"]
): u is CommunityReviewUser =>
  !!u && typeof u === "object" && ("firstName" in u || "email" in u);

const displayName = (user: CommunityReviewItem["userId"]) => {
  if (!user) return "Anonymous";
  if (!isPopulatedUser(user)) return "Unknown user";
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return full || user.email || "Unknown user";
};

const initials = (name: string) => {
  if (name.toLowerCase() === "anonymous") return "AN";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const avatarColor = (seed: string) => {
  const sum = seed.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length];
};

const CommunityModerationPage = () => {
  const { adminListReviews, adminApproveReview, adminRejectReview } =
    useCommunityReview();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    "pending_approval"
  );
  const [tagFilter, setTagFilter] = useState<CommunityReviewTag | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [reviews, setReviews] = useState<CommunityReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await adminListReviews({
        page: 1,
        limit: 100,
        status: statusFilter === "all" ? undefined : statusFilter,
        tag: tagFilter === "all" ? undefined : tagFilter,
        search: debouncedSearch || undefined,
      });
      setReviews(result.reviews);
      setTotal(result.total);
    } catch (err) {
      console.error("Failed to load community reviews:", err);
      toast.error("Failed to load community reviews");
    } finally {
      setIsLoading(false);
    }
  }, [adminListReviews, statusFilter, tagFilter, debouncedSearch]);

  // Headline pending count is fetched separately so it stays accurate while
  // the admin is browsing approved / rejected queues.
  const fetchPendingCount = useCallback(async () => {
    try {
      const result = await adminListReviews({
        page: 1,
        limit: 1,
        status: "pending_approval",
      });
      setPendingCount(result.total);
    } catch {
      // silent — non-critical UI hint
    }
  }, [adminListReviews]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await adminApproveReview(id);
      toast.success("Community review approved");
      await Promise.all([fetchReviews(), fetchPendingCount()]);
    } catch (err) {
      console.error("Failed to approve community review:", err);
      toast.error("Failed to approve community review");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await adminRejectReview(id);
      toast.success("Community review rejected");
      await Promise.all([fetchReviews(), fetchPendingCount()]);
    } catch (err) {
      console.error("Failed to reject community review:", err);
      toast.error("Failed to reject community review");
    } finally {
      setProcessingId(null);
    }
  };

  const tagOptions = useMemo(
    () => ["all", ...COMMUNITY_REVIEW_TAGS] as const,
    []
  );

  return (
    <div className="w-full min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Community Moderation
          </h1>
          <p className="text-gray-600 mt-1">
            Approve or reject student-submitted community stories before they
            appear in the public feed.
          </p>

          {pendingCount > 0 && (
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-600" />
              <p className="text-sm text-orange-800">
                <span className="font-semibold">{pendingCount}</span>{" "}
                {pendingCount === 1 ? "post" : "posts"} awaiting review
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Filters */}
          <div className="p-6 bg-gray-50 border-b border-gray-200 space-y-4">
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setStatusFilter(f.value)}
                  className={
                    statusFilter === f.value
                      ? "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200"
                      : "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-white text-gray-700 border border-gray-300 hover:border-orange-300 hover:bg-orange-50"
                  }
                >
                  <Filter className="w-4 h-4" />
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-3">
              {/* Tag */}
              <div className="relative">
                <TagIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={tagFilter}
                  onChange={(e) =>
                    setTagFilter(
                      e.target.value as CommunityReviewTag | "all"
                    )
                  }
                  className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white shadow-sm text-sm appearance-none"
                >
                  {tagOptions.map((t) => (
                    <option key={t} value={t}>
                      {t === "all" ? "All tags" : t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by title or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white shadow-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 min-h-[500px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                <p className="text-gray-600">Loading community posts...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-linear-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No community posts found
                </h3>
                <p className="text-gray-600">
                  {statusFilter === "pending_approval"
                    ? "The moderation queue is empty — nice work."
                    : "Try a different filter or search term."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => {
                  const user = r.userId;
                  const isAnonymous = !user;
                  const populated = isPopulatedUser(user) ? user : null;
                  const name = displayName(user);
                  const badge = STATUS_BADGE[r.status];
                  const avatarUrl = populated?.profilePicture;
                  const imgKey = r._id;

                  return (
                    <div
                      key={r._id}
                      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-orange-200 transition-all duration-200"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 shrink-0 ring-2 ring-gray-100">
                          {avatarUrl && !imageErrors[imgKey] ? (
                            <Image
                              src={avatarUrl}
                              alt={name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                              onError={() =>
                                setImageErrors((prev) => ({
                                  ...prev,
                                  [imgKey]: true,
                                }))
                              }
                            />
                          ) : (
                            <div
                              className={`w-full h-full flex items-center justify-center text-white font-semibold text-sm ${avatarColor(name)}`}
                            >
                              {initials(name)}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="font-semibold text-gray-900">
                                {name}
                              </span>
                              {isAnonymous && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                  Anonymous
                                </span>
                              )}
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">
                                {r.tag}
                              </span>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${badge.cls}`}
                            >
                              {badge.icon}
                              {badge.label}
                            </span>
                          </div>

                          <h3 className="font-semibold text-gray-900 text-lg mb-1">
                            {r.title}
                          </h3>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                            {r.review}
                          </p>

                          <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {formatDate(r.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                        {r.status !== "approved" && (
                          <button
                            type="button"
                            onClick={() => handleApprove(r._id)}
                            disabled={processingId === r._id}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md shadow-green-200"
                          >
                            {processingId === r._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Approve
                          </button>
                        )}
                        {r.status !== "rejected" && (
                          <button
                            type="button"
                            onClick={() => handleReject(r._id)}
                            disabled={processingId === r._id}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md shadow-red-200"
                          >
                            {processingId === r._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer count */}
          {!isLoading && reviews.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 text-sm text-gray-500 bg-gray-50">
              Showing {reviews.length} of {total}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityModerationPage;
