"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Tag,
  Pause,
  Play,
  Calendar,
  TrendingUp,
  Package,
  Clock,
  Sparkles,
} from "lucide-react";
import { useCoupon } from "@/hooks/useCoupon";
import { Coupon } from "@/types/coupon";
import CouponModal from "@/components/ui/modals/CouponModal";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { toast } from "react-toastify";

const CouponsPage = () => {
  const { getCoupons, updateCoupon, deleteCoupon, isLoading } = useCoupon();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCoupons, setTotalCoupons] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(
    undefined,
  );
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInput]);

  // Load coupons
  const loadCoupons = async () => {
    const result = await getCoupons({
      page,
      limit: 10,
      search: debouncedSearch,
      isActive: filterActive,
    });

    if (result) {
      setCoupons(result.coupons);
      setTotalPages(result.totalPages);
      setTotalCoupons(result.total);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, [page, debouncedSearch, filterActive]);

  const handleCreate = () => {
    setModalMode("create");
    setEditingCoupon(null);
    setIsModalOpen(true);
  };

  const handleEdit = (coupon: Coupon) => {
    setModalMode("edit");
    setEditingCoupon(coupon);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (coupon: Coupon) => {
    const newStatus = !coupon.isActive;
    const action = newStatus ? "activate" : "pause";

    if (!confirm(`Are you sure you want to ${action} this coupon?`)) {
      return;
    }

    const result = await updateCoupon(coupon._id!, { isActive: newStatus });
    if (result) {
      toast.success(`Coupon ${action}d successfully!`);
      loadCoupons();
    }
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) {
      return;
    }

    const result = await deleteCoupon(couponId);
    if (result) {
      toast.success("Coupon deleted successfully!");
      loadCoupons();
    }
  };

  const handleModalSuccess = () => {
    loadCoupons();
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDiscountDisplay = (coupon: Coupon) => {
    if (coupon.discountType === "percentage") {
      return `${coupon.discountValue}% OFF`;
    }
    return `₹${coupon.discountValue} OFF`;
  };

  const isExpired = (validUntil: Date | string) => {
    return new Date(validUntil) < new Date();
  };

  // Calculate stats
  const activeCoupons = coupons.filter(
    (c) => c.isActive && !isExpired(c.validUntil),
  ).length;
  const expiredCoupons = coupons.filter((c) => isExpired(c.validUntil)).length;

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-gray-50 via-orange-50/20 to-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                    Coupon Management
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Create and manage discount coupons for your courses
                  </p>
                </div>
              </div>
            </div>
            <OrangeButton
              onClick={handleCreate}
              className="flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
              glow={true}
            >
              <Plus className="w-5 h-5" />
              Create Coupon
            </OrangeButton>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Total Coupons
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {totalCoupons}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Active</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {activeCoupons}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Sparkles className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Expired</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {expiredCoupons}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Total Usage
                  </p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {coupons.reduce((acc, c) => acc + (c.usageCount || 0), 0)}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Search Coupons
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by code or description..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                  {searchInput && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full lg:w-48">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  value={
                    filterActive === undefined
                      ? "all"
                      : filterActive
                        ? "active"
                        : "inactive"
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilterActive(
                      value === "all"
                        ? undefined
                        : value === "active"
                          ? true
                          : false,
                    );
                    setPage(1);
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white"
                >
                  <option value="all">All Coupons</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Paused Only</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Coupons List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Loading coupons...</p>
            </div>
          ) : coupons.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
              <div className="w-20 h-20 bg-linear-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No coupons found
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchInput
                  ? "Try adjusting your search criteria or filters"
                  : "Get started by creating your first discount coupon"}
              </p>
              {!searchInput && (
                <OrangeButton
                  onClick={handleCreate}
                  className="flex items-center gap-2 mx-auto shadow-lg"
                  glow={true}
                >
                  <Plus className="w-5 h-5" />
                  Create First Coupon
                </OrangeButton>
              )}
            </div>
          ) : (
            coupons.map((coupon) => (
              <div
                key={coupon._id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-orange-200 transition-all group"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Header with badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <div className="px-4 py-2 bg-linear-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                        <span className="text-orange-800 font-mono font-bold text-lg">
                          {coupon.code}
                        </span>
                      </div>
                      <div className="px-3 py-1.5 bg-linear-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                        <span className="text-green-800 text-sm font-bold">
                          {getDiscountDisplay(coupon)}
                        </span>
                      </div>
                      {isExpired(coupon.validUntil) ? (
                        <span className="px-3 py-1.5 bg-red-100 text-red-700 text-sm font-semibold rounded-lg border border-red-200 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Expired
                        </span>
                      ) : coupon.isActive ? (
                        <span className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-semibold rounded-lg border border-green-200 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 text-sm font-semibold rounded-lg border border-yellow-200 flex items-center gap-1">
                          <Pause className="w-3.5 h-3.5" />
                          Paused
                        </span>
                      )}
                    </div>

                    {coupon.description && (
                      <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                        {coupon.description}
                      </p>
                    )}

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="w-4 h-4 text-gray-500" />
                          <span className="text-xs text-gray-600 font-medium">
                            Applies To
                          </span>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm capitalize">
                          {coupon.applicableType.replace("-", " ")}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-xs text-gray-600 font-medium">
                            Valid Period
                          </span>
                        </div>
                        <p className="font-semibold text-gray-900 text-xs">
                          {formatDate(coupon.validFrom)} -{" "}
                          {formatDate(coupon.validUntil)}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-gray-500" />
                          <span className="text-xs text-gray-600 font-medium">
                            Usage
                          </span>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {coupon.usageCount || 0}
                          {coupon.usageLimit
                            ? ` / ${coupon.usageLimit}`
                            : " / ∞"}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Tag className="w-4 h-4 text-gray-500" />
                          <span className="text-xs text-gray-600 font-medium">
                            Min Purchase
                          </span>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm">
                          ₹{coupon.minPurchaseAmount || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex lg:flex-col gap-2 lg:ml-4">
                    <button
                      onClick={() => handleToggleActive(coupon)}
                      disabled={isExpired(coupon.validUntil)}
                      className={`p-3 rounded-lg transition-all cursor-pointer font-medium text-sm flex items-center justify-center gap-2 ${
                        isExpired(coupon.validUntil)
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : coupon.isActive
                            ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200"
                            : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                      }`}
                      title={
                        isExpired(coupon.validUntil)
                          ? "Cannot modify expired coupon"
                          : coupon.isActive
                            ? "Pause Coupon"
                            : "Activate Coupon"
                      }
                    >
                      {coupon.isActive ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span className="hidden sm:inline">Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span className="hidden sm:inline">Activate</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(coupon)}
                      className="p-3 rounded-lg transition-all cursor-pointer bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 font-medium text-sm flex items-center justify-center gap-2"
                      title="Edit Coupon"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(coupon._id!)}
                      className="p-3 rounded-lg transition-all cursor-pointer bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 font-medium text-sm flex items-center justify-center gap-2"
                      title="Delete Coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                Showing page{" "}
                <span className="font-semibold text-gray-900">{page}</span> of{" "}
                <span className="font-semibold text-gray-900">
                  {totalPages}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <WhiteButton
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  glow={false}
                >
                  Previous
                </WhiteButton>

                {/* Page Numbers */}
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <WhiteButton
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        glow={false}
                      >
                        {pageNum}
                      </WhiteButton>
                    );
                  })}
                </div>

                <OrangeButton
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  glow={false}
                >
                  Next
                </OrangeButton>
              </div>
            </div>
          </div>
        )}

        {/* Coupon Modal */}
        <CouponModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCoupon(null);
          }}
          onSuccess={handleModalSuccess}
          editingCoupon={editingCoupon}
          mode={modalMode}
        />
      </div>
    </div>
  );
};

export default CouponsPage;
