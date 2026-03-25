"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  ShoppingCart,
  User,
  BookOpen,
  Gift,
  Zap,
  Trash2,
} from "lucide-react";
import apiClient from "@/configs/apiConfig";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Input from "@/components/ui/inputs/Input";
import Select from "@/components/ui/inputs/Select";
import { toast } from "react-toastify";
import EnrollmentDetailsModal from "./EnrollmentDetailsModal";
import RevokeConfirmationModal from "./RevokeConfirmationModal";

interface EnrollmentUser {
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface EnrollmentCourse {
  title?: string;
  slug?: string;
  thumbnail?: string;
}

interface EnrollmentItem {
  _id: string;
  type: "paid" | "gift" | "trial";
  userId: EnrollmentUser;
  courseId: EnrollmentCourse;
  planType: string;
  status: string;
  date: string;
  trialExpiresAt?: string;
  giftFrom?: string;
}

const EnrollmentsPage = () => {
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [enrollmentType, setEnrollmentType] = useState<string>("paid");
  const [enrollmentStatus, setEnrollmentStatus] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] =
    useState<EnrollmentItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [enrollmentToRevoke, setEnrollmentToRevoke] =
    useState<EnrollmentItem | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const openEnrollmentDetails = (enrollment: EnrollmentItem) => {
    setSelectedEnrollment(enrollment);
    setIsModalOpen(true);
  };

  const closeEnrollmentDetails = () => {
    setIsModalOpen(false);
    setSelectedEnrollment(null);
  };

  const canRevoke = (item: EnrollmentItem) =>
    !["dropped", "revoked"].includes(item.status);

  const handleRevokeClick = (item: EnrollmentItem) => {
    setEnrollmentToRevoke(item);
  };

  const handleRevokeConfirm = async (
    enrollment?: Pick<EnrollmentItem, "_id">
  ) => {
    const target = enrollment ?? enrollmentToRevoke;
    if (!target?._id) {
      toast.error("Invalid enrollment data");
      return;
    }
    const body = { enrollmentId: target._id };
    setRevokingId(target._id);
    try {
      await apiClient.post("/admin/enrollments/revoke", body);
      toast.success("Enrollment revoked successfully");
      fetchEnrollments();
      setEnrollmentToRevoke(null);
      closeEnrollmentDetails();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "";
      if (msg.toLowerCase().includes("already revoked")) {
        toast.success("Enrollment is already revoked");
        fetchEnrollments();
        setEnrollmentToRevoke(null);
        closeEnrollmentDetails();
      } else {
        toast.error("Failed to revoke enrollment");
      }
    } finally {
      setRevokingId(null);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search]);

  const fetchEnrollments = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "10");
      params.append("enrollmentType", enrollmentType);
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (enrollmentStatus !== "all") {
        params.append("enrollmentStatus", enrollmentStatus);
      }

      const response = await apiClient.get(
        `/admin/enrollments?${params.toString()}`,
      );
      const data = response.data?.data;
      if (data) {
        setEnrollments(data.enrollments ?? []);
        setTotalPages(data.totalPages ?? 1);
        setTotal(data.total ?? 0);
      }
    } catch (error) {
      toast.error("Failed to fetch enrollments");
      setEnrollments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [page, debouncedSearch, enrollmentType, enrollmentStatus]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "paused":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "revoked":
      case "dropped":
        return "bg-gray-200 text-gray-700 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getUserName = (user?: EnrollmentUser) => {
    if (!user) return "—";
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return name || user.email || "—";
  };

  const renderTypeBadge = (item: EnrollmentItem) => {
    if (item.type === "paid") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
          Paid
        </span>
      );
    }
    if (item.type === "gift") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
          <Gift className="w-3 h-3" />
          Gift
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
        <Zap className="w-3 h-3" />
        Trial
      </span>
    );
  };

  const hasActiveFilters =
    debouncedSearch ||
    enrollmentType !== "all" ||
    enrollmentStatus !== "all";

  const showExpiryColumn =
    enrollmentType === "trial" || enrollmentType === "all";
  const colSpan = showExpiryColumn ? 8 : 7;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Enrollments
        </h1>
        <p className="text-gray-600 mt-1">
          All enrollments — paid, gift, and trial
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by user, course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="sm:w-48">
            <Select
              options={[
                { value: "all", label: "All Types" },
                { value: "paid", label: "Paid" },
                { value: "gift", label: "Gift" },
                { value: "trial", label: "Trial" },
              ]}
              value={enrollmentType}
              onChange={(val) => {
                setEnrollmentType(val);
                setPage(1);
              }}
              placeholder="Enrollment type"
            />
          </div>
          <div className="sm:w-48">
            <Select
              options={[
                { value: "all", label: "All (Active + Revoked)" },
                { value: "active", label: "Active only" },
                { value: "revoked", label: "Revoked only" },
              ]}
              value={enrollmentStatus}
              onChange={(val) => {
                setEnrollmentStatus(val);
                setPage(1);
              }}
              placeholder="Revoked filter"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap min-w-[140px]">
                  User
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap min-w-[180px]">
                  Course
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap min-w-[80px]">
                  Type
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                  Plan
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                  Status
                </th>
                {showExpiryColumn && (
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                    Expiry
                  </th>
                )}
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap min-w-[120px]">
                  Date
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
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
                      <p className="text-gray-500 text-sm">Loading...</p>
                    </div>
                  </td>
                </tr>
              ) : enrollments.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ShoppingCart className="w-12 h-12 text-gray-400" />
                      <p className="text-gray-500 font-medium">
                        No enrollments found
                      </p>
                      {hasActiveFilters ? (
                        <p className="text-gray-400 text-sm">
                          Try adjusting your filters
                        </p>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                enrollments.map((item) => (
                  <tr
                    key={`${item.type}-${item._id}`}
                    onClick={() => openEnrollmentDetails(item)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 sm:px-6 py-4 min-w-[140px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getUserName(item.userId)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.userId?.email ?? "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 min-w-[180px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="text-sm text-gray-900 truncate block min-w-0">
                          {item.courseId?.title ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm whitespace-nowrap min-w-[80px]">
                      {renderTypeBadge(item)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 capitalize whitespace-nowrap">
                      {item.planType ?? "—"}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border capitalize ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    {showExpiryColumn && (
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {item.type === "trial" && item.trialExpiresAt
                          ? formatDate(item.trialExpiresAt)
                          : "—"}
                      </td>
                    )}
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 whitespace-nowrap min-w-[120px]">
                      {formatDate(item.date)}
                    </td>
                    <td
                      className="px-4 sm:px-6 py-4 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {canRevoke(item) ? (
                        <WhiteButton
                          onClick={() => handleRevokeClick(item)}
                          disabled={!!revokingId}
                          className="whitespace-nowrap shrink-0 py-2 px-4 text-red-600 border-red-300 hover:border-red-400 inline-flex items-center"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Revoke
                        </WhiteButton>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <p className="text-sm text-gray-700">
              Showing page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <WhiteButton
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="py-2 px-4 text-sm"
              >
                Previous
              </WhiteButton>
              <WhiteButton
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="py-2 px-4 text-sm"
              >
                Next
              </WhiteButton>
            </div>
          </div>
        )}
      </div>

      <EnrollmentDetailsModal
        isOpen={isModalOpen}
        enrollment={selectedEnrollment}
        onClose={closeEnrollmentDetails}
        onRevokeClick={(e) => setEnrollmentToRevoke(e)}
        getStatusColor={getStatusColor}
      />

      <RevokeConfirmationModal
        isOpen={!!enrollmentToRevoke}
        enrollment={enrollmentToRevoke}
        onClose={() => setEnrollmentToRevoke(null)}
        onConfirm={handleRevokeConfirm}
        isRevoking={!!revokingId}
      />
    </div>
  );
};

export default EnrollmentsPage;
