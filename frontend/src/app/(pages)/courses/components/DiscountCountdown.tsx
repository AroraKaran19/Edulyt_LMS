"use client";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

const DiscountCountdown = ({
  hours,
  minutes,
  seconds,
  className,
}: {
  hours: number;
  minutes: number;
  seconds: number;
  className?: string;
}) => {
  const [countdown, setCountdown] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours, minutes, seconds });

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        }
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        }
        if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        // When countdown reaches zero, restart it
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [hours, minutes, seconds]);

  return (
    <div className={cn("discount-countdown flex flex-col gap-2 text-base", className)}>
      <p className="font-medium text-[#2B1508] flex flex-wrap gap-2 justify-center md:justify-start">
        <span className="underline">Limited Offer</span>
        <span className="underline">
          {countdown.hours} Hr : {countdown.minutes < 10 ? `0${countdown.minutes} Min` : `${countdown.minutes} Min`} : {countdown.seconds < 10 ? `0${countdown.seconds} Sec` : `${countdown.seconds} Sec`}
        </span>
      </p>
    </div>
  );
};

export default DiscountCountdown;
