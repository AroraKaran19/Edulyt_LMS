"use client";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { Eye, Lock, Mail, EyeOff, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  validatePassword,
  getPasswordRequirementsText,
  isPasswordValid,
  PasswordValidationErrors,
} from "@/lib/passwordValidation";
import { Check, X } from "lucide-react";
import { awaitClientSessionAfterSignIn } from "@/lib/awaitClientSession";
import { signInWithOAuthProvider } from "@/lib/oauthSignInClient";
import { getPostLoginRedirectPath } from "@/lib/postLoginRedirect";
import type { User } from "@/types/user";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<
    PasswordValidationErrors & { confirmPassword?: string }
  >({});
  const [showPasswordValidation, setShowPasswordValidation] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const callbackUrl = searchParams.get("callbackUrl") || undefined;

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Handle password change with real-time validation
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    if (newPassword.length > 0) {
      setShowPasswordValidation(true);
      const validationErrors = validatePassword(newPassword);
      setPasswordErrors(validationErrors);
    } else {
      setShowPasswordValidation(false);
      setPasswordErrors({});
    }

    // Clear confirm password error if passwords match
    if (confirmPassword && newPassword === confirmPassword) {
      setPasswordErrors(
        (prev: PasswordValidationErrors & { confirmPassword?: string }) => {
          const newErrors = { ...prev };
          delete newErrors.confirmPassword;
          return newErrors;
        }
      );
    }
  };

  // Handle confirm password change
  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);

    if (newConfirmPassword && password && newConfirmPassword !== password) {
      setPasswordErrors(
        (prev: PasswordValidationErrors & { confirmPassword?: string }) => ({
          ...prev,
          confirmPassword: "Passwords do not match",
        })
      );
    } else {
      setPasswordErrors(
        (prev: PasswordValidationErrors & { confirmPassword?: string }) => {
          const newErrors = { ...prev };
          delete newErrors.confirmPassword;
          return newErrors;
        }
      );
    }
  };

  // Check individual password requirements
  const checkPasswordRequirement = (
    type: "length" | "capital" | "small" | "symbol"
  ): boolean => {
    if (!password) return false;

    switch (type) {
      case "length":
        return password.length >= 8;
      case "capital":
        return /[A-Z]/.test(password);
      case "small":
        return /[a-z]/.test(password);
      case "symbol":
        return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
      default:
        return false;
    }
  };

  const handleOAuthSignIn = async (provider: string) => {
    setIsOAuthLoading(true);
    try {
      const out = await signInWithOAuthProvider(provider, callbackUrl);
      if (out.kind === "error") {
        toast.error(out.message);
        return;
      }
      if (out.kind === "redirect_to_provider") {
        window.location.assign(out.url);
        return;
      }
      if (out.kind === "oauth_redirecting") {
        // NextAuth already navigated to the identity provider; no result payload
        return;
      }
      toast.success("Welcome to Airkrit!");
      router.push(out.dest);
    } catch (error) {
      toast.error(
        (error as any)?.response?.data?.error?.message ||
        "Something went wrong. Please try again."
      );
    } finally {
      setIsOAuthLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password before submission
    if (!isPasswordValid(password)) {
      const passwordValidationErrors = validatePassword(password);
      const errorMessages = Object.values(passwordValidationErrors).filter(
        Boolean
      );
      toast.error(errorMessages.join(". "));
      setShowPasswordValidation(true);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      setPasswordErrors(
        (prev: PasswordValidationErrors & { confirmPassword?: string }) => ({
          ...prev,
          confirmPassword: "Passwords do not match",
        })
      );
      return;
    }

    try {
      setLoading(true);

      // Validate firstName before submission
      if (!firstName || firstName.trim() === "") {
        toast.error("First name is required");
        return;
      }
      
      const normalizedEmail = email.trim().toLowerCase();

      // First, try to register with the backend
      try {
        const response = await apiClient.post("/auth/register", {
          email: normalizedEmail,
          firstName: firstName.trim(),
          lastName: lastName?.trim() || "",
          password,
          confirmPassword,
          userType: "student",
          provider: "credentials",
        });

        if (response.status === 201) {
          toast.success("Registration successful!");

          // If registration succeeds, proceed with NextAuth signIn
          const result = await signIn("credentials", {
            email: normalizedEmail,
            password,
            redirect: false, // Don't redirect automatically
            callbackUrl: callbackUrl || "/dashboard",
          });

          if (result?.error) {
            toast.error(
              "Registration successful but login failed. Please try logging in manually."
            );
          } else if (result?.ok) {
            toast.success("Welcome to Airkrit!");
            const session = await awaitClientSessionAfterSignIn();
            if (session?.user) {
              const dest = getPostLoginRedirectPath(
                session.user as User,
                callbackUrl
              );
              router.push(dest);
            } else {
              router.push("/dashboard");
            }
          }
        } else {
          toast.error(
            (response.data as any)?.error?.message ||
            "Registration failed. Please try again."
          );
        }
      } catch (apiError: any) {
        // If API call fails, show the specific error message
        const errorMessage =
          apiError?.response?.data?.error?.message ||
          "Registration failed. Please try again.";
        toast.error(errorMessage);
        return;
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show loading overlay when OAuth is in progress
  if (isOAuthLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center relative">
        <div className="absolute inset-0 backdrop-blur-sm z-10"></div>
        <div className="relative z-20 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
          <p className="text-lg font-medium text-gray-700">
            Redirecting to authentication provider...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="header flex flex-col gap-2 mb-2 w-full">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-regular font-coolvetica text-center text-text-primary">
          Sign up for Free at Airkrit!
        </h1>
        <p className="text-sm sm:text-base font-regular text-center text-text-primary">
          Welcome! Enter your details to continue using Airkrit
        </p>
      </div>
      <form
        className="form w-full flex flex-col gap-3 sm:gap-4"
        onSubmit={handleSubmit}
      >
        <div className="email-input w-full flex gap-2 sm:gap-3 bg-white rounded-lg p-3 sm:p-3.5 border border-gray-300 focus-within:border-orange-400 transition-colors">
          <label htmlFor="email" className="text-sm text-gray-500 shrink-0">
            <Mail className="w-5 h-5" />
          </label>
          <input
            type="email"
            placeholder="Email"
            className="w-full bg-transparent outline-none font-semibold text-sm sm:text-base placeholder:font-normal"
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase())}
            autoCapitalize="none"
            required
          />
        </div>
        <div className="name-inputs w-full flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex gap-2 sm:gap-3 bg-white rounded-lg p-3 sm:p-3.5 border border-gray-300 focus-within:border-orange-400 transition-colors">
            <input
              type="text"
              placeholder="First Name"
              className="w-full bg-transparent outline-none font-semibold text-sm sm:text-base placeholder:font-normal"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="flex-1 flex gap-2 sm:gap-3 bg-white rounded-lg p-3 sm:p-3.5 border border-gray-300 focus-within:border-orange-400 transition-colors">
            <input
              type="text"
              placeholder="Last Name"
              className="w-full bg-transparent outline-none font-semibold text-sm sm:text-base placeholder:font-normal"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full">
          <div
            className={`password-input w-full flex gap-2 sm:gap-3 bg-white rounded-lg p-3 sm:p-3.5 border transition-colors ${showPasswordValidation && Object.keys(passwordErrors).length > 0
                ? "border-red-300"
                : showPasswordValidation && isPasswordValid(password)
                  ? "border-green-300"
                  : "border-gray-300 focus-within:border-orange-400"
              } relative`}
          >
            <label htmlFor="password" className="text-sm text-gray-500 shrink-0">
              <Lock className="w-5 h-5" />
            </label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full bg-transparent outline-none font-semibold text-sm sm:text-base pr-10 placeholder:font-normal"
              value={password}
              onChange={handlePasswordChange}
              onFocus={() => password && setShowPasswordValidation(true)}
              required
            />
            <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Real-time password validation feedback */}
          {showPasswordValidation && password && (
            <div className="mt-2 space-y-1.5">
              <div
                className={`flex items-center gap-2 text-xs ${checkPasswordRequirement("length")
                    ? "text-green-600"
                    : "text-gray-500"
                  }`}
              >
                {checkPasswordRequirement("length") ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <X className="w-3 h-3" />
                )}
                <span>At least 8 characters</span>
              </div>
              <div
                className={`flex items-center gap-2 text-xs ${checkPasswordRequirement("capital")
                    ? "text-green-600"
                    : "text-gray-500"
                  }`}
              >
                {checkPasswordRequirement("capital") ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <X className="w-3 h-3" />
                )}
                <span>At least one capital letter (A-Z)</span>
              </div>
              <div
                className={`flex items-center gap-2 text-xs ${checkPasswordRequirement("small")
                    ? "text-green-600"
                    : "text-gray-500"
                  }`}
              >
                {checkPasswordRequirement("small") ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <X className="w-3 h-3" />
                )}
                <span>At least one small letter (a-z)</span>
              </div>
              <div
                className={`flex items-center gap-2 text-xs ${checkPasswordRequirement("symbol")
                    ? "text-green-600"
                    : "text-gray-500"
                  }`}
              >
                {checkPasswordRequirement("symbol") ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <X className="w-3 h-3" />
                )}
                <span>At least one symbol (!@#$%^&*)</span>
              </div>
            </div>
          )}
        </div>
        <div className="w-full">
          <div
            className={`confirm-password-input w-full flex gap-2 sm:gap-3 bg-white rounded-lg p-3 sm:p-3.5 border transition-colors ${passwordErrors.confirmPassword
                ? "border-red-300"
                : confirmPassword && password === confirmPassword
                  ? "border-green-300"
                  : "border-gray-300 focus-within:border-orange-400"
              } relative`}
          >
            <label htmlFor="confirm-password" className="text-sm text-gray-500 shrink-0">
              <Lock className="w-5 h-5" />
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              className="w-full bg-transparent outline-none font-semibold text-sm sm:text-base pr-10 placeholder:font-normal"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              required
            />
            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {passwordErrors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">
              {passwordErrors.confirmPassword}
            </p>
          )}
        </div>
        <OrangeButton
          className="w-full mt-2 sm:mt-3 rounded-xl font-bold text-sm sm:text-base py-3"
          type="submit"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </OrangeButton>
      </form>
      <div className="breaker w-full flex items-center justify-center gap-3 sm:gap-4 my-3 sm:my-4">
        <div className="flex-1 h-[3px] sm:h-[4px] bg-gray-200 max-w-[100px]"></div>
        <span className="text-sm sm:text-base text-gray-500 uppercase whitespace-nowrap font-medium">
          OR
        </span>
        <div className="flex-1 h-[3px] sm:h-[4px] bg-gray-200 max-w-[100px]"></div>
      </div>
      <div className="oauth-buttons w-full flex flex-col items-center justify-center gap-3 sm:gap-4">
        <WhiteButton
          className="w-full flex items-center justify-center gap-2 rounded-xl font-bold text-sm sm:text-base py-3 shadow-[inset_0_-2px_7px_0_rgba(183,159,255,0.22)]"
          onClick={() => handleOAuthSignIn("google")}
          disabled={isOAuthLoading}
        >
          <Image
            src="/google-icon.svg"
            alt="Google"
            width={20}
            height={20}
            className="w-4 h-4 sm:w-5 sm:h-5"
          />
          <span>
            {isOAuthLoading ? "Signing up..." : "Sign Up using Google"}
          </span>
        </WhiteButton>
        <WhiteButton
          className="w-full flex items-center justify-center gap-2 rounded-xl font-bold text-sm sm:text-base py-3 shadow-[inset_0_-2px_7px_0_rgba(183,159,255,0.22)]"
          onClick={() => handleOAuthSignIn("linkedin")}
          disabled={isOAuthLoading}
        >
          <Image
            src="/linkedin-icon.svg"
            alt="LinkedIn"
            width={20}
            height={20}
            className="w-4 h-4 sm:w-5 sm:h-5"
          />
          <span>
            {isOAuthLoading ? "Signing up..." : "Sign Up using LinkedIn"}
          </span>
        </WhiteButton>
      </div>
      <p className="text-xs sm:text-sm text-gray-500 text-center font-bold self-center mt-2">
        Already have an account?{" "}
        <Link href="/login" className="text-orange-500 font-bold hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
};

export default RegisterPage;
