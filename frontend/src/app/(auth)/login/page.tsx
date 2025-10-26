"use client";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { signIn } from "next-auth/react";
import apiClient from "@/configs/apiConfig";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get callbackUrl from URL parameters, default to /dashboard
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const handleOAuthSignIn = async (provider: string) => {
    setIsOAuthLoading(true);
    try {
      const result = await signIn(provider, {
        callbackUrl,
        redirect: true,
      });
      if (result?.error) {
        toast.error(result?.error as string);
      } else if (result?.ok) {
        toast.success("Login successful!");
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Use NextAuth's credentials provider directly
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false, // Don't redirect automatically
        callbackUrl,
      });

      if (result?.error) {
        toast.error(
          "Invalid credentials. Please check your email and password."
        );
      } else if (result?.ok) {
        toast.success("Login successful!");
        router.push(callbackUrl);
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
            Redirecting to {isOAuthLoading ? "authentication provider" : ""}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="header flex flex-col gap-2 mb-2">
        <h1 className="text-3xl lg:text-4xl font-regular font-coolvetica text-center lg:text-start text-text-primary">
          Sign up for Free at Airkrit!
        </h1>
        <p className="text-base font-regular text-center lg:text-start text-text-primary">
          Welcome back! Enter your details to continue using Airkrit
        </p>
      </div>
      <form
        className="form w-full max-w-lg flex flex-col gap-4 lg:max-w-full"
        onSubmit={handleLogin}
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
            suppressHydrationWarning
          />
        </div>
        <div className="password-input w-full flex gap-3 bg-white rounded-md p-3 border border-gray-300 relative">
          <label htmlFor="password" className="text-sm text-gray-500">
            <Lock className="w-full h-full" />
          </label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full bg-transparent outline-none font-bold"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            suppressHydrationWarning
          />
          {showPassword ? (
            <Eye
              className="size-4 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            />
          ) : (
            <EyeOff
              className="size-4 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            />
          )}
        </div>
        <OrangeButton
          type="submit"
          className="w-full mt-1 lg:mt-2 rounded-xl font-bold"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
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
          disabled={isOAuthLoading}
          onClick={() => handleOAuthSignIn("google")}
        >
          <Image
            src="/google-icon.svg"
            alt="Google"
            width={20}
            height={20}
            className="size-4"
          />
          <span>
            {isOAuthLoading ? "Signing in..." : "Sign In using Google"}
          </span>
        </WhiteButton>
        <WhiteButton
          className="w-full flex items-center justify-center gap-2 rounded-xl font-bold shadow-[inset_0_-2px_7px_0_rgba(183,159,255,0.22)]"
          disabled={isOAuthLoading}
          onClick={() => handleOAuthSignIn("linkedin")}
        >
          <Image
            src="/linkedin-icon.svg"
            alt="LinkedIn"
            width={20}
            height={20}
            className="size-4"
          />
          <span>
            {isOAuthLoading ? "Signing in..." : "Sign In using LinkedIn"}
          </span>
        </WhiteButton>
      </div>
      <p className="text-sm text-gray-500 text-center font-bold self-center">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-orange-500 font-bold">
          Sign up
        </Link>
      </p>
    </>
  );
};

export default LoginPage;
