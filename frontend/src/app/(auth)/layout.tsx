"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState, useCallback } from "react";
import { Playwrite_US_Trad } from "next/font/google";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import {
  useAuthenticationMedia,
  AuthenticationMedia,
} from "@/hooks/useAuthenticationMedia";

const playwrite = Playwrite_US_Trad({
  weight: ["400"],
});

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const { getAllAuthenticationMedia } = useAuthenticationMedia();
  const [mediaList, setMediaList] = useState<AuthenticationMedia[]>([]);

  // Create autoplay plugin instance
  const autoplayPlugin = React.useMemo(
    () =>
      Autoplay({
        delay: 3000,
        stopOnInteraction: false,
        stopOnMouseEnter: false,
      }),
    []
  );

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    autoplayPlugin,
  ]);

  // Load authentication media
  useEffect(() => {
    const loadMedia = async () => {
      const result = await getAllAuthenticationMedia(1, 100);
      if (result && result.media && result.media.length > 0) {
        // Sort by order
        const sortedMedia = [...result.media].sort((a, b) => a.order - b.order);
        setMediaList(sortedMedia);
      }
    };
    loadMedia();
  }, [getAllAuthenticationMedia]);

  // Reinitialize carousel when media list changes and ensure autoplay works
  useEffect(() => {
    if (emblaApi && mediaList.length > 0) {
      emblaApi.reInit();
      // Restart autoplay after reinitialization
      const autoplay = emblaApi.plugins().autoplay;
      if (autoplay) {
        autoplay.play();
      }
    }
  }, [emblaApi, mediaList]);

  // Handle image click (if link is provided)
  const handleImageClick = useCallback((media: AuthenticationMedia) => {
    if (media.link) {
      window.open(media.link, "_blank", "noopener,noreferrer");
    }
  }, []);

  return (
    <div className="w-full h-dvh flex gap-8 p-4 bg-[#F3F3F3]">
      <div className="w-1/2 hidden lg:block h-full relative bg-linear-to-br from-orange-500 to-black rounded-3xl overflow-hidden">
        <div className="absolute top-6 left-6 bg-white rounded-2xl p-3 flex items-center justify-center z-20">
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

        {/* Carousel Container */}
        <div className="w-full h-full relative">
          {mediaList.length > 0 ? (
            <div className="embla w-full h-full overflow-hidden rounded-3xl">
              <div
                className="embla__viewport w-full h-full overflow-hidden"
                ref={emblaRef}
              >
                <div className="embla__container w-full h-full flex">
                  {mediaList.map((media) => (
                    <div
                      key={media._id}
                      className="embla__slide flex-[0_0_100%] min-w-0 relative w-full h-full"
                    >
                      <div
                        className={`w-full h-full relative ${
                          media.link ? "cursor-pointer" : ""
                        }`}
                        onClick={() => handleImageClick(media)}
                      >
                        <Image
                          src={media.imageUrl}
                          alt="Authentication Banner"
                          fill
                          className="object-cover object-center select-none rounded-3xl"
                          priority={media.order === 0}
                          quality={100}
                          unoptimized
                          draggable={false}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Fallback to original image if no media
            <Image
              src="/AuthenticationBanner.svg"
              alt="Authentication Page Banner"
              fill
              className="object-cover object-center select-none"
              priority
              quality={100}
              unoptimized
              draggable={false}
            />
          )}

          {/* Black overlay with less opacity */}
          <div className="absolute inset-0 bg-black/30 rounded-3xl pointer-events-none" />
        </div>

        <div className="absolute bottom-6 left-6 w-2/3 flex flex-col gap-2 z-10">
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
