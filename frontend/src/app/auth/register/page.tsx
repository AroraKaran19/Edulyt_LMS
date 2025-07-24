"use client";
import OrangeButton from "@/components/ui/OrangeButton";
import WhiteButton from "@/components/ui/WhiteButton";
import { Eye, Lock, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

// export async function generateMetadata() {
//   return {
//     title: "Create Your Edulyt Account | Edulyt",
//     description:
//       "Create a new Edulyt account to start exploring educational courses",
//     keywords: ["sign up", "edulyt", "education", "courses", "learning"],
//   };
// }

const RegisterPage = () => {
  // const { data: session, status } = useSession();
  const session = true;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      console.log("Session credentials:", session);
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      // Replace with your real registration API endpoint
      const res = await fetch("https://your-api.com/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      console.log("Register response:", data);
      if (!res.ok) {
        setError(data.message || "Registration failed");
        setLoading(false);
        return;
      }
      // Auto-login after registration
      const loginRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      console.log("Login after register response:", loginRes);
      if (loginRes && loginRes.error) {
        setError(loginRes.error);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page h-full lg:h-auto w-full lg:max-w-3xl flex flex-col gap-4 px-8 my-auto justify-center items-center lg:items-start lg:justify-start">
      <div className="header flex flex-col gap-2 mb-2">
        <h1 className="text-3xl lg:text-4xl font-regular font-coolvetica text-center lg:text-start text-text-primary">
          Sign up for Free at Edulyt!
        </h1>
        <p className="text-base font-regular text-center lg:text-start text-text-primary">
          Welcome! Enter your details to continue using Edulyt
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
            type="password"
            placeholder="Password"
            className="w-full bg-transparent outline-none font-bold"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Eye className="size-4 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
        <div className="confirm-password-input w-full flex gap-3 bg-white rounded-md p-3 border border-gray-300 relative">
          <label htmlFor="confirm-password" className="text-sm text-gray-500">
            <Lock className="w-full h-full" />
          </label>
          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full bg-transparent outline-none font-bold"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <Eye className="size-4 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
        {error && <div className="text-red-500 text-sm font-bold">{error}</div>}
        <OrangeButton className="w-full mt-1 lg:mt-2 rounded-xl font-bold">
          <button
            type="submit"
            className="w-full bg-transparent outline-none font-bold"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
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
          <span>Sign Up using Google</span>
        </WhiteButton>
        <WhiteButton className="w-full flex items-center justify-center gap-2 rounded-xl font-bold shadow-[inset_0_-2px_7px_0_rgba(183,159,255,0.22)]">
          <Image
            src="/linkedin-icon.svg"
            alt="LinkedIn"
            width={20}
            height={20}
            className="size-4"
          />
          <span>Sign Up using LinkedIn</span>
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
