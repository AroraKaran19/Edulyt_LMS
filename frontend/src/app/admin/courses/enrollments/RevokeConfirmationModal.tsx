"use client";

import Modal from "@/components/ui/Modal";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { Trash2 } from "lucide-react";

interface EnrollmentUser {
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface EnrollmentCourse {
  title?: string;
}

interface EnrollmentItem {
  _id: string;
  type: "paid" | "gift" | "trial";
  userId: EnrollmentUser;
  courseId: EnrollmentCourse;
  planType?: string;
}

interface RevokeConfirmationModalProps {
  isOpen: boolean;
  enrollment: EnrollmentItem | null;
  onClose: () => void;
  onConfirm: (enrollment: { _id: string; type: "paid" | "gift" | "trial" }) => Promise<void>;
  isRevoking: boolean;
}

const RevokeConfirmationModal = ({
  isOpen,
  enrollment,
  onClose,
  onConfirm,
  isRevoking,
}: RevokeConfirmationModalProps) => {
  if (!enrollment) return null;

  const userName = [enrollment.userId?.firstName, enrollment.userId?.lastName]
    .filter(Boolean)
    .join(" ") || enrollment.userId?.email || "—";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Revoke Enrollment"
      className="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-gray-700">
          Are you sure you want to revoke this enrollment? The user will lose
          access to the course.
        </p>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <p className="text-sm font-medium text-gray-900">{userName}</p>
          <p className="text-sm text-gray-600">
            {enrollment.userId?.email}
          </p>
          <p className="text-sm font-medium text-gray-900 mt-2">
            {enrollment.courseId?.title ?? "—"}
          </p>
          <p className="text-xs text-gray-500 mt-1 capitalize">
            {enrollment.type} • {enrollment.planType ?? "Essential"} plan
          </p>
        </div>

        <p className="text-sm text-red-600 font-medium">
          This action will revoke the user&apos;s access to the course
          immediately.
        </p>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <WhiteButton
            onClick={onClose}
            disabled={isRevoking}
          >
            Cancel
          </WhiteButton>
          <WhiteButton
            onClick={() => onConfirm(enrollment)}
            disabled={isRevoking}
            className="text-red-600 border-red-300 hover:border-red-400 inline-flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isRevoking ? "Revoking..." : "Revoke Enrollment"}
          </WhiteButton>
        </div>
      </div>
    </Modal>
  );
};

export default RevokeConfirmationModal;
