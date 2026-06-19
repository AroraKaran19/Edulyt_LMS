"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Search, CreditCard, User, BookOpen, Briefcase, Coins } from "lucide-react";
import apiClient from "@/configs/apiConfig";
import OrderDetailsModal from "./OrderDetailsModal";
import {
  getAdminOrderProductLabel,
  getAdminOrderTypeLabel,
} from "./orderDisplay";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Input from "@/components/ui/inputs/Input";
import Select from "@/components/ui/inputs/Select";
import { toast } from "react-toastify";
import OrangeButton from "@/components/ui/buttons/OrangeButton";

interface OrderUser {
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface OrderCourse {
  title?: string;
  slug?: string;
  thumbnail?: string;
}

interface OrderItem {
  _id: string;
  userId: OrderUser | null;
  courseId: OrderCourse | null;
  courseName?: string;
  userName?: string;
  orderKind?: "course" | "internship_seat" | "internship_success_points";
  internshipTitle?: string;
  internshipSuccessPointsQuantity?: number;
  batchId?: string;
  txnId: string;
  amount: number;
  currency: string;
  planType: string;
  paymentMode?: string;
  paymentMethod?: string;
  paymentStatus: string;
  paymentErrorReason?: string;
  couponCode?: string;
  couponDiscount?: number;
  createdAt: string;
  updatedAt?: string;
}

const OrdersPage = () => {
  const searchParams = useSearchParams();
  const searchFromUrl = searchParams.get("search") ?? "";
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(searchFromUrl);
  const [debouncedSearch, setDebouncedSearch] = useState(searchFromUrl);
  const [paymentStatus, setPaymentStatus] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync search from URL when coming from enrollment modal link
  useEffect(() => {
    if (searchFromUrl && search !== searchFromUrl) {
      setSearch(searchFromUrl);
      setDebouncedSearch(searchFromUrl);
      setPage(1);
    }
  }, [searchFromUrl]);

  const openOrderDetails = (order: OrderItem) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeOrderDetails = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
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

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "10");
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (paymentStatus !== "all") {
        params.append("paymentStatus", paymentStatus);
      }

      const response = await apiClient.get(
        `/admin/orders?${params.toString()}`,
      );
      const data = response.data?.data;
      if (data) {
        setOrders(data.orders ?? []);
        setTotalPages(data.totalPages ?? 1);
        setTotal(data.total ?? 0);
      }
    } catch (error) {
      toast.error("Failed to fetch orders");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, debouncedSearch, paymentStatus]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getUserName = (item: OrderItem) => {
    if (item.userId) {
      const name = [item.userId.firstName, item.userId.lastName]
        .filter(Boolean)
        .join(" ");
      if (name || item.userId.email) return name || item.userId.email || "—";
    }
    return item.userName || "—";
  };

  const hasActiveFilters = debouncedSearch || paymentStatus !== "all";

  const productIconWrap =
    "w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0";
  const productIconClass = "w-4 h-4 text-gray-500";

  const renderProductIcon = (kind?: OrderItem["orderKind"]) => {
    const k = kind ?? "course";
    if (k === "internship_seat") {
      return (
        <div className={productIconWrap}>
          <Briefcase className={productIconClass} aria-hidden />
        </div>
      );
    }
    if (k === "internship_success_points") {
      return (
        <div className={productIconWrap}>
          <Coins className={productIconClass} aria-hidden />
        </div>
      );
    }
    return (
      <div className={productIconWrap}>
        <BookOpen className={productIconClass} aria-hidden />
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-1">
          Course, internship seat, and success-point checkouts — success,
          pending, and failed
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by user, product, txn ID, coupon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="sm:w-48">
            <Select
              options={[
                { value: "all", label: "All Status" },
                { value: "success", label: "Success" },
                { value: "pending", label: "Pending" },
                { value: "failed", label: "Failed" },
              ]}
              value={paymentStatus}
              onChange={(val) => {
                setPaymentStatus(val);
                setPage(1);
              }}
              placeholder="Payment status"
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
                  Product
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap min-w-[100px]">
                  Amount
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                  Plan
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                  Payment Status
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap min-w-[120px]">
                  Date
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                  Txn ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                      <p className="text-gray-500 text-sm">Loading...</p>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <CreditCard className="w-12 h-12 text-gray-400" />
                      <p className="text-gray-500 font-medium">
                        No orders found
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
                orders.map((item) => (
                  <tr
                    key={item._id}
                    onClick={() => openOrderDetails(item)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 sm:px-6 py-4 min-w-[140px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getUserName(item)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.userId?.email ?? "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 min-w-[180px]">
                      <div className="flex items-center gap-2 min-w-0">
                        {renderProductIcon(item.orderKind)}
                        <div className="min-w-0">
                          <span className="text-sm text-gray-900 truncate block">
                            {getAdminOrderProductLabel(item)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {getAdminOrderTypeLabel(item.orderKind)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm whitespace-nowrap min-w-[100px]">
                      <span className="font-medium">
                        ₹{item.amount?.toLocaleString("en-IN") ?? 0}
                      </span>
                      {item.couponDiscount ? (
                        <span className="text-green-600 text-xs ml-1">
                          (-₹{item.couponDiscount.toLocaleString("en-IN")})
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 capitalize whitespace-nowrap">
                      {item.planType ?? "—"}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border capitalize ${getStatusColor(
                          item.paymentStatus,
                        )}`}
                      >
                        {item.paymentStatus}
                      </span>
                      {item.paymentStatus === "failed" &&
                        item.paymentErrorReason && (
                          <div
                            className="text-red-600 text-xs mt-1 truncate max-w-[160px]"
                            title={item.paymentErrorReason}
                          >
                            {item.paymentErrorReason}
                          </div>
                        )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 whitespace-nowrap min-w-[120px]">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 font-mono text-xs">
                      {item.txnId ?? "—"}
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
                glow={false}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </WhiteButton>
              <OrangeButton
                glow={false}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </OrangeButton>
            </div>
          </div>
        )}
      </div>

      <OrderDetailsModal
        isOpen={isModalOpen}
        order={selectedOrder}
        onClose={closeOrderDetails}
        getStatusColor={getStatusColor}
      />
    </div>
  );
};

export default OrdersPage;
