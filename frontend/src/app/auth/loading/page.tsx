"use client";

import React from "react";
import { FullScreenLoader } from "@/components/ui/Loader";
import Image from "next/image";

const AuthLoadingPage = () => {
  return (
    <div className="w-full h-[100dvh] flex gap-8 p-4 bg-[#F3F3F3]">
      {/* Left side - same as auth layout */}
      <div className="w-1/2 hidden lg:block h-full relative bg-gradient-to-br from-orange-500 to-black rounded-3xl">
        <div className="absolute top-6 left-6 bg-white rounded-2xl p-3 flex items-center justify-center">
          <Image
            src="/logo.svg"
            alt="Airkrit Logo"
            width={100}
            height={100}
            className="w-[200px] object-contain select-none"
            priority
            quality={100}
            loading="eager"
            unoptimized
            draggable={false}
          />
        </div>
        <Image
          src="/AuthenticationBanner.svg"
          alt="Authentication Page Banner"
          width={500}
          height={500}
          className="w-full h-full object-cover object-center rounded-3xl select-none"
          priority
          quality={100}
          loading="eager"
          unoptimized
          draggable={false}
        />
        <div className="absolute bottom-6 left-6 w-2/3 flex flex-col gap-2">
          <p className="text-xl text-white font-playwrite">Over 500+ amazing teachers!</p>
          <p className="text-white text-6xl font-normal font-coolvetica text-balance">Your Learning Journey Starts Here!</p>
          <p className="text-white/70 text-xl font-semibold text-balance">Airkrit is an amazing course and intership provider helps you grow a lot.</p>
        </div>
      </div>

      {/* Right side - loading content */}
      <div className="w-full lg:w-1/2 h-full rounded-3xl flex-shrink-0 flex justify-center items-center">
        <div className="w-full max-w-lg lg:max-w-full flex flex-col items-center justify-center gap-6">
          <div className="text-center">
            <h1 className="text-3xl lg:text-4xl font-regular font-coolvetica text-text-primary mb-2">
              Authenticating...
            </h1>
            <p className="text-base font-regular text-text-primary">
              Please wait while we verify your credentials
            </p>
          </div>
          
          <FullScreenLoader 
            text="Verifying your account"
            variant="spinner"
            size="lg"
          />
          
          <div className="text-center text-sm text-gray-500">
            <p>This may take a few moments</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLoadingPage;
