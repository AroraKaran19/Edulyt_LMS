"use client";
import { cn } from "@/lib/utils";
import { CourseDiscount } from "@/types";
import { istNowParts } from "@/lib/ist";
import React, { useEffect, useState } from "react";

const DiscountCountdown = ({
  discount,
  days,
  hours,
  minutes,
  seconds,
  discountClassname,
  ...props
}: {
  discount?: CourseDiscount;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  discountClassname?: string;
} & {
  className?: string;
  style?: React.CSSProperties;
}) => {
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days, hours, minutes, seconds });

  // Set mounted to true after component mounts on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update countdown when initial values change
  useEffect(() => {
    setCountdown({ days, hours, minutes, seconds });
  }, [days, hours, minutes, seconds]);

  useEffect(() => {
    if (!mounted) return; // Don't start countdown until mounted

    const interval = setInterval(() => {
      setCountdown((prev) => {
        // If countdown has reached zero, stop the timer
        if (
          prev.days === 0 &&
          prev.hours === 0 &&
          prev.minutes === 0 &&
          prev.seconds === 0
        ) {
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
          return {
            ...prev,
            days: prev.days - 1,
            hours: 23,
            minutes: 59,
            seconds: 59,
          };
        }
        // If we reach here, countdown is at zero
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [mounted]);

  // Show initial values during SSR and until mounted
  const displayCountdown = mounted
    ? countdown
    : { days, hours, minutes, seconds };

  const shouldShowCountdown = 
    discount && 
    discount.isActive && 
    discount.startTime && 
    discount.endTime &&
    days >= 0 && 
    hours >= 0 && 
    minutes >= 0 && 
    seconds >= 0;

  if (!shouldShowCountdown) return null;

  return (
    <div
      className={cn(
        "discount-countdown flex flex-col gap-2 text-base",
        props.className
      )}
    >
      {/* Line 1: Discount Badge */}
      {discount && (
        <div
          className={cn(
            "flex w-full justify-center md:justify-end",
            discountClassname
          )}
        >
          <span className="py-2 px-3 rounded-lg bg-[#F7AD24] text-white w-fit">
            {discount.discount === "fixed" 
              ? `₹${discount.value} off` 
              : `${discount.value}% off`}
          </span>
        </div>
      )}
      
      {/* Line 2: Status Text */}
      <p className="font-medium text-text-primary text-center md:text-left">
        {(() => {
          // Determine if we're before start time or during discount period (IST).
          const ist = istNowParts();
          const [startHour, startMin] = discount!.startTime!.split(':').map(Number);
          const currentTimeInMinutes = ist.hh * 60 + ist.mm;
          const startTimeInMinutes = startHour * 60 + startMin;
          
          // Check if we're before start time
          const isBeforeStart = currentTimeInMinutes < startTimeInMinutes;
          
          return isBeforeStart ? "Discount Starts In" : "Limited Offer Ends In";
        })()}
      </p>
      
      {/* Line 3: Countdown Time */}
      <p className="font-medium text-text-primary text-center md:text-right underline">
          {displayCountdown.days > 0 ? `${displayCountdown.days} D : ` : ""}
          {displayCountdown.hours > 0 ? `${displayCountdown.hours} Hr : ` : ""}
          {displayCountdown.minutes > 0
            ? `${displayCountdown.minutes} Min : `
            : ""}
          {displayCountdown.seconds > 0
            ? `${displayCountdown.seconds} Sec`
            : ""}
      </p>
    </div>
  );
};

export default DiscountCountdown;
