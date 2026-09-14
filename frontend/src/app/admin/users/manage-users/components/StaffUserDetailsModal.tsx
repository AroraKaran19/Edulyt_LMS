"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Edit,
  Key,
  User as UserIcon,
  Building2,
  Mail,
  Phone,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import useUserManagement from "@/hooks/useUserManagement";
import { User } from "@/types/user";
import { cn } from "@/lib/utils";
import BrandMark from "@/components/admin/BrandMark";
import { isBrand } from "@/constants/brands";
import {
  getUserTypeBadgeColor,
  getStatusBadgeColor,
  formatUserTypeLabel,
  InfoRow,
  ProfileSection,
  AccountSection,
} from "./UserDetailsModalShared";

type TabId = "overview" | "profile" | "account";

interface StaffUserDetailsModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onEdit: (user: User) => void;
  onChangePassword: (user: User) => void;
}

const STAFF_TAB_ITEMS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: UserIcon },
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "account", label: "Account", icon: Building2 },
];

export default function StaffUserDetailsModal({
  isOpen,
  user,
  onClose,
  onEdit,
  onChangePassword,
}: StaffUserDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [fullUserData, setFullUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const { getUserById } = useUserManagement();
  const displayUser = fullUserData || user;
  const brands = (displayUser?.brands ?? []).filter(isBrand);

  useEffect(() => {
    if (!isOpen || !user?._id) return;

    setLoading(true);
    getUserById(user._id)
      .then((data) => {
        if (data) setFullUserData(data);
      })
      .catch((err) => console.error("Error fetching user:", err))
      .finally(() => setLoading(false));
  }, [isOpen, user?._id, getUserById]);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab("overview");
      setFullUserData(null);
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-4">
            <Image
              src={
                displayUser?.profilePicture ||
                (user as any).profilePicture ||
                "/user.svg"
              }
              alt=""
              className="h-16 w-16 rounded-full object-cover border-2 border-white shadow"
              width={64}
              height={64}
            />
            <div>
              {brands.length > 0 && (
                <div className="mb-1.5 flex items-center gap-2">
                  {brands.map((b) => (
                    <BrandMark key={b} brand={b} />
                  ))}
                </div>
              )}
              <h2 className="text-xl font-bold text-gray-900">
                {displayUser?.firstName || (user as any).firstName || "Unknown"}{" "}
                {displayUser?.lastName || (user as any).lastName || "User"}
              </h2>
              <p className="text-sm text-gray-500">
                {displayUser?.email || (user as any).email}
              </p>
              <div className="flex gap-2 mt-1">
                <span
                  className={cn(
                    "inline-flex px-2 py-0.5 text-xs font-semibold rounded-full",
                    getUserTypeBadgeColor((user as any).userType)
                  )}
                >
                  {formatUserTypeLabel((user as any).userType)}
                </span>
                <span
                  className={cn(
                    "inline-flex px-2 py-0.5 text-xs font-semibold rounded-full",
                    getStatusBadgeColor((user as any).status)
                  )}
                >
                  {(user as any).status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(user);
              }}
              className="cursor-pointer"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onChangePassword(user);
              }}
              className="cursor-pointer"
            >
              <Key className="w-4 h-4 mr-2" />
              Change Password
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="cursor-pointer"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          <aside className="w-48 border-r border-gray-200 bg-gray-50/30 py-4 shrink-0">
            <nav className="space-y-0.5 px-3">
              {STAFF_TAB_ITEMS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                    activeTab === tab.id
                      ? "bg-orange-100 text-orange-700"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <tab.icon className="w-4 h-4 shrink-0" />
                  {tab.label}
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 ml-auto",
                      activeTab === tab.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
              </div>
            ) : (
              <>
                {activeTab === "overview" && (
                  <StaffOverviewSection user={displayUser || user} />
                )}
                {activeTab === "profile" && (
                  <ProfileSection user={displayUser || user} />
                )}
                {activeTab === "account" && (
                  <AccountSection user={displayUser || user} />
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function StaffOverviewSection({ user }: { user: User | null }) {
  if (!user) return null;
  const u = user as any;

  const cards = [
    {
      icon: UserIcon,
      label: "User ID",
      value: u._id?.slice(-8) || "N/A",
      color: "bg-gray-50 border-gray-200 text-gray-700",
    },
    {
      icon: Building2,
      label: "Role",
      value: formatUserTypeLabel(u.userType || ""),
      color: "bg-purple-50 border-purple-200 text-purple-700",
    },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Overview</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={cn(
              "p-4 rounded-xl border flex items-center gap-4",
              card.color
            )}
          >
            <div className="p-2 bg-white/60 rounded-lg">
              <card.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium opacity-80">{card.label}</p>
              <p className="text-xl font-bold">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">
          Quick Info
        </h4>
        <div className="space-y-3">
          <InfoRow icon={Mail} label="Email" value={u.email || "N/A"} />
          <InfoRow icon={Phone} label="Phone" value={u.phone || "N/A"} />
          <InfoRow
            icon={Calendar}
            label="Joined"
            value={
              u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) : "N/A"
            }
          />
        </div>
      </div>
    </div>
  );
}
