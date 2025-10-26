import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Playwrite_US_Trad } from "next/font/google";

const playwrite = Playwrite_US_Trad({
  weight: ["400"],
});

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full h-dvh flex gap-8 p-4 bg-[#F3F3F3]">
      <div className="w-1/2 hidden lg:block h-full relative bg-linear-to-br from-orange-500 to-black rounded-3xl">
        <div className="absolute top-6 left-6 bg-white rounded-2xl p-3 flex items-center justify-center">
          <Link href="/">
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
          </Link>
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
          <p className={`text-xl text-white ${playwrite.className}`}>
            Over 500+ amazing teachers!
          </p>
          <p className="text-white text-6xl font-normal font-coolvetica text-balance">
            Your Learning Journey Starts Here!
          </p>
          <p className="text-white/70 text-xl font-semibold text-balance">
            Airkrit is an amazing course and intership provider helps you grow a
            lot.{" "}
          </p>
        </div>
      </div>
      <div className="w-full lg:w-1/2 h-full rounded-3xl shrink-0 flex justify-center items-center">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
