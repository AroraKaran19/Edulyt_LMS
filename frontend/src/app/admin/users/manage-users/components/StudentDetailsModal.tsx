"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Edit,
  Key,
  User as UserIcon,
  BookOpen,
  Award,
  Building2,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  ChevronRight,
  ExternalLink,
  FileCheck,
  IndianRupee,
  BarChart3,
  Search,
  Clock,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import useUserManagement from "@/hooks/useUserManagement";
import { User } from "@/types/user";
import { Enrollment } from "@/types/enrollment";
import type { InternshipEnrollmentListRow } from "@/types";
import { cn } from "@/lib/utils";
import {
  getUserTypeBadgeColor,
  getStatusBadgeColor,
  formatUserTypeLabel,
  InfoRow,
  ProfileSection,
  AccountSection,
} from "./UserDetailsModalShared";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

type TabId =
  | "overview"
  | "profile"
  | "courses"
  | "internships"
  | "certificates"
  | "account";

interface StudentDetailsModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onEdit: (user: User) => void;
  onChangePassword: (user: User) => void;
}

const TAB_ITEMS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: UserIcon },
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "internships", label: "Internships", icon: Briefcase },
  { id: "certificates", label: "Certificates", icon: Award },
  { id: "account", label: "Account", icon: Building2 },
];

export default function StudentDetailsModal({
  isOpen,
  user,
  onClose,
  onEdit,
  onChangePassword,
}: StudentDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [fullUserData, setFullUserData] = useState<User | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [internshipEnrollments, setInternshipEnrollments] = useState<
    InternshipEnrollmentListRow[]
  >([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [totalSpend, setTotalSpend] = useState<number>(0);
  const [averageTimeToCompleteSeconds, setAverageTimeToCompleteSeconds] =
    useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const { getUserDetailsForAdmin, getTimeSpentPerDay } = useUserManagement();

  const displayUser = fullUserData || user;

  useEffect(() => {
    if (!isOpen || !user?._id) return;

    setLoading(true);
    const fetchDetails = async () => {
      try {
        const details = await getUserDetailsForAdmin(user._id!);
        if (details) {
          if (details.user) setFullUserData(details.user);
          setEnrollments(details.enrollments);
          setInternshipEnrollments(details.internshipEnrollments ?? []);
          setCertificates(details.certificates);
          setTotalSpend(details.totalSpend);
          setAverageTimeToCompleteSeconds(
            details.averageTimeToCompleteSeconds ?? null,
          );
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [isOpen, user?._id, getUserDetailsForAdmin]);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab("overview");
      setFullUserData(null);
      setEnrollments([]);
      setInternshipEnrollments([]);
      setCertificates([]);
      setTotalSpend(0);
      setAverageTimeToCompleteSeconds(null);
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const getInitials = (firstName: string, lastName: string): string => {
    if (firstName && lastName) {
      return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (lastName) {
      return lastName.charAt(0).toUpperCase();
    } else {
      return "N/A";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-4">
            {displayUser?.profilePicture ? (
              <Zoom>
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
              </Zoom>
            ) : (
              <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-500">
                  {getInitials(
                    displayUser?.firstName || "",
                    displayUser?.lastName || "",
                  )}
                </span>
              </div>
            )}
            <div>
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
                    getUserTypeBadgeColor((user as any).userType),
                  )}
                >
                  {formatUserTypeLabel((user as any).userType)}
                </span>
                <span
                  className={cn(
                    "inline-flex px-2 py-0.5 text-xs font-semibold rounded-full",
                    getStatusBadgeColor((user as any).status),
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
          {/* Sidebar */}
          <aside className="w-56 border-r border-gray-200 bg-gray-50/30 py-4 shrink-0">
            <nav className="space-y-0.5 px-3">
              {TAB_ITEMS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                    activeTab === tab.id
                      ? "bg-orange-100 text-orange-700"
                      : "text-gray-600 hover:bg-gray-100",
                  )}
                >
                  <tab.icon className="w-4 h-4 shrink-0" />
                  {tab.label}
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 ml-auto",
                      activeTab === tab.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
              </div>
            ) : (
              <>
                {activeTab === "overview" && (
                  <OverviewSection
                    user={displayUser || user}
                    enrollments={enrollments}
                    certificates={certificates}
                    totalSpend={totalSpend}
                    averageTimeToCompleteSeconds={averageTimeToCompleteSeconds}
                    getTimeSpentPerDay={getTimeSpentPerDay}
                  />
                )}
                {activeTab === "profile" && (
                  <ProfileSection user={displayUser || user} />
                )}
                {activeTab === "courses" && (
                  <CoursesSection user={user} enrollments={enrollments} />
                )}
                {activeTab === "internships" && (
                  <InternshipsSection enrollments={internshipEnrollments} />
                )}
                {activeTab === "certificates" && (
                  <CertificatesSection certificates={certificates} />
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

type TimeRangeKey = "today" | "7d" | "30d" | "6m" | "12m" | "all" | "custom";

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDateRange(
  range: TimeRangeKey,
  customFrom?: string,
  customTo?: string,
): { from: string; to: string } {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (range === "custom" && customFrom && customTo) {
    return { from: customFrom, to: customTo };
  }

  const from = new Date();
  from.setHours(0, 0, 0, 0);

  switch (range) {
    case "today":
      break;
    case "7d":
      from.setDate(from.getDate() - 6);
      break;
    case "30d":
      from.setDate(from.getDate() - 29);
      break;
    case "6m":
      from.setMonth(from.getMonth() - 5);
      break;
    case "12m":
      from.setFullYear(from.getFullYear() - 1);
      break;
    case "all":
      from.setFullYear(from.getFullYear() - 5);
      break;
    default:
      from.setDate(from.getDate() - 6);
  }
  return { from: toLocalDateStr(from), to: toLocalDateStr(today) };
}

function formatSelectedRange(from: string, to: string): string {
  const fromD = new Date(from);
  const toD = new Date(to);
  return `${fromD.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  })} to ${toD.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

function fillMissingDays(
  data: { date: string; minutes: number }[],
  from: string,
  to: string,
): { date: string; label: string; minutes: number }[] {
  const map = new Map(data.map((d) => [d.date, d.minutes]));
  const result: { date: string; label: string; minutes: number }[] = [];
  const start = new Date(from);
  const end = new Date(to);

  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = toLocalDateStr(d);
    result.push({
      date: key,
      label: d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" }),
      minutes: map.get(key) ?? 0,
    });
  }
  return result;
}

const PRESET_RANGES: { key: TimeRangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "6m", label: "Last 6 Months" },
  { key: "12m", label: "Last 12 Months" },
  { key: "all", label: "All Time" },
];

function TimeSpentGraph({
  userId,
  getTimeSpentPerDay,
}: {
  userId: string;
  getTimeSpentPerDay: (
    userId: string,
    from: string,
    to: string,
  ) => Promise<{ date: string; minutes: number }[]>;
}) {
  const [range, setRange] = useState<TimeRangeKey>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [appliedCustomFrom, setAppliedCustomFrom] = useState("");
  const [appliedCustomTo, setAppliedCustomTo] = useState("");
  const [chartData, setChartData] = useState<
    { date: string; label: string; minutes: number }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const { from, to } =
    range === "custom"
      ? getDateRange(range, appliedCustomFrom, appliedCustomTo)
      : getDateRange(range);
  const showCustomSection = range === "custom";

  useEffect(() => {
    if (!userId) return;

    if (range === "custom" && (!appliedCustomFrom || !appliedCustomTo)) {
      setChartData([]);
      return;
    }

    setLoading(true);
    getTimeSpentPerDay(userId, from, to)
      .then((data) => {
        const filled = fillMissingDays(data, from, to);
        setChartData(filled);
      })
      .finally(() => setLoading(false));
  }, [userId, range, appliedCustomFrom, appliedCustomTo, getTimeSpentPerDay]);

  const handleCustomRangeClick = () => {
    setRange("custom");
    if (!customFrom || !customTo) {
      const today = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 6);
      const fromStr = weekAgo.toISOString().slice(0, 10);
      const toStr = today.toISOString().slice(0, 10);
      setCustomFrom(fromStr);
      setCustomTo(toStr);
      setAppliedCustomFrom(fromStr);
      setAppliedCustomTo(toStr);
    }
  };

  const handleApplyDateRange = () => {
    if (customFrom && customTo && new Date(customFrom) <= new Date(customTo)) {
      setAppliedCustomFrom(customFrom);
      setAppliedCustomTo(customTo);
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-500 uppercase flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        Time Spent per Day
      </h4>
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        {/* Row 1: Preset buttons + Custom Range */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESET_RANGES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                range === key
                  ? "bg-gray-200 text-gray-800"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={handleCustomRangeClick}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5",
              range === "custom"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            )}
          >
            <Calendar className="w-4 h-4" />
            Custom Range
          </button>
        </div>

        {/* Row 2: Custom date picker (when Custom Range selected) */}
        {showCustomSection && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
            <p className="text-sm text-gray-600">
              Selected Range:{" "}
              <span className="font-medium text-blue-600">
                {appliedCustomFrom && appliedCustomTo
                  ? formatSelectedRange(appliedCustomFrom, appliedCustomTo)
                  : "Select dates below and click Apply"}
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  From:
                </label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">To:</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyDateRange}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 cursor-pointer flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Apply Date Range
              </button>
            </div>
          </div>
        )}

        <div className="h-[200px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              No activity in this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5E5EF"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}m`}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `${value ?? 0} min`,
                    "Time spent",
                  ]}
                  labelFormatter={(label) => label}
                />
                <Bar
                  dataKey="minutes"
                  fill="#F67124"
                  radius={[4, 4, 0, 0]}
                  name="minutes"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  if (hours < 24) return remainMins ? `${hours}h ${remainMins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  return remainHours ? `${days}d ${remainHours}h` : `${days}d`;
}

function OverviewSection({
  user,
  enrollments,
  certificates,
  totalSpend,
  averageTimeToCompleteSeconds,
  getTimeSpentPerDay,
}: {
  user: User | null;
  enrollments: Enrollment[];
  certificates: any[];
  totalSpend: number;
  averageTimeToCompleteSeconds: number | null;
  getTimeSpentPerDay: (
    userId: string,
    from: string,
    to: string,
  ) => Promise<{ date: string; minutes: number }[]>;
}) {
  if (!user) return null;

  const cards = [
    {
      icon: IndianRupee,
      label: "Total Spend",
      value: `₹${totalSpend.toLocaleString("en-IN")}`,
      color: "bg-amber-50 border-amber-200 text-amber-700",
    },
    {
      icon: Clock,
      label: "Avg. Time to Complete",
      value:
        averageTimeToCompleteSeconds != null
          ? formatDuration(averageTimeToCompleteSeconds)
          : "—",
      color: "bg-violet-50 border-violet-200 text-violet-700",
    },
    {
      icon: BookOpen,
      label: "Courses Enrolled",
      value: enrollments.length,
      color: "bg-blue-50 border-blue-200 text-blue-700",
    },
    {
      icon: Award,
      label: "Certificates",
      value: certificates.length,
      color: "bg-green-50 border-green-200 text-green-700",
    },
    {
      icon: Star,
      label: "Success Points",
      value: (user as { successPoints?: number }).successPoints ?? 0,
      color: "bg-orange-50 border-orange-200 text-orange-700",
    },
    {
      icon: UserIcon,
      label: "User ID",
      value: (user as any)._id?.slice(-8) || "N/A",
      color: "bg-gray-50 border-gray-200 text-gray-700",
    },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Overview</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={cn(
              "p-4 rounded-xl border flex items-center gap-4",
              card.color,
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

      <TimeSpentGraph
        userId={(user as any)._id}
        getTimeSpentPerDay={getTimeSpentPerDay}
      />

      <div>
        <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">
          Quick Info
        </h4>
        <div className="space-y-3">
          <InfoRow
            icon={Mail}
            label="Email"
            value={(user as any).email || "N/A"}
          />
          <InfoRow
            icon={Phone}
            label="Phone"
            value={(user as any).phone || "N/A"}
          />
          <InfoRow
            icon={Calendar}
            label="Joined"
            value={
              (user as any).createdAt
                ? new Date((user as any).createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })
                : "N/A"
            }
          />
        </div>
      </div>
    </div>
  );
}

function CoursesSection({
  user,
  enrollments,
}: {
  user: User;
  enrollments: Enrollment[];
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Enrolled Courses</h3>
      {enrollments.length === 0 ? (
        <p className="text-gray-500">No courses enrolled</p>
      ) : (
        <div className="space-y-3">
          {enrollments.map((e: any) => {
            const course = e.courseId;
            const courseTitle =
              typeof course === "object" && course?.title
                ? course.title
                : "Course";
            const slug =
              typeof course === "object" && course?.slug ? course.slug : null;
            const progress = e.progress?.overallCompletion ?? 0;

            const isTrialEnrollment =
              e.isTrial === true || e.enrollmentSource === "trial";
            const trialExpiryDate =
              isTrialEnrollment && e.trialExpiresAt
                ? new Date(e.trialExpiresAt)
                : null;
            const isTrialExpired = trialExpiryDate
              ? trialExpiryDate < new Date()
              : false;
            const daysUntilExpiry =
              trialExpiryDate && !isTrialExpired
                ? Math.ceil(
                    (trialExpiryDate.getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24),
                  )
                : null;

            const sourceBadge = isTrialEnrollment
              ? {
                  label: isTrialExpired ? "Trial Expired" : "Trial",
                  class: isTrialExpired
                    ? "bg-red-100 text-red-800 border-red-200"
                    : "bg-amber-100 text-amber-800 border-amber-200",
                }
              : e.enrollmentSource === "gift"
                ? {
                    label: "Gifted",
                    class: "bg-purple-100 text-purple-800 border-purple-200",
                  }
                : e.enrollmentSource === "promotion"
                  ? {
                      label: "Promotion",
                      class:
                        "bg-emerald-100 text-emerald-800 border-emerald-200",
                    }
                  : {
                      label: "Purchased",
                      class: "bg-blue-100 text-blue-800 border-blue-200",
                    };

            const trialExpiryText =
              isTrialEnrollment && !isTrialExpired && daysUntilExpiry !== null
                ? daysUntilExpiry === 0
                  ? "Expires today"
                  : daysUntilExpiry === 1
                    ? "Expiring in 1 day"
                    : `Expiring in ${daysUntilExpiry} days`
                : null;

            return (
              <div
                key={e._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100/80 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900">{courseTitle}</p>
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 text-xs font-medium rounded-full border",
                          sourceBadge.class,
                        )}
                      >
                        {sourceBadge.label}
                      </span>
                      {trialExpiryText && (
                        <span className="text-xs text-amber-600 font-medium">
                          {trialExpiryText}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Progress: {progress}% •{" "}
                      {e.status === "completed"
                        ? "Completed"
                        : e.status === "active"
                          ? "Active"
                          : e.status}
                    </p>
                  </div>
                </div>
                {slug && (
                  <Link
                    href={`/programs/${slug}/watch`}
                    className="text-sm text-orange-600 hover:underline flex items-center gap-1"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function internshipStatusBadgeClass(status: string): string {
  if (status === "enrolled")
    return "bg-green-100 text-green-800 border-green-200";
  if (status === "completed")
    return "bg-blue-100 text-blue-800 border-blue-200";
  if (status === "in_merit_pool" || status === "exam_attempted")
    return "bg-amber-100 text-amber-800 border-amber-200";
  if (status === "exam_registered")
    return "bg-sky-100 text-sky-800 border-sky-200";
  if (status === "payment_pending")
    return "bg-orange-100 text-orange-800 border-orange-200";
  if (status === "dropped" || status === "revoked" || status === "admin_rejected")
    return "bg-gray-200 text-gray-700 border-gray-300";
  if (status === "paused")
    return "bg-violet-100 text-violet-800 border-violet-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
}

function formatInternshipDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function InternshipsSection({
  enrollments,
}: {
  enrollments: InternshipEnrollmentListRow[];
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Internship Enrollments
      </h3>
      {enrollments.length === 0 ? (
        <p className="text-gray-500">No internship enrollments</p>
      ) : (
        <div className="space-y-3">
          {enrollments.map((e) => (
            <div
              key={e._id}
              className="p-4 bg-gray-50 rounded-xl border border-gray-100"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">
                      {e.internship?.title ?? "Internship"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {e.batchSnapshot?.name ?? "No batch assigned"}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex px-2 py-1 text-xs font-semibold rounded-full border capitalize",
                    internshipStatusBadgeClass(e.status),
                  )}
                >
                  {e.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 sm:pl-14 text-xs text-gray-500">
                {e.enrollmentType && (
                  <span>
                    Path:{" "}
                    <span className="font-medium text-gray-700">
                      {e.enrollmentType === "merit" ? "Merit" : "Paid"}
                    </span>
                  </span>
                )}
                <span>
                  Points:{" "}
                  <span className="font-medium text-gray-700">
                    {e.internshipSuccessPoints ?? 0}
                  </span>
                </span>
                <span>
                  Enrolled:{" "}
                  <span className="font-medium text-gray-700">
                    {formatInternshipDate(e.enrolledAt)}
                  </span>
                </span>
                <span>
                  Updated:{" "}
                  <span className="font-medium text-gray-700">
                    {formatInternshipDate(e.updatedAt)}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CertificatesSection({ certificates }: { certificates: any[] }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Certificates</h3>
      {certificates.length === 0 ? (
        <p className="text-gray-500">No certificates earned</p>
      ) : (
        <div className="space-y-3">
          {certificates.map((cert: any) => (
            <div
              key={cert._id}
              className="flex items-center justify-between p-4 bg-green-50/50 rounded-xl border border-green-100"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {cert.courseName ||
                      (cert.courseId as any)?.title ||
                      "Course"}
                  </p>
                  <p className="text-xs text-gray-500">
                    ID: {cert.certificateId} •{" "}
                    {cert.issuedAt
                      ? new Date(cert.issuedAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {cert.verificationUrl && (
                  <a
                    href={cert.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-600 hover:underline flex items-center gap-1"
                  >
                    Verify <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {cert.fileUrl && (
                  <a
                    href={cert.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-orange-600 hover:underline flex items-center gap-1"
                  >
                    <FileCheck className="w-4 h-4" />
                    Download
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
