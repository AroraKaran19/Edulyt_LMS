"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { getPostLoginRedirectPath } from "@/lib/postLoginRedirect";
import { ChevronLeftIcon, Eye, EyeOff, Lock, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { validatePassword, getPasswordRequirementsText } from "@/lib/passwordValidation";

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
    {}
  );
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

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
      const passwordValidationErrors = validatePassword(passwordData.newPassword);
      if (Object.keys(passwordValidationErrors).length > 0) {
        // Combine all password validation errors into one message
        const errorMessages = Object.values(passwordValidationErrors).filter(Boolean);
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
    } catch (error: any) {
      console.error("Error updating password:", error);

      if (error.response?.data?.error?.message) {
        toast.error(error.response.data.error.message);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to update password. Please try again.");
      }

      // Handle specific password errors
      if (error.response?.status === 400) {
        if (error.response.data.message?.includes("current password")) {
          setPasswordErrors({
            currentPassword: "Current password is incorrect",
          });
        }
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

      <div className="lg:max-w-[90%] w-full mx-auto overflow-hidden">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
          {/* Password Change Section */}
          <div className="mb-8">
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
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
