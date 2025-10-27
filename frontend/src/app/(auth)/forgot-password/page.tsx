"use client";

import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "react-toastify";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setLoading(true);

      // TODO: Replace with actual API call to backend
      // const response = await apiClient.post("/auth/forgot-password", { email });

      // Simulate API call for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Password reset link has been sent to your email!");
      setEmail("");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Link
          href="/login"
          className="flex items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
      </div>

      <div className="header flex flex-col gap-2 mb-8">
        <h1 className="text-3xl lg:text-4xl font-regular font-coolvetica text-center lg:text-start text-text-primary">
          Forgot Password?
        </h1>
        <p className="text-base font-regular text-center lg:text-start text-text-primary">
          No worries! Enter your email and we'll send you a reset link.
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

        <OrangeButton
          type="submit"
          className="w-full mt-1 lg:mt-2 rounded-xl font-bold"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </OrangeButton>
      </form>

      <div className="flex items-center justify-center gap-2 mt-6">
        <p className="text-sm text-gray-500 font-bold">
          Remember your password?{" "}
          <Link href="/login" className="text-orange-500 font-bold">
            Sign In
          </Link>
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 mt-4">
        <p className="text-sm text-gray-500 font-bold">
          Don't have an account?{" "}
          <Link href="/register" className="text-orange-500 font-bold">
            Sign up
          </Link>
        </p>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
