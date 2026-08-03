"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { getPostLoginRedirectPath } from "@/lib/postLoginRedirect";
import {
  ChevronLeftIcon,
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
  Monitor,
  Smartphone,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import EmailPreferencesCard from "@/components/account/EmailPreferencesCard";
import { formatIstDate } from "@/lib/ist";
import {
  validatePassword,
  getPasswordRequirementsText,
} from "@/lib/passwordValidation";

/** One active login session (a refresh-token family), as returned by the API. */
type Session = {
  family: string;
  deviceInfo?: {
    userAgent?: string;
    ipAddress?: string;
    deviceType?: string;
  };
  createdAt: string;
  lastActive: string;
  current: boolean;
};

/** Friendly "Chrome on Windows"-style label from a raw user-agent string. */
const describeUserAgent = (ua?: string): string => {
  if (!ua) return "Unknown device";

  let browser = "Browser";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/OPR\//.test(ua) || /Opera/.test(ua)) browser = "Opera";
  else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = "Chrome";
  else if (/Chromium/.test(ua)) browser = "Chromium";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Version\/.*Safari/.test(ua)) browser = "Safari";

  let os = "";
  if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/Windows NT/.test(ua)) os = "Windows";
  else if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/CrOS/.test(ua)) os = "ChromeOS";
  else if (/Linux/.test(ua)) os = "Linux";

  return os ? `${browser} on ${os}` : browser;
};

/** Shape of an Axios error carrying our standard API error envelope. */
type ApiError = {
  response?: {
    status?: number;
    data?: { error?: { message?: string }; message?: string };
  };
};

/** Best available human-readable message from an API error, else a fallback. */
const apiErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as ApiError;
  return (
    err?.response?.data?.error?.message ||
    err?.response?.data?.message ||
    fallback
  );
};

/** Short relative time like "Just now" / "3 hours ago" / a date. */
const timeAgo = (iso: string): string => {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return "Active just now";
  if (mins < 60) return `Active ${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Active ${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Active ${days} day${days === 1 ? "" : "s"} ago`;
  return `Active on ${formatIstDate(iso)}`;
};

const SettingsPage = () => {
  const router = useRouter();
  const { user: viewer } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userProvider, setUserProvider] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {},
  );
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Active sessions
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingFamily, setRevokingFamily] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);

  // Fetch user data to check provider
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await apiClient.get("/users/me");
        if (response.data?.data) {
          setUserProvider(response.data.data.provider || null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await apiClient.get(ENDPOINTS.auth.sessions);
      const list: Session[] = res.data?.data?.sessions ?? [];
      // Current device first, then most-recently-active.
      list.sort((a, b) => {
        if (a.current !== b.current) return a.current ? -1 : 1;
        return (
          new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
        );
      });
      setSessions(list);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevoke = async (family: string) => {
    setRevokingFamily(family);
    try {
      await apiClient.post(ENDPOINTS.auth.revokeSession, { family });
      toast.success("Device signed out");
      setSessions((prev) => prev.filter((s) => s.family !== family));
    } catch (error) {
      toast.error(
        apiErrorMessage(
          error,
          "Couldn't sign out that device. Please try again.",
        ),
      );
    } finally {
      setRevokingFamily(null);
    }
  };

  const handleRevokeOthers = async () => {
    setRevokingOthers(true);
    try {
      await apiClient.post(ENDPOINTS.auth.revokeOtherSessions);
      toast.success("Signed out of all other devices");
      setSessions((prev) => prev.filter((s) => s.current));
    } catch (error) {
      toast.error(
        apiErrorMessage(
          error,
          "Couldn't sign out other devices. Please try again.",
        ),
      );
    } finally {
      setRevokingOthers(false);
    }
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validatePasswordForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword) {
      errors.newPassword = "New password is required";
    } else {
      // Validate new password against rules
      const passwordValidationErrors = validatePassword(
        passwordData.newPassword,
      );
      if (Object.keys(passwordValidationErrors).length > 0) {
        // Combine all password validation errors into one message
        const errorMessages = Object.values(passwordValidationErrors).filter(
          Boolean,
        );
        errors.newPassword = errorMessages.join(". ");
      }
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword =
        "New password must be different from current password";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    setUpdatingPassword(true);

    try {
      const response = await apiClient.put("/users/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.data) {
        toast.success("Password updated successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordErrors({});
      }
    } catch (error) {
      console.error("Error updating password:", error);
      const err = error as ApiError;

      toast.error(
        apiErrorMessage(error, "Failed to update password. Please try again."),
      );

      // Handle specific password errors
      if (
        err.response?.status === 400 &&
        err.response.data?.message?.includes("current password")
      ) {
        setPasswordErrors({
          currentPassword: "Current password is incorrect",
        });
      }
    } finally {
      setUpdatingPassword(false);
    }
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev],
    }));
  };

  const otherSessionsCount = sessions.filter((s) => !s.current).length;
  const knowsCurrent = sessions.some((s) => s.current);

  return (
    <div className="w-full mx-auto p-6 flex flex-col gap-10">
      {/* Header Section */}
      <div className="bg-linear-to-r from-orange-50 to-white rounded-xl p-6 border border-orange-100 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                viewer
                  ? router.push(getPostLoginRedirectPath(viewer, undefined))
                  : router.push("/")
              }
              className="p-2.5 rounded-full bg-white hover:bg-gray-50 border border-gray-200 hover:border-orange-300 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md group"
              title="Back"
            >
              <ChevronLeftIcon className="size-5 text-gray-700 group-hover:text-orange-600 transition-colors" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Settings
              </h1>
              <p className="text-sm text-gray-600">
                Manage your account settings and preferences
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:max-w-[90%] w-full mx-auto flex flex-col gap-6">
        {/* Password Change Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Lock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Change Password
              </h2>
              <p className="text-sm text-gray-600">
                Update your password to keep your account secure
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : userProvider !== "credentials" ? (
            // OAuth Account - Password change not allowed
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Password Change Not Available
                  </h3>
                  <p className="text-blue-800 mb-1">
                    Your account was created using{" "}
                    {userProvider === "google"
                      ? "Google"
                      : userProvider === "linkedin"
                        ? "LinkedIn"
                        : "a third-party service"}
                    . Password changes are only available for accounts created
                    with email and password.
                  </p>
                  <p className="text-sm text-blue-700 mt-2">
                    To change your password, please use the password reset
                    feature from your{" "}
                    {userProvider === "google"
                      ? "Google"
                      : userProvider === "linkedin"
                        ? "LinkedIn"
                        : "account provider"}{" "}
                    account settings.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Credentials Account - Password change allowed
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      handlePasswordChange("currentPassword", e.target.value)
                    }
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 hover:border-orange-400 transition-all duration-200 ease-in-out outline-none shadow-sm hover:shadow-md"
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      togglePasswordVisibility("current");
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-sm text-red-500">
                    {passwordErrors.currentPassword}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      handlePasswordChange("newPassword", e.target.value)
                    }
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 hover:border-orange-400 transition-all duration-200 ease-in-out outline-none shadow-sm hover:shadow-md"
                    placeholder="Enter your new password"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      togglePasswordVisibility("new");
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-500">
                    {passwordErrors.newPassword}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {getPasswordRequirementsText()}
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      handlePasswordChange("confirmPassword", e.target.value)
                    }
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 hover:border-orange-400 transition-all duration-200 ease-in-out outline-none shadow-sm hover:shadow-md"
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      togglePasswordVisibility("confirm");
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">
                    {passwordErrors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <OrangeButton
                  type="submit"
                  disabled={updatingPassword}
                  className="w-full sm:w-auto px-8 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {updatingPassword && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {updatingPassword
                    ? "Updating Password..."
                    : "Update Password"}
                </OrangeButton>
              </div>
            </form>
          )}
        </div>

        {/* Active Sessions Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ShieldCheck className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Active Sessions
                </h2>
                <p className="text-sm text-gray-600">
                  Devices currently signed in to your account
                </p>
              </div>
            </div>

            {otherSessionsCount > 0 && (
              <button
                onClick={handleRevokeOthers}
                disabled={revokingOthers}
                className="mt-2 sm:mt-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {revokingOthers ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                Log out all other devices
              </button>
            )}
          </div>

          {sessionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">
              No active sessions found.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {!knowsCurrent && (
                <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                  <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
                  <span>
                    Sign out and sign back in to highlight the device
                    you&apos;re using right now.
                  </span>
                </div>
              )}

              {sessions.map((session) => {
                const isMobile = session.deviceInfo?.deviceType === "mobile";
                const DeviceIcon = isMobile ? Smartphone : Monitor;
                return (
                  <div
                    key={session.family}
                    className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors ${
                      session.current
                        ? "border-orange-200 bg-orange-50/60"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          session.current
                            ? "bg-orange-100 text-orange-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <DeviceIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900 truncate">
                            {describeUserAgent(session.deviceInfo?.userAgent)}
                          </p>
                          {session.current && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                              This device
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {session.current
                            ? "Active now"
                            : timeAgo(session.lastActive)}
                          {session.deviceInfo?.ipAddress
                            ? ` • ${session.deviceInfo.ipAddress}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    {!session.current && (
                      <button
                        onClick={() => handleRevoke(session.family)}
                        disabled={revokingFamily === session.family}
                        className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {revokingFamily === session.family ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                        ) : (
                          <LogOut className="w-4 h-4" />
                        )}
                        Sign out
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Email Preferences Card */}
        <EmailPreferencesCard />
      </div>
    </div>
  );
};

export default SettingsPage;
