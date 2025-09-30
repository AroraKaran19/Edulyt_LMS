"use client";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios, { isAxiosError } from "axios";

const RegisterPage = () => {
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status]);

  const handleOAuthSignIn = async (provider: string) => {
    setIsOAuthLoading(true);
    try {
      await signIn(provider, { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("OAuth sign in error:", error);
      setIsOAuthLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/register`,
        {
          email,
          password,
          confirmPassword,
        }
      );
      if (res.status === 201) {
        if (!res.data.success) {
          setError(res.data.message);
          return;
        }
        // Auto-login the user after successful registration
        const signInResult = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (signInResult?.ok) {
          router.push("/dashboard");
        } else {
          // If auto-login fails, redirect to login page
          router.push("/auth/login");
        }
      } else {
        setError(res.data.message);
      }
    } catch (error) {
      if (isAxiosError(error)) {
        setError(error.response?.data.message as string);
      } else {
        setError("Something went wrong. Please try again.");
      }
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
          <p className="text-lg font-medium text-gray-700">Redirecting to authentication provider...</p>
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
            className="w-full bg-transparent outline-none font-bold"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {showPassword ?
            <Eye className="size-4 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => setShowPassword(!showPassword)} />
            : <EyeOff className="size-4 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => setShowPassword(!showPassword)} />
          }
        </div>
        <div className="confirm-password-input w-full flex gap-3 bg-white rounded-md p-3 border border-gray-300 relative">
          <label htmlFor="confirm-password" className="text-sm text-gray-500">
            <Lock className="w-full h-full" />
          </label>
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            className="w-full bg-transparent outline-none font-bold"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {showConfirmPassword
            ? <Eye className="size-4 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => setShowConfirmPassword(!showConfirmPassword)} />
            : <EyeOff className="size-4 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => setShowConfirmPassword(!showConfirmPassword)} />
          }
        </div>
        {error && <div className="text-red-500 text-sm font-bold">{error}</div>}
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
          <span>{isOAuthLoading ? "Signing up..." : "Sign Up using Google"}</span>
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
          <span>{isOAuthLoading ? "Signing up..." : "Sign Up using LinkedIn"}</span>
        </WhiteButton>
      </div>
      <p className="text-sm text-gray-500 text-center font-bold self-center">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-orange-500 font-bold">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
