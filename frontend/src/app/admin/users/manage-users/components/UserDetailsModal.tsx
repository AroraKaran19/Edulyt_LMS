"use client";

import { User } from "@/types/user";
import StudentDetailsModal from "./StudentDetailsModal";
import StaffUserDetailsModal from "./StaffUserDetailsModal";

interface UserDetailsModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onEdit: (user: User) => void;
  onChangePassword: (user: User) => void;
}

export default function UserDetailsModal({
  isOpen,
  user,
  onClose,
  onEdit,
  onChangePassword,
}: UserDetailsModalProps) {
  if (!user) return null;

  const isStudent = (user as any).userType === "student";

  return isStudent ? (
    <StudentDetailsModal
      isOpen={isOpen}
      user={user}
      onClose={onClose}
      onEdit={onEdit}
      onChangePassword={onChangePassword}
    />
  ) : (
    <StaffUserDetailsModal
      isOpen={isOpen}
      user={user}
      onClose={onClose}
      onEdit={onEdit}
      onChangePassword={onChangePassword}
    />
  );
}
