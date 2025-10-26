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
import { useSearchParams } from "next/navigation";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const searchParams = useSearchParams();

  // Get callbackUrl from URL parameters, default to /dashboard
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleOAuthSignIn = async (provider: string) => {
    setIsOAuthLoading(true);
    try {
      const result = await signIn(provider, {
        callbackUrl,
        redirect: false, // Don't redirect automatically
      });
      if (result?.error) {
        toast.error(result?.error as string);
      } else if (result?.ok) {
        toast.success("Welcome to Airkrit!");
        // Redirect manually after successful signup
        window.location.href = callbackUrl;
      }
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
    try {
      setLoading(true);

      // First, try to register with the backend
      try {
        const response = await apiClient.post("/auth/register", {
          email,
          password,
          confirmPassword,
          userType: "student",
          provider: "credentials",
        });

        if (response.status === 201) {
          toast.success("Registration successful!");

          // If registration succeeds, proceed with NextAuth signIn
          const result = await signIn("credentials", {
            email,
            password,
            redirect: false, // Don't redirect automatically
            callbackUrl,
          });

          if (result?.error) {
            toast.error(
              "Registration successful but login failed. Please try logging in manually."
            );
          } else if (result?.ok) {
            toast.success("Welcome to Airkrit!");
            // Redirect manually after successful signup and login
            window.location.href = callbackUrl;
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
    <div className="login-page h-full lg:h-auto w-full lg:max-w-3xl flex flex-col gap-4 px-8 my-auto justify-center items-center lg:items-start lg:justify-start">
      <div className="header flex flex-col gap-2 mb-2">
        <h1 className="text-3xl lg:text-4xl font-regular font-coolvetica text-center lg:text-start text-text-primary">
          Sign up for Free at Airkrit!
        </h1>
        <p className="text-base font-regular text-center lg:text-start text-text-primary">
          Welcome! Enter your details to continue using Airkrit
        </p>
      </div>
      <form
        className="form w-full max-w-lg flex flex-col gap-4 lg:max-w-full"
        onSubmit={handleSubmit}
      >
        <div className="email-input w-full flex gap-3 bg-white rounded-md p-3 border border-gray-300">
          <label htmlFor="email" className="text-sm text-gray-500">
            <Mail className="w-full h-full" />
          </label>
          <input
            type="email"
            placeholder="Email"
            className="w-full bg-transparent outline-none font-bold"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="password-input w-full flex gap-3 bg-white rounded-md p-3 border border-gray-300 relative">
          <label htmlFor="password" className="text-sm text-gray-500">
            <Lock className="w-full h-full" />
          </label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full bg-transparent outline-none font-bold pr-20"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              type="button"
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
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
        <div className="confirm-password-input w-full flex gap-3 bg-white rounded-md p-3 border border-gray-300 relative">
          <label htmlFor="confirm-password" className="text-sm text-gray-500">
            <Lock className="w-full h-full" />
          </label>
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            className="w-full bg-transparent outline-none font-bold pr-10"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={toggleConfirmPasswordVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showConfirmPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        <OrangeButton
          className="w-full mt-1 lg:mt-2 rounded-xl font-bold"
          type="submit"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </OrangeButton>
      </form>
      <div className="breaker w-full flex items-center justify-center gap-4 my-4">
        <div className="w-1/4 h-[4px] bg-gray-200"></div>
        <span className="text-base text-gray-500 uppercase whitespace-nowrap">
          OR
        </span>
        <div className="w-1/4 h-[4px] bg-gray-200"></div>
      </div>
      <div className="oauth-buttons w-full max-w-lg lg:max-w-full flex flex-col items-center justify-center gap-6">
        <WhiteButton
          className="w-full flex items-center justify-center gap-2 rounded-xl font-bold shadow-[inset_0_-2px_7px_0_rgba(183,159,255,0.22)]"
          onClick={() => handleOAuthSignIn("google")}
          disabled={isOAuthLoading}
        >
          <Image
            src="/google-icon.svg"
            alt="Google"
            width={20}
            height={20}
            className="size-4"
          />
          <span>
            {isOAuthLoading ? "Signing up..." : "Sign Up using Google"}
          </span>
        </WhiteButton>
        <WhiteButton
          className="w-full flex items-center justify-center gap-2 rounded-xl font-bold shadow-[inset_0_-2px_7px_0_rgba(183,159,255,0.22)]"
          onClick={() => handleOAuthSignIn("linkedin")}
          disabled={isOAuthLoading}
        >
          <Image
            src="/linkedin-icon.svg"
            alt="LinkedIn"
            width={20}
            height={20}
            className="size-4"
          />
          <span>
            {isOAuthLoading ? "Signing up..." : "Sign Up using LinkedIn"}
          </span>
        </WhiteButton>
      </div>
      <p className="text-sm text-gray-500 text-center font-bold self-center">
        Already have an account?{" "}
        <Link href="/login" className="text-orange-500 font-bold">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
