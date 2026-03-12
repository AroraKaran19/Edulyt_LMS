"use client";

import Modal from "@/components/ui/Modal";
import { User, BookOpen, CreditCard, Calendar } from "lucide-react";

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

interface Order {
  _id: string;
  userId: OrderUser;
  courseId: OrderCourse;
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

interface OrderDetailsModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  getStatusColor: (status: string) => string;
}

const OrderDetailsModal = ({
  isOpen,
  order,
  onClose,
  getStatusColor,
}: OrderDetailsModalProps) => {
  if (!order) return null;

  const getUserName = (user?: OrderUser) => {
    if (!user) return "—";
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return name || user.email || "—";
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const InfoRow = ({
    label,
    value,
    icon: Icon,
  }: {
    label: string;
    value: React.ReactNode;
    icon?: React.ElementType;
  }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      {Icon && (
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-gray-600" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {label}
        </p>
        <div className="text-sm font-medium text-gray-900 mt-0.5">{value}</div>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Order Details"
      className="max-w-lg"
    >
      <div className="space-y-2">
        <InfoRow
          label="Transaction ID"
          value={order.txnId}
          icon={CreditCard}
        />

        <InfoRow
          label="User"
          value={
            <div>
              <div>{getUserName(order.userId)}</div>
              {order.userId?.email && (
                <div className="text-gray-500 text-xs mt-0.5">
                  {order.userId.email}
                </div>
              )}
            </div>
          }
          icon={User}
        />

        <InfoRow
          label="Course"
          value={order.courseId?.title ?? "—"}
          icon={BookOpen}
        />

        <InfoRow
          label="Amount"
          value={
            <div>
              <span className="font-semibold">
                ₹{order.amount?.toLocaleString("en-IN") ?? 0}
              </span>
              {order.couponCode && (
                <div className="text-green-600 text-xs mt-1">
                  Coupon: {order.couponCode}{" "}
                  {order.couponDiscount
                    ? `(-₹${order.couponDiscount.toLocaleString("en-IN")})`
                    : ""}
                </div>
              )}
            </div>
          }
          icon={CreditCard}
        />

        <InfoRow label="Plan Type" value={order.planType?.toUpperCase() ?? "—"} />

        <InfoRow
          label="Payment Status"
          value={
            <div>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                  order.paymentStatus
                )}`}
              >
                {order.paymentStatus}
              </span>
              {order.paymentStatus === "failed" && order.paymentErrorReason && (
                <div className="text-red-600 text-xs mt-2">
                  Reason: {order.paymentErrorReason}
                </div>
              )}
            </div>
          }
        />

        {order.paymentMode && (
          <InfoRow label="Payment Mode" value={order.paymentMode} />
        )}

        {order.paymentMethod && (
          <InfoRow label="Payment Method" value={order.paymentMethod} />
        )}

        <InfoRow
          label="Created At"
          value={formatDate(order.createdAt)}
          icon={Calendar}
        />

        {order.updatedAt && (
          <InfoRow
            label="Updated At"
            value={formatDate(order.updatedAt)}
            icon={Calendar}
          />
        )}
      </div>
    </Modal>
  );
};

export default OrderDetailsModal;
