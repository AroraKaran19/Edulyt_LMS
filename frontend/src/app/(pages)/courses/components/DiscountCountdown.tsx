"use client";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

const DiscountCountdown = ({
  days,
  hours,
  minutes,
  seconds,
  ...props
}: {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} & {
  className?: string;
  style?: React.CSSProperties;
}) => {
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days, hours, minutes, seconds });

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        // If countdown has reached zero, stop the timer
        if (prev.days === 0 && prev.hours === 0 && prev.minutes === 0 && prev.seconds === 0) {
          return prev;
        }
        
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        }
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        }
        if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        // If we reach here, countdown is at zero
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [days, hours, minutes, seconds]);

  return (
    <div
      className={cn(
        "discount-countdown flex flex-col gap-2 text-base",
        props.className
      )}
    >
      <p className="font-medium text-text-primary flex flex-wrap gap-2 justify-center md:justify-start">
        <span className="underline">Limited Offer</span>
        <span className="underline">
          {countdown.days > 0 ? `${countdown.days} D : ` : ""}
          {countdown.hours > 0 ? `${countdown.hours} Hr : ` : ""}
          {countdown.minutes > 0 ? `${countdown.minutes} Min : ` : ""}
          {countdown.seconds > 0 ? `${countdown.seconds} Sec` : ""}
        </span>
      </p>
    </div>
  );
};

export default DiscountCountdown;
