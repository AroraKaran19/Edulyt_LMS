"use client";

import Image from "next/image";
import { TrendingUp, Globe, Wrench, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: Globe,
    title: "Learn",
    description:
      "Master concepts through structured courses designed by industry experts. Follow a clear roadmap instead of random tutorials.",
  },
  {
    icon: Wrench,
    title: "Build",
    description:
      "Work on real-world projects using real data. Gain hands-on experience that companies actually value.",
  },
  {
    icon: Rocket,
    title: "Launch",
    description:
      "Get internship opportunities, career guidance, and placement support to confidently step into your dream role.",
  },
] as const;

const TRAINING_IMAGE =
  "/assets/Rectangle 4570.png";

export default function TrainingSection() {
  return (
    <section
      className="relative px-4 sm:px-10 lg:px-40 mt-8 sm:mt-12 sm:py-10 "
      aria-label="What makes our training different"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 xl:gap-12 items-center">
        {/* Left: Title + timeline steps */}
        <div className="max-w-full sm:max-w-xl">
          {/* Header: icon + "What Makes Our Training Different?" */}
          <div className="flex items-center relative gap-4 -translate-x-6 sm:-translate-x-22">
            <span
              className="flex shrink-0 items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#F77124] text-white shadow-lg "
              aria-hidden
            >
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <h2 className="text-base sm:text-xl md:text-lg relative md:left-8 font-semibold text-gray-800">
              What Makes Our Training Different?
            </h2>
          </div>

          {/* Main heading with orange highlights */}
          <div className="flex flex-col gap-1 mt-6 sm:mt-10 mb-6 sm:mb-8">
            <h3 className={cn("text-base sm:text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight", "font-coolvetica whitespace-normal sm:whitespace-nowrap")}>
              A{" "}
              <span className="text-[#F77124]">Career-Focused Learning</span>{" "}
              Model to Make You <br /> <span className="text-[#F77124] ">Job-Ready</span>
            </h3>
          </div>

          {/* Vertical timeline steps */}
          <div className="space-y-4 sm:space-y-6">
            {STEPS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-3 sm:gap-4">
                <span
                  className="flex shrink-0 w-9 h-9 sm:w-11 sm:h-11 items-center justify-center rounded-full bg-white border-2 border-[#F77124]/30 text-[#F77124] z-20"
                  aria-hidden
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
                <div>
                  <h4 className={cn("text-base sm:text-xl md:text-2xl font-bold", "mb-2")}>
                    {title}
                  </h4>
                  <p className={cn("text-gray-600", "text-xs sm:text-sm font-medium")}>
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Image */}
        <div className="relative w-full aspect-4/3 sm:aspect-3/2 lg:aspect-auto lg:min-h-[400px] rounded-md overflow-hidden sm:-bottom-30 flex items-center justify-center bg-gray-100">
          <div className="absolute inset-y-0 left-0 w-1/3 bg-white to-transparent blur-2xl z-10" />
          <div className="absolute inset-y-0 right-0 w-1/3 bg-linear-to-l from-white to-transparent blur-4xl z-10" />
          <Image
            src={TRAINING_IMAGE}
            alt="Person typing on laptop - career-focused learning"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority={false}
          />
        </div>
      </div>
    </section>
  );
}
