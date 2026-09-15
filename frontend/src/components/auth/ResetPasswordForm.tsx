"use client";

import OrangeButton from "@/components/ui/buttons/OrangeButton";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { isPasswordValid, validatePassword } from "@/lib/passwordValidation";
import type { PasswordValidationErrors } from "@/lib/passwordValidation";
import { ArrowLeft, Check, Eye, EyeOff, Lock, X } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "react-toastify";

const REQUIREMENTS: { key: keyof PasswordValidationErrors; label: string }[] = [
  { key: "length", label: "At least 8 characters" },
  { key: "capital", label: "At least one capital letter (A-Z)" },
  { key: "small", label: "At least one small letter (a-z)" },
  { key: "symbol", label: "At least one symbol (!@#$%^&*)" },
];

const apiErrorMessage = (error: unknown, fallback: string): string =>
  (error as { response?: { data?: { error?: { message?: string } } } })?.response
    ?.data?.error?.message ?? fallback;

const Header = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <>
    <div className="flex items-center gap-2 mb-4">
      <Link
        href="/login"
        aria-label="Back to sign in"
        className="flex items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-gray-600" />
      </Link>
    </div>

    <div className="header flex flex-col gap-2 mb-8">
      <h1 className="text-3xl lg:text-4xl font-regular font-coolvetica text-center lg:text-start text-text-primary">
        {title}
      </h1>
      <p className="text-base font-regular text-center lg:text-start text-text-primary">
        {subtitle}
      </p>
    </div>
  </>
);

const ResetPasswordForm = ({ token }: { token: string }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <>
        <Header
          title="Link Incomplete"
          subtitle="This reset link is missing part of its address. Request a new one and open it straight from the email."
        />
        <p className="text-sm text-gray-500 font-bold">
          <Link href="/forgot-password" className="text-orange-500 font-bold">
            Request a new link
          </Link>
        </p>
      </>
    );
  }

  if (done) {
    return (
      <>
        <Header
          title="Password Updated"
          subtitle="Your password has been changed. Sign in with your new password."
        />
        <p className="text-sm text-gray-500 font-bold">
          <Link href="/login" className="text-orange-500 font-bold">
            Sign In
          </Link>
        </p>
      </>
    );
  }

  const passwordErrors: PasswordValidationErrors = password
    ? validatePassword(password)
    : {};
  const mismatch = confirmPassword.length > 0 && confirmPassword !== password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid(password)) {
      toast.error("Please choose a password that meets every rule");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await apiClient.post(ENDPOINTS.auth.resetPassword, {
        token,
        newPassword: password,
      });
      setDone(true);
    } catch (error) {
      toast.error(
        apiErrorMessage(error, "Something went wrong. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header
        title="Choose a New Password"
        subtitle="Enter a new password for your account."
      />

      <form
        className="form w-full max-w-lg flex flex-col gap-4 lg:max-w-full"
        onSubmit={handleSubmit}
      >
        <div className="w-full">
          <div
            className={`relative w-full flex gap-3 bg-white rounded-md p-3 border transition-colors ${
              password && Object.keys(passwordErrors).length > 0
                ? "border-red-300"
                : password
                  ? "border-green-300"
                  : "border-gray-300 focus-within:border-orange-400"
            }`}
          >
            <label htmlFor="new-password" className="text-sm text-gray-500 shrink-0">
              <Lock className="w-5 h-5" />
            </label>
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              autoComplete="new-password"
              className="w-full bg-transparent outline-none font-bold pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {password && (
            <div className="mt-2 space-y-1.5">
              {REQUIREMENTS.map(({ key, label }) => {
                const met = !passwordErrors[key];
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-2 text-xs ${met ? "text-green-600" : "text-gray-500"}`}
                  >
                    {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="w-full">
          <div
            className={`relative w-full flex gap-3 bg-white rounded-md p-3 border transition-colors ${
              mismatch
                ? "border-red-300"
                : confirmPassword && confirmPassword === password
                  ? "border-green-300"
                  : "border-gray-300 focus-within:border-orange-400"
            }`}
          >
            <label htmlFor="confirm-password" className="text-sm text-gray-500 shrink-0">
              <Lock className="w-5 h-5" />
            </label>
            <input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm New Password"
              autoComplete="new-password"
              className="w-full bg-transparent outline-none font-bold pr-10"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {mismatch && (
            <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
          )}
        </div>

        <OrangeButton
          type="submit"
          className="w-full mt-1 lg:mt-2 rounded-xl font-bold"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save New Password"}
        </OrangeButton>
      </form>

      <div className="flex items-center justify-center gap-2 mt-6">
        <p className="text-sm text-gray-500 font-bold">
          Link expired?{" "}
          <Link href="/forgot-password" className="text-orange-500 font-bold">
            Request a new one
          </Link>
        </p>
      </div>
    </>
  );
};

export default ResetPasswordForm;
