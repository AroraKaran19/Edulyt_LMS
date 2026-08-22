"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import CertPicker from "./CertPicker";
import EnquirySelect from "./EnquirySelect";
import { type PerkState, type PlanId } from "../plans";
import { useSection, withSrc } from "../settings";
import { usePlanData } from "../usePlanData";

type Props = {
  selected: PlanId;
  onSelect: (id: PlanId) => void;
  cert: string | null;
  onCert: (cert: string | null) => void;
};

const inr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

/**
 * Everything the programme offers on the left, the plan picker on the right.
 * Choosing a plan re-resolves each row to included / add-on / excluded, and the
 * rows restate in a downward cascade so the change reads as a change rather
 * than a flicker. The stagger is a per-row transition-delay from its position
 * in the flat list.
 *
 * The perks are grouped into cards flowing in two columns rather than one long
 * list, so the whole comparison and the picker sit on one screen together.
 */
export default function PlanMatrix({
  selected,
  onSelect,
  cert,
  onCert,
}: Props) {
  const { plans, perkGroups, mncAddonPrice, allPerks, countIncluded } =
    usePlanData();
  const { instructors: cmsInstructors, instructorsHeading } =
    useSection("plans");
  const instructors = withSrc(cmsInstructors ?? []);
  const [instructorPick, setInstructorPick] = useState(0);
  // Clamped rather than reset: an admin deleting an instructor mid-session
  // would otherwise index past the end of the list.
  const instructorIndex = Math.min(instructorPick, instructors.length - 1);
  const instructor = instructors[instructorIndex];

  const TOTAL_PERKS = allPerks.length;
  /** Flat index of each group's first perk, so rows stagger without a counter. */
  const GROUP_OFFSETS = perkGroups.map((_, i) =>
    perkGroups.slice(0, i).reduce((sum, g) => sum + g.perks.length, 0)
  );

  return (
    <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_340px] lg:gap-8">
      {/* `min-w-0` on both tracks, or the 1fr one sizes to its content's
          min-content instead of the fraction and shunts the plan column past
          the container edge, where the page's overflow-x-clip eats it. */}
      {/* ---------- perks ---------- */}
      <div className="min-w-0 sm:columns-2 sm:gap-4">
        {perkGroups.map((group, groupIndex) => (
          <section
            key={group.title}
            className="mb-4 break-inside-avoid rounded-2xl border border-[#fbe3d2] bg-white p-4 shadow-[0_10px_30px_-16px_rgba(43,21,8,0.18)]"
          >
            <h3 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#8c7a70]">
              {group.title}
            </h3>

            <ul className="mt-2 grid gap-0.5">
              {group.perks.map((perk, perkIndex) => {
                const rowIndex = GROUP_OFFSETS[groupIndex] + perkIndex;
                const state = perk.by[selected];

                if (perk.id === "mnc") {
                  return (
                    <CertPicker
                      key={perk.label}
                      state={state}
                      cert={cert}
                      onCert={onCert}
                    />
                  );
                }

                const on = state.kind !== "excluded";

                return (
                  <li
                    key={perk.label}
                    style={{ transitionDelay: `${rowIndex * 26}ms` }}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-1 py-1.5 transition-[opacity,filter] duration-500 ease-[cubic-bezier(0.16,0.9,0.28,1)]",
                      on ? "opacity-100" : "opacity-40 grayscale"
                    )}
                  >
                    <PerkIcon state={state} />

                    <span
                      className={cn(
                        "min-w-0 flex-1 text-[13px] leading-[1.35] transition-colors duration-500",
                        on
                          ? "font-semibold text-text-primary"
                          : "text-[#8c7a70] line-through decoration-[#c7b5a8]"
                      )}
                    >
                      {perk.label}
                    </span>

                    {state.kind === "included" && state.note && (
                      <span className="flex-none rounded-full bg-[#fff6f1] px-2 py-0.5 text-[10.5px] font-bold whitespace-nowrap text-[#c4551a]">
                        {state.note}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {/* Fills the gap the column balance leaves at the foot of the perks. */}
        {instructor && (
          <div className="relative mb-4 break-inside-avoid rounded-2xl border border-[#fbe3d2] bg-white shadow-[0_10px_30px_-16px_rgba(43,21,8,0.18)]">
            <div className="relative h-[264px] w-full overflow-hidden rounded-t-2xl bg-[#fff6f1]">
              <Image
                key={instructor.src}
                src={instructor.src}
                alt={instructor.name || "Instructor"}
                fill
                sizes="(min-width: 1024px) 394px, (min-width: 640px) 45vw, 90vw"
                className="animate-eq-fade-up object-cover"
              />

              {/* Optional, and the point of it is that the claim is checkable:
                  a mentor with no profile set simply has no badge. */}
              {instructor.linkedinUrl ? (
                <a
                  href={instructor.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${instructor.name || "Instructor"} on LinkedIn`}
                  className="absolute top-2.5 right-2.5 grid size-9 place-items-center rounded-full bg-white/95 text-[#0a66c2] shadow-[0_6px_16px_-6px_rgba(43,21,8,0.5)] transition-[transform,background-color] duration-200 hover:scale-105 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    className="size-[18px]"
                  >
                    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
                  </svg>
                </a>
              ) : null}
            </div>

            <div className="border-t border-[#fbe3d2] p-3.5">
              {instructors.length > 1 ? (
                <EnquirySelect
                  label={instructorsHeading || "Who you will learn from"}
                  value={String(instructorIndex)}
                  onChange={(next) => setInstructorPick(Number(next))}
                  options={instructors.map((person, i) => ({
                    value: String(i),
                    label: person.name || `Instructor ${i + 1}`,
                  }))}
                />
              ) : (
                <p className="text-[13px] font-extrabold leading-[1.25] text-text-primary">
                  {instructor.name}
                </p>
              )}

              {instructor.title && (
                <p className="mt-1.5 text-[11px] leading-[1.35] font-semibold text-[#8c7a70]">
                  {instructor.title}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ---------- plan picker ---------- */}
      <fieldset className="m-0 grid min-w-0 gap-2.5 border-0 p-0 lg:sticky lg:top-24">
        <legend className="sr-only">Choose your plan</legend>

        {plans.map((plan) => {
          const picked = plan.id === selected;
          const addon = picked && cert !== null && plan.id !== 3;

          return (
            <label
              key={plan.id}
              className={cn(
                "relative block cursor-pointer rounded-2xl border-[1.5px] bg-white p-4 transition-[border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.16,0.9,0.28,1)]",
                "has-focus-visible:outline-2 has-focus-visible:outline-offset-[3px] has-focus-visible:outline-primary",
                picked
                  ? "-translate-y-0.5 border-primary shadow-[0_0_0_3px_rgba(247,173,36,0.35),0_18px_36px_-18px_rgba(43,21,8,0.3)]"
                  : "border-[#fbe3d2] shadow-[0_10px_30px_-16px_rgba(43,21,8,0.18)] hover:-translate-y-0.5 hover:border-[#f2d6c2]"
              )}
            >
              <input
                type="radio"
                name="plan-matrix"
                value={plan.id}
                checked={picked}
                onChange={() => onSelect(plan.id)}
                className="sr-only"
              />

              {plan.badge && (
                <span className="absolute -top-2.5 right-3.5 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-[3px] text-[9.5px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_6px_14px_-6px_rgba(247,113,36,0.9)]">
                  <Sparkles size={9} strokeWidth={2.8} />
                  {plan.badge}
                </span>
              )}

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8c7a70]">
                  Plan {plan.no}
                </span>
                <span
                  className={cn(
                    "ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.06em] transition-colors duration-300",
                    picked ? "text-primary" : "text-[#8c7a70]"
                  )}
                >
                  {picked && <Check size={11} strokeWidth={3.4} />}
                  {picked ? "Selected" : "Select"}
                </span>
              </div>

              <h3 className="mt-0.5 text-[1.15rem] font-extrabold leading-[1.15] tracking-[-0.02em] text-text-primary">
                {plan.name}
              </h3>

              <p className="mt-1 text-[12px] leading-[1.45] text-text-secondary">
                {plan.tagline}
              </p>

              <div className="mt-2.5 flex items-baseline gap-2 border-t border-[#fbe3d2] pt-2.5">
                <span className="text-[1.4rem] font-extrabold leading-none tracking-[-0.03em] text-primary">
                  {inr(plan.price + (addon ? mncAddonPrice : 0))}
                </span>
                <span className="text-[10.5px] font-semibold text-[#8c7a70]">
                  {addon
                    ? `incl. ${cert} certification`
                    : `${countIncluded(plan.id)} of ${TOTAL_PERKS} included`}
                </span>
              </div>

              <span className="mt-2 block rounded-lg bg-[#fff6f1] px-2 py-1.5 text-center text-[10.5px] font-bold text-[#c4551a]">
                {plan.bestFor}
              </span>
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}

function PerkIcon({ state }: { state: PerkState }) {
  if (state.kind === "excluded") {
    return (
      <span className="grid size-[18px] flex-none place-items-center rounded-full bg-[#e4d6cb] text-[#8c7a70]">
        <Lock size={9} strokeWidth={3} />
      </span>
    );
  }
  return (
    <span className="grid size-[18px] flex-none place-items-center rounded-full bg-primary/10 text-primary transition-colors duration-500">
      <Check size={10} strokeWidth={3.6} />
    </span>
  );
}
