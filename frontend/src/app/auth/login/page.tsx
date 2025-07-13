import OrangeButton from "@/components/ui/OrangeButton";
import WhiteButton from "@/components/ui/WhiteButton";
import { Eye, Lock, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export async function generateMetadata() {
  return {
    title: 'Sign In to Your Account | Edulyt',
    description: 'Sign in to your Edulyt account to get access to educational courses',
    keywords: ['sign in', 'edulyt', 'education', 'courses', 'learning'],
  };
}

const LoginPage = () => {
  return (
    <div className="login-page h-full lg:h-auto w-full lg:max-w-3xl flex flex-col gap-4 px-8 my-auto justify-center items-center lg:items-start lg:justify-start">
      <div className="header flex flex-col gap-2 mb-2">
        <h1 className="text-3xl lg:text-4xl font-regular font-coolvetica text-center lg:text-start text-[#2B1508]">
          Sign up for Free at Edulyt!
        </h1>
        <p className="text-base font-regular text-center lg:text-start text-[#2B1508]">
          Welcome back! Enter your details to continue using Edulyt
        </p>
      </div>
      <form className="form w-full max-w-lg flex flex-col gap-4 lg:max-w-full">
        <div className="email-input w-full flex gap-3 bg-white rounded-md p-3 border border-gray-300">
          <label htmlFor="email" className="text-sm text-gray-500">
            <Mail className="w-full h-full" />
          </label>
          <input
            type="email"
            placeholder="Email"
            className="w-full bg-transparent outline-none font-bold"
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
          />
          <Eye className="size-4 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
        <OrangeButton className="w-full mt-1 lg:mt-2 rounded-xl font-bold">
          Login
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
        <WhiteButton className="w-full flex items-center justify-center gap-2 rounded-xl font-bold shadow-[inset_0_-2px_7px_0_rgb(183,159,255,0.22)]">
          <Image
            src="/google-icon.svg"
            alt="Google"
            width={20}
            height={20}
            className="size-4"
          />
          <span>Sign In using Google</span>
        </WhiteButton>
        <WhiteButton className="w-full flex items-center justify-center gap-2 rounded-xl font-bold shadow-[inset_0_-2px_7px_0_rgb(183,159,255,0.22)]">
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
    </div>
  );
};

export default LoginPage;
