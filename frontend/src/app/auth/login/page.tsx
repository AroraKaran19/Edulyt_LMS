"use client";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { Eye, Lock, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";

const LoginPage = () => {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    console.log("Session status:", session);
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.status === 200) {
        router.push("/dashboard");
      } else {
        setError(res?.error as string);
      }
    } catch (error) {
      if (isAxiosError(error)) {
        setError(error.response?.data.message as string);
      } else {
        setError("Something went wrong. Please try again.");
        console.log("Login error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Prevent hydration mismatch by not rendering form until client-side
  if (!isClient) {
    return (
      <>
        <div className="header flex flex-col gap-2 mb-2">
          <h1 className="text-3xl lg:text-4xl font-regular font-coolvetica text-center lg:text-start text-text-primary">
            Sign up for Free at Edulyt!
          </h1>
          <p className="text-base font-regular text-center lg:text-start text-text-primary">
            Welcome back! Enter your details to continue using Edulyt
          </p>
        </div>
        <div className="form w-full max-w-lg flex flex-col gap-4 lg:max-w-full">
          <div className="email-input w-full flex gap-3 bg-white rounded-md p-3 border border-gray-300">
            <label htmlFor="email" className="text-sm text-gray-500">
              <Mail className="w-full h-full" />
            </label>
            <input
              type="email"
              placeholder="Email"
              className="w-full bg-transparent outline-none font-bold"
              disabled
            />
          </div>
          <div className="password-input w-full flex gap-3 bg-white rounded-md p-3 border border-gray-300 relative">
            <label htmlFor="password" className="text-sm text-gray-500">
              <Lock className="w-full h-full" />
            </label>
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-transparent outline-none font-bold"
              disabled
            />
            <Eye className="size-4 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
          <OrangeButton 
            type="button"
            className="w-full mt-1 lg:mt-2 rounded-xl font-bold"
            disabled
          >
            Login
          </OrangeButton>
        </div>
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
            disabled
          >
            <Image
              src="/google-icon.svg"
              alt="Google"
              width={20}
              height={20}
              className="size-4"
            />
            <span>Sign In using Google</span>
          </WhiteButton>
          <WhiteButton
            className="w-full flex items-center justify-center gap-2 rounded-xl font-bold shadow-[inset_0_-2px_7px_0_rgba(183,159,255,0.22)]"
            disabled
          >
            <Image
              src="/linkedin-icon.svg"
              alt="LinkedIn"
              width={20}
              height={20}
              className="size-4"
            />
            <span>Sign In using LinkedIn</span>
          </WhiteButton>
        </div>
        <p className="text-sm text-gray-500 text-center font-bold self-center">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-orange-500 font-bold">
            Sign up
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <div className="header flex flex-col gap-2 mb-2">
        <h1 className="text-3xl lg:text-4xl font-regular font-coolvetica text-center lg:text-start text-text-primary">
          Sign up for Free at Edulyt!
        </h1>
        <p className="text-base font-regular text-center lg:text-start text-text-primary">
          Welcome back! Enter your details to continue using Edulyt
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
            suppressHydrationWarning
          />
        </div>
        <div className="password-input w-full flex gap-3 bg-white rounded-md p-3 border border-gray-300 relative">
          <label htmlFor="password" className="text-sm text-gray-500">
            <Lock className="w-full h-full" />
          </label>
          <input
            type="password"
            placeholder="Password"
            className="w-full bg-transparent outline-none font-bold"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            suppressHydrationWarning
          />
          <Eye className="size-4 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
        {error && <div className="text-red-500 text-sm font-bold">{error}</div>}
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
          onClick={() => signIn("google")}
        >
          <Image
            src="/google-icon.svg"
            alt="Google"
            width={20}
            height={20}
            className="size-4"
          />
          <span>Sign In using Google</span>
        </WhiteButton>
        <WhiteButton
          className="w-full flex items-center justify-center gap-2 rounded-xl font-bold shadow-[inset_0_-2px_7px_0_rgba(183,159,255,0.22)]"
          onClick={() => signIn("linkedin")}
        >
          <Image
            src="/linkedin-icon.svg"
            alt="LinkedIn"
            width={20}
            height={20}
            className="size-4"
          />
          <span>Sign In using LinkedIn</span>
        </WhiteButton>
      </div>
      <p className="text-sm text-gray-500 text-center font-bold self-center">
        Don&apos;t have an account?{" "}
        <Link href="/auth/register" className="text-orange-500 font-bold">
          Sign up
        </Link>
      </p>
    </>
  );
};

export default LoginPage;
