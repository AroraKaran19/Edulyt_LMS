"use client";

import React, { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { showLoginErrorToast } from "@/lib/showLoginErrorToast";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, ArrowLeft } from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import Input from "@/components/ui/inputs/Input";

const AdminLoginPage = () => {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle admin role checking after successful login
  useEffect(() => {
    if (loginSuccess && session?.user) {
      const user = session.user as any;
      if (user?.userType === "admin" || user?.userType === "super-admin") {
        toast.success("Admin login successful!");
        router.push("/admin");
      } else {
        toast.error("Access denied. Admin privileges required.");
        // Sign out the user since they don't have admin access
        signIn("signout");
        router.push("/login");
      }
      setLoginSuccess(false); // Reset the flag
    }
  }, [session, loginSuccess, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Use NextAuth's credentials provider directly (same as regular login)
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false, // Don't redirect automatically
        callbackUrl: "/admin",
      });

      if (result?.error) {
        showLoginErrorToast(result.error);
      } else if (result?.ok) {
        // Set flag to trigger admin role checking in useEffect
        setLoginSuccess(true);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.error("Admin login error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prevent hydration mismatch by not rendering form until client-side
  if (!isClient) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#F8F9FA] to-[#E9ECEF] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-6"></div>
              <div className="space-y-4">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#F8F9FA] to-[#E9ECEF] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to regular login */}
        <div className="mb-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to regular login</span>
          </Link>
        </div>

        {/* Admin Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Admin Login
            </h1>
            <p className="text-gray-600">
              Sign in to access the admin dashboard
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your admin email"
                required
                icon={<Mail className="w-5 h-5 text-gray-400" />}
              />
            </div>

            {/* Password Field */}
            <div>
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                icon={<Lock className="w-5 h-5 text-gray-400" />}
                rightIcon={
                  showPassword ? (
                    <Eye
                      className="w-5 h-5 text-gray-400 cursor-pointer"
                      onClick={() => setShowPassword(false)}
                    />
                  ) : (
                    <EyeOff
                      className="w-5 h-5 text-gray-400 cursor-pointer"
                      onClick={() => setShowPassword(true)}
                    />
                  )
                }
              />
            </div>

            {/* Login Button */}
            <OrangeButton
              type="submit"
              className="w-full rounded-xl font-bold"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In as Admin"}
            </OrangeButton>
          </form>

          {/* Admin Notice */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-amber-600 mt-0.5">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-amber-800 mb-1">
                  Admin Access Required
                </h4>
                <p className="text-xs text-amber-700">
                  This area is restricted to authorized administrators only.
                  Unauthorized access attempts will be logged.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Need help? Contact{" "}
            <a
              href="mailto:support@airkrit.com"
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              support@airkrit.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
