"use client";

import Image from "next/image";
import { Maximize2 } from "lucide-react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { cn } from "@/lib/utils";
import { SAMPLE_RESUMES } from "../plans";
import { CARD, CONTAINER, EYEBROW, H2, LEAD, REVEAL, SECTION } from "./shared";

const DELAYS = ["", "delay-[80ms]", "delay-[160ms]", "delay-[240ms]"];

export default function ResumeSection() {
  return (
    <section className={SECTION} id="resume">
      <div className={CONTAINER}>
        <div data-reveal className={REVEAL}>
          <span className={EYEBROW}>
            <i className="size-1.5 flex-none rounded-full bg-primary" />
            On your CV
          </span>
          <h2 className={`${H2} mt-[18px]`}>
            This is how you{" "}
            <em className="not-italic text-primary">carry them</em>
          </h2>
          <p className={LEAD}>
            A badge is worth what it does on the page a recruiter actually
            opens. Same CV below, four different badges, so you can see where
            yours lands before you pick one.
          </p>
        </div>

        <ul className="mt-10 grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
          {SAMPLE_RESUMES.map((resume, i) => (
            <li
              key={resume.src}
              data-reveal
              className={cn(
                CARD,
                REVEAL,
                "group overflow-hidden transition-[transform,box-shadow,border-color] hover:-translate-y-1.5 hover:border-[#f2d6c2]",
                "hover:shadow-[0_22px_44px_-18px_rgba(43,21,8,0.26),0_3px_8px_rgba(43,21,8,0.05)]",
                DELAYS[i] ?? ""
              )}
            >
              {/* Natural aspect rather than a cropped fill: RMIZ wraps the img,
                  and an absolutely positioned one loses its box inside that. */}
              <div className="relative bg-[#fffcfa]">
                <Zoom zoomMargin={24}>
                  <Image
                    src={resume.src}
                    alt={`Sample CV carrying the ${resume.partner} ${resume.credential} badge`}
                    width={1000}
                    height={859}
                    sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
                    className="h-auto w-full"
                  />
                </Zoom>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 flex h-14 items-end justify-end bg-linear-to-t from-white via-white/70 to-transparent p-2.5"
                >
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-[#8c7a70] opacity-0 shadow-[0_2px_8px_rgba(43,21,8,0.14)] transition-opacity duration-300 group-hover:opacity-100">
                    <Maximize2 size={10} strokeWidth={3} />
                    Click to zoom
                  </span>
                </span>
              </div>
              <div className="border-t border-[#fbe3d2] px-4 py-3">
                <p className="text-[13px] font-extrabold leading-[1.25] text-text-primary">
                  {resume.partner}
                </p>
                <p className="mt-0.5 text-[11.5px] leading-[1.35] font-semibold text-[#8c7a70]">
                  {resume.credential}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
