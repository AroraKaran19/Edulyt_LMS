"use client";

import Link from "next/link";
import Modal from "@/components/ui/Modal";
import { User, BookOpen, Calendar, Gift, Zap, Trash2, CreditCard } from "lucide-react";
import WhiteButton from "@/components/ui/buttons/WhiteButton";

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
  orderId?: string;
  txnId?: string;
}

interface EnrollmentDetailsModalProps {
  isOpen: boolean;
  enrollment: EnrollmentItem | null;
  onClose: () => void;
  onRevokeClick?: (enrollment: EnrollmentItem) => void;
  getStatusColor: (status: string) => string;
}

const EnrollmentDetailsModal = ({
  isOpen,
  enrollment,
  onClose,
  onRevokeClick,
  getStatusColor,
}: EnrollmentDetailsModalProps) => {
  if (!enrollment) return null;

  const canRevoke = !["dropped", "revoked"].includes(enrollment.status);

  const getUserName = (user?: EnrollmentUser) => {
    if (!user) return "—";
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return name || user.email || "—";
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
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

  const typeLabel =
    enrollment.type === "paid"
      ? "Paid"
      : enrollment.type === "gift"
        ? "Gift"
        : "Trial";
  const typeBg =
    enrollment.type === "paid"
      ? "bg-green-100 text-green-800 border-green-200"
      : enrollment.type === "gift"
        ? "bg-purple-100 text-purple-800 border-purple-200"
        : "bg-blue-100 text-blue-800 border-blue-200";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enrollment Details"
      className="max-w-lg"
    >
      <div className="space-y-2">
        <InfoRow
          label="Type"
          value={
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${typeBg}`}
            >
              {typeLabel}
            </span>
          }
        />

        <InfoRow
          label="User"
          value={
            <div>
              <div>{getUserName(enrollment.userId)}</div>
              {enrollment.userId?.email && (
                <div className="text-gray-500 text-xs mt-0.5">
                  {enrollment.userId.email}
                </div>
              )}
            </div>
          }
          icon={User}
        />

        <InfoRow
          label="Course"
          value={enrollment.courseId?.title ?? "—"}
          icon={BookOpen}
        />

        <InfoRow label="Plan Type" value={enrollment.planType?.toUpperCase() ?? "—"} />

        <InfoRow
          label="Enrollment Status"
          value={
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border capitalize ${getStatusColor(
                enrollment.status
              )}`}
            >
              {enrollment.status}
            </span>
          }
        />

        {enrollment.type === "gift" && enrollment.giftFrom && (
          <InfoRow
            label="Gifted By"
            value={
              <span className="text-sm">
                {typeof enrollment.giftFrom === "string" ? enrollment.giftFrom : "—"}
              </span>
            }
            icon={Gift}
          />
        )}

        {enrollment.type === "trial" && enrollment.trialExpiresAt && (
          <InfoRow
            label="Trial Expires"
            value={formatDate(enrollment.trialExpiresAt)}
            icon={Zap}
          />
        )}

        <InfoRow
          label="Enrolled At"
          value={formatDate(enrollment.date)}
          icon={Calendar}
        />

        {enrollment.type === "paid" && (enrollment.txnId || enrollment.orderId) && (
          <div className="pt-3 mt-3 border-t border-gray-100">
            <Link
              href={`/admin/orders?search=${encodeURIComponent(enrollment.txnId ?? enrollment.orderId ?? "")}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700"
              onClick={onClose}
            >
              <CreditCard className="w-4 h-4" />
              View in Orders →
            </Link>
          </div>
        )}

        {onRevokeClick && canRevoke && (
          <div className="pt-4 mt-4 border-t-2 border-red-200 bg-red-50 rounded-xl p-4 -mx-2">
            <WhiteButton
              onClick={() => onRevokeClick(enrollment)}
              className="w-full flex items-center justify-center font-semibold py-3 text-red-600 border-red-300 hover:border-red-400"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Force Revoke Enrollment
            </WhiteButton>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default EnrollmentDetailsModal;
