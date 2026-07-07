"use client";

import { useEffect, useState } from "react";
import apiClient from "@/configs/apiConfig";

const HeroSection = () => {
  // Community-review reward (points earned per post) and the ₹ value of 1 point.
  // Both endpoints are public, so these render for signed-out visitors too.
  const [rewardPoints, setRewardPoints] = useState<number>(0);
  const [redemptionInr, setRedemptionInr] = useState<number>(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [rewardRes, rateRes] = await Promise.all([
          apiClient.get("/success-points/reward-rates"),
          apiClient.get("/success-points/redemption-rate"),
        ]);
        if (!active) return;
        const pts = Number(rewardRes?.data?.data?.communityReviewSuccessPoints);
        setRewardPoints(Number.isFinite(pts) && pts > 0 ? pts : 0);
        const inr = Number(rateRes?.data?.data?.successPointRedemptionInr);
        setRedemptionInr(Number.isFinite(inr) && inr > 0 ? inr : 0);
      } catch {
        /* non-blocking — headline just omits the numbers */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="w-full pt-8 pb-4">
      <h1 className="text-3xl md:text-5xl font-extrabold text-black flex items-center gap-2 flex-wrap">
        Community Stories & <span className="text-[#F77124]">Experiences</span>
      </h1>
      <p className="text-gray-600 mt-4 text-lg font-medium">
        Learn from real journeys of our students and professionals.
      </p>
      <div className="mt-8">
        <h2 className="text-2xl font-bold">
          Share your experience and earn{" "}
          <span className="text-[#F77124]">
            {rewardPoints > 0 ? `${rewardPoints} ` : ""}Success Points
          </span>
        </h2>
        {redemptionInr > 0 && (
          <p className="mt-1.5 text-sm text-gray-500">
            Use these Success Points to get courses for free (1 SP = ₹
            {redemptionInr.toLocaleString("en-IN")}).
          </p>
        )}
      </div>
    </div>
  );
};

export default HeroSection;
