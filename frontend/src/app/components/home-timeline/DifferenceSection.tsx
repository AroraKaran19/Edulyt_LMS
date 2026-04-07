"use client";

import Image from "next/image";
import { FaRegCheckCircle } from "react-icons/fa";
import { RxCrossCircled } from "react-icons/rx";
import { cn } from "@/lib/utils";
import { PrimaryButton } from "../ui/PrimaryButton";

const VALUE_CARDS = [
  { label: "Who We Are ?", title: "Education To Employment Experts" },
  { label: "What We Do ?", title: "100% Project-Based Learning" },
  { label: "What We Offer ?", title: "Industry-Focused Career Programs" },
  { label: "Why Choose Us ?", title: "Built From Real Industry Experience" },
];

// edulyt | youtube | others  →  "text" | "check" | "cross"
const TABLE_ROWS = [
  {
    feature: "Project- based learning",
    edulyt: "100% Real Projects",
    youtube: "Mostly Theory",
    others: "Limited",
  },
  {
    feature: "Industry- Derived Curriculum",
    edulyt: "Build from Projects",
    youtube: "cross",
    others: "cross",
  },
  {
    feature: "Mentors Working in Industry",
    edulyt: "check",
    youtube: "cross",
    others: "cross",
  },
  {
    feature: "Interaction with Future Managers",
    edulyt: "check",
    youtube: "cross",
    others: "cross",
  },
  {
    feature: "Interaction with Future Managers",
    edulyt: "check",
    youtube: "cross",
    others: "cross",
  },
];

// ─── Icon helpers ─────────────────────────────────────────────────────────────

/** Green circle check — matches Figma exactly */
const CheckIcon = () => (
  <div className="flex h-7 w-7 items-center justify-center rounded-full text-2xl  text-[#34D399] mx-auto shadow-sm">
    <FaRegCheckCircle />
  </div>
);

/** Red circle cross — matches Figma exactly */
const CrossIcon = () => (
  <div className="flex h-7 w-7 items-center justify-center rounded-full text-2xl  text-[#F87171] mx-auto shadow-sm">
    <RxCrossCircled />
  </div>
);

/** Orange question-mark icon used in top cards */
const QuestionIcon = () => (
  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F97316]">
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 6C6 4.89543 6.89543 4 8 4C9.10457 4 10 4.89543 10 6C10 6.79565 9.53671 7.47595 8.86853 7.80278C8.36261 8.05405 8 8.57003 8 9.14286V10"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="8" cy="12.5" r="1" fill="white" />
    </svg>
  </span>
);

// ─── Edulyt logo SVG (inline — replace with <Image> if you have the asset) ────
const EdulyLogo = () => (
  <span className="inline-flex items-center gap-1.5">
    {/* hat icon */}
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="10" fill="#FFF3E8" />
      <path d="M5 11l6-4 6 4-6 4-6-4z" fill="#F97316" />
      <path d="M17 11v4" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
    <span className="sm:block hidden text-[13px] font-bold tracking-wide text-gray-900">
      EDULYT
    </span>
  </span>
);

// ─── YouTube logo SVG (inline) ────────────────────────────────────────────────
const YoutubeLogo = () => (
  <span className="inline-flex items-center gap-1.5">
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
      <rect width="20" height="14" rx="3" fill="#FF0000" />
      <path d="M8 10V4l6 3-6 3z" fill="white" />
    </svg>
    <span className="text-[13px] sm:block hidden font-bold text-gray-900">YouTube</span>
  </span>
);

// ─── Cell renderer ─────────────────────────────────────────────────────────────
type CellVal = string;
const Cell = ({ val }: { val: CellVal }) => {
  if (val === "check") return <CheckIcon />;
  if (val === "cross") return <CrossIcon />;
  return (
    <span className="block text-center text-xs sm:text-[13px] font-medium text-gray-700">
      {val}
    </span>
  );
};

// ─── Main Section ─────────────────────────────────────────────────────────────

export default function DifferenceSection() {
  return (
    <section
      className="relative w-full overflow-hidden py-10 px-6 sm:px-10 lg:px-40"
      style={{
        backgroundColor: "#FFFCFA",
        backgroundImage: `
          linear-gradient(45deg, rgba(247,113,36,0.14) 2px, transparent 2px),
          linear-gradient(-45deg, rgba(247,113,36,0.14) 2px, transparent 2px),
          linear-gradient(135deg, rgba(247,113,36,0.14) 2px, transparent 2px),
          linear-gradient(-135deg, rgba(247,113,36,0.14) 2px, transparent 2px)
        `,
        backgroundSize: "34px 34px",
      }}
    >
      <div className="relative mx-auto">

        {/* ── Row 1: 4 Info Cards ──────────────────────────────────────────── */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-6 xl:grid-cols-4">
          {VALUE_CARDS.map((card) => (
            <div
              key={card.label}
              className="flex flex-col gap-2 sm:gap-3 rounded-2xl sm:rounded-3xl bg-white py-3 px-3 sm:py-4 sm:px-4 shadow-[2px_2px_6px_rgb(0,0,0,0.1)] border border-white/60"
            >
              <div className="w-full flex items-center gap-2 sm:gap-3 self-start rounded-full bg-[#FFF3E8]">
                <QuestionIcon />
                <span className={cn("font-extrabold text-gray-800", "text-[10px] sm:text-sm font-medium leading-tight")}>
                  {card.label}
                </span>
              </div>
              <p className={cn("text-xs sm:text-lg font-extrabold", "text-gray-900 pr-2 sm:pr-4")}>
                {card.title}
              </p>
            </div>
          ))}
        </div>

        {/* ── Row 2: Left table + Right image ─────────────────────────────── */}
        <div className="flex flex-col gap-10 relative xl:flex-row xl:items-start">

          {/* ── LEFT ── */}
          <div className="flex flex-1 flex-col gap-6 w-full">

            {/* Heading */}
            <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight">
              The <span className="text-[#F97316]">Difference</span> That Gets You <span className="text-[#F97316]">Hired !</span>
            </h2>

            {/* Comparison table card */}
            <div className="overflow-x-auto rounded-2xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
              <table className="min-w-full sm:min-w-[600px] w-full table-fixed text-sm">
                {/* Column widths */}
                <colgroup>
                  <col style={{ width: "38%" }} />
                  <col style={{ width: "21%" }} />
                  <col style={{ width: "21%" }} />
                  <col style={{ width: "20%" }} />
                </colgroup>

                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-lg font-extrabold text-gray-900">
                      Features
                    </th>
                    <th className="px-2 py-3 sm:px-3 sm:py-4 text-center">
                      <EdulyLogo />
                    </th>
                    <th className="px-2 py-3 sm:px-3 sm:py-4 text-center">
                      <YoutubeLogo />
                    </th>
                    <th className="px-2 py-3 sm:px-3 sm:py-4 text-center text-[10px] sm:text-[14px] font-semibold text-gray-800">
                      Others
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {TABLE_ROWS.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-100 last:border-none"
                    >
                      <td className="px-3 py-[18px] sm:px-6 sm:py-[22px] text-xs sm:text-[15px] font-medium text-gray-800 border-r border-gray-100">
                        {row.feature}
                      </td>
                      <td className="px-2 py-[18px] sm:px-3 sm:py-[22px] border-r border-gray-100">
                        <Cell val={row.edulyt} />
                      </td>
                      <td className="px-2 py-[18px] sm:px-3 sm:py-[22px] border-r border-gray-100">
                        <Cell val={row.youtube} />
                      </td>
                      <td className="px-2 py-[18px] sm:px-3 sm:py-[22px]">
                        <Cell val={row.others} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CTA button — outside & below the table */}
            <div>
              <PrimaryButton size="md">
                Explore Offerings
              </PrimaryButton>
            </div>
          </div>

          {/* ── RIGHT: image + floating badges ── */}
          <div className="relative xl:block hidden h-60 sm:h-80 lg:h-116 rounded-3xl overflow-hidden w-full shrink-0 items-center justify-center lg:w-[42%] lg:mt-10">
            <div className="relative h-full w-full max-w-[580px] mx-auto">
              <div className="absolute inset-y-0 right-0 w-1/4 bg-linear-to-l from-white to-transparent blur-4xl z-10" />
              <div className="absolute inset-y-0 left-0 w-1/4 bg-linear-to-r from-white to-transparent blur-4xl z-10" />
              <Image
                src="/assets/DifferenceSectionHero.png"
                alt="Edulyt dashboard"
                width={600}
                height={400}
                className="h-full w-full object-fit object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
