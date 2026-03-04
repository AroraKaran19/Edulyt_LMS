"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";
import ImageComponent from "@/components/ui/ImageComponent";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import NotFoundMeta from "@/components/ui/NotFoundMeta";

export default function NotFound() {
  const router = useRouter();

  return (
    <>
      <NotFoundMeta />
      <main
        className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-[#F3F3F3]"
        role="main"
        aria-label="Page not found"
      >
        <div className="max-w-2xl mx-auto text-center">
          {/* Logo */}
          <Link
            href="/"
            className="inline-block mb-8"
            aria-label="Airkrit home"
          >
            <ImageComponent
              src="/logo.svg"
              alt="Airkrit - Education to Employment"
              width={160}
              height={48}
              className="object-contain select-none"
            />
          </Link>

          {/* 404 */}
          <p
            className="text-7xl sm:text-8xl lg:text-9xl font-bold font-coolvetica text-[#F77124]/20 select-none mb-6"
            aria-hidden
          >
            404
          </p>

          {/* Content */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-coolvetica text-[#1D2939] mb-4">
            Page Not Found
          </h1>

          <p className="text-base sm:text-lg text-[#475467] max-w-md mx-auto leading-relaxed mb-8">
            The page you&apos;re looking for doesn&apos;t exist or may have been
            moved. Let&apos;s get you back on track.
          </p>

          {/* Action Buttons */}
          <nav
            className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center"
            aria-label="Navigation options"
          >
            <OrangeButton
              onClick={() => router.push("/")}
              className="flex items-center gap-2 justify-center w-full sm:w-[160px] sm:min-w-[160px] h-12"
            >
              <Home className="size-4 shrink-0" aria-hidden />
              Go Home
            </OrangeButton>

            <WhiteButton
              onClick={() => router.back()}
              className="flex items-center gap-2 justify-center w-full sm:w-[160px] sm:min-w-[160px] h-12 px-6! py-3!"
            >
              <ArrowLeft className="size-4 shrink-0" aria-hidden />
              Go Back
            </WhiteButton>
          </nav>
        </div>
      </main>
    </>
  );
}
