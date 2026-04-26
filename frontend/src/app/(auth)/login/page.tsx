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
import { showLoginErrorToast } from "@/lib/showLoginErrorToast";
import { awaitClientSessionAfterSignIn } from "@/lib/awaitClientSession";
import { signInWithOAuthProvider } from "@/lib/oauthSignInClient";
import { getPostLoginRedirectPath } from "@/lib/postLoginRedirect";
import type { User } from "@/types/user";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get callbackUrl from URL parameters (may be absent → role-based default)
  const callbackUrl = searchParams.get("callbackUrl") || undefined;

  const handleOAuthSignIn = async (provider: string) => {
    setIsOAuthLoading(true);
    try {
      const out = await signInWithOAuthProvider(provider, callbackUrl);
      if (out.kind === "error") {
        showLoginErrorToast(out.message);
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
      toast.success("Login successful!");
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Use NextAuth's credentials provider directly
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false, // Don't redirect automatically
        callbackUrl: callbackUrl || "/dashboard",
      });

      if (result?.error) {
        showLoginErrorToast(result.error);
      } else if (result?.ok) {
        toast.success("Login successful!");
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
      <div className="header flex flex-col gap-2 mb-2 w-full">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-regular font-coolvetica text-center text-text-primary">
          Login to your Airkrit account
        </h1>
        <p className="text-sm sm:text-base font-regular text-center text-text-primary">
          Welcome back! Enter your details to continue using Airkrit
        </p>
      </div>
      <form
        className="form w-full flex flex-col gap-3 sm:gap-4"
        onSubmit={handleLogin}
      >
        <div className="email-input w-full flex gap-2 sm:gap-3 bg-white rounded-lg p-3 sm:p-3.5 border border-gray-300 focus-within:border-orange-400 transition-colors">
          <label htmlFor="email" className="text-sm text-gray-500 flex-shrink-0">
            <Mail className="w-5 h-5" />
          </label>
          <input
            type="email"
            placeholder="Email"
            className="w-full bg-transparent outline-none font-semibold text-sm sm:text-base placeholder:font-normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            suppressHydrationWarning
          />
        </div>
        <div className="password-input w-full flex gap-2 sm:gap-3 bg-white rounded-lg p-3 sm:p-3.5 border border-gray-300 focus-within:border-orange-400 transition-colors relative">
          <label htmlFor="password" className="text-sm text-gray-500 flex-shrink-0">
            <Lock className="w-5 h-5" />
          </label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full bg-transparent outline-none font-semibold text-sm sm:text-base pr-10 placeholder:font-normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            suppressHydrationWarning
          />
          {showPassword ? (
            <Eye
              className="w-4 h-4 absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            />
          ) : (
            <EyeOff
              className="w-4 h-4 absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            />
          )}
        </div>
        <OrangeButton
          type="submit"
          className="w-full mt-2 sm:mt-3 rounded-xl font-bold text-sm sm:text-base py-3"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
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
          disabled={isOAuthLoading}
          onClick={() => handleOAuthSignIn("google")}
        >
          <Image
            src="/google-icon.svg"
            alt="Google"
            width={20}
            height={20}
            className="w-4 h-4 sm:w-5 sm:h-5"
          />
          <span>
            {isOAuthLoading ? "Signing in..." : "Sign In using Google"}
          </span>
        </WhiteButton>
        <WhiteButton
          className="w-full flex items-center justify-center gap-2 rounded-xl font-bold text-sm sm:text-base py-3 shadow-[inset_0_-2px_7px_0_rgba(183,159,255,0.22)]"
          disabled={isOAuthLoading}
          onClick={() => handleOAuthSignIn("linkedin")}
        >
          <Image
            src="/linkedin-icon.svg"
            alt="LinkedIn"
            width={20}
            height={20}
            className="w-4 h-4 sm:w-5 sm:h-5"
          />
          <span>
            {isOAuthLoading ? "Signing in..." : "Sign In using LinkedIn"}
          </span>
        </WhiteButton>
      </div>
      <p className="text-xs sm:text-sm text-gray-500 text-center font-bold self-center mt-2">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-orange-500 font-bold hover:underline">
          Sign up
        </Link>
      </p>
      <span className="text-xs sm:text-sm text-gray-500 text-center font-bold self-center">
        <Link href="/forgot-password" className="text-orange-500 font-bold hover:underline">
          Forgot password?
        </Link>
      </span>
    </>
  );
};

export default LoginPage;
