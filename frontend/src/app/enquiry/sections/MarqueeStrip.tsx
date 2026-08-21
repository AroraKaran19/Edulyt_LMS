"use client";

import { Fragment } from "react";
import { listOr, useSection } from "../settings";

const MARQUEE = [
  "15+ hrs live mentorship",
  "Live projects on real data",
  "Internship offer letter",
  "Mock interviews",
  "ATS-optimised resume",
  "Referrals into 5 top companies",
];

export default function MarqueeStrip() {
  const items = listOr(useSection("hero").marquee, MARQUEE);

  return (
    <div
      aria-hidden="true"
      className="relative z-1 flex overflow-hidden border-y border-[#fbe3d2] bg-white py-[15px] [mask-image:linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)]"
    >
      {[0, 1].map((copy) => (
        <div
          key={copy}
          className="flex min-w-full flex-none animate-eq-slide items-center justify-around gap-[22px]"
        >
          {items.map((item) => (
            <Fragment key={item}>
              <span className="whitespace-nowrap text-[14.5px] font-bold text-text-primary">
                {item}
              </span>
              <i className="not-italic text-[#f7ad24]">✦</i>
            </Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}
