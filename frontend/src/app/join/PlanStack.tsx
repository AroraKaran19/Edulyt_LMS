"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLANS, type PlanId } from "./plans";

type Props = {
  selected: PlanId;
  onSelect: (id: PlanId) => void;
};

export default function PlanStack({ selected, onSelect }: Props) {
  const rungsRef = useRef<HTMLFieldSetElement | null>(null);
  const rungRefs = useRef<(HTMLLabelElement | null)[]>([]);
  const [bottoms, setBottoms] = useState<number[]>([]);

  const measure = useCallback(() => {
    const wrap = rungsRef.current;
    if (!wrap) return;
    const top = wrap.getBoundingClientRect().top;
    setBottoms(
      rungRefs.current.map((el) =>
        el ? el.getBoundingClientRect().bottom - top : 0
      )
    );
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const wrap = rungsRef.current;
    if (!wrap || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [measure]);

  const fill = bottoms[selected - 1] ?? 0;

  return (
    <div className="mt-10 grid grid-cols-[10px_1fr] gap-x-4 md:grid-cols-[12px_1fr] md:gap-x-[22px]">
      <div
        className="relative overflow-hidden rounded-full bg-[#f6e2d2]"
        aria-hidden="true"
      >
        <div
          className="absolute inset-x-0 top-0 rounded-full bg-[linear-gradient(180deg,#f7ad24,#f77124)] transition-[height] duration-500 ease-[cubic-bezier(0.16,0.9,0.28,1)]"
          style={{ height: fill }}
        />
        {bottoms.slice(0, -1).map((b, i) => (
          <span
            key={i}
            className="absolute inset-x-0 h-0 border-t-2 border-[#fff6f1]"
            style={{ top: b - 7 }}
          />
        ))}
      </div>

      <fieldset className="m-0 grid min-w-0 gap-3.5 border-0 p-0" ref={rungsRef}>
        <legend className="sr-only">Choose your plan</legend>

        {PLANS.map((plan, i) => {
          const picked = plan.id === selected;
          const carried = plan.id < selected;

          return (
            <label
              key={plan.id}
              ref={(el) => {
                rungRefs.current[i] = el;
              }}
              className={cn(
                "relative block cursor-pointer rounded-2xl border-[1.5px] border-[#fbe3d2] bg-white p-[22px] shadow-[0_10px_30px_-14px_rgba(43,21,8,0.18),0_2px_6px_rgba(43,21,8,0.04)] transition-[border-color,box-shadow,transform,background-color] duration-200 md:px-7 md:py-[26px]",
                "hover:-translate-y-0.5 hover:border-[#f2d6c2] hover:shadow-[0_22px_44px_-18px_rgba(43,21,8,0.26),0_3px_8px_rgba(43,21,8,0.05)]",
                "has-focus-visible:outline-2 has-focus-visible:outline-offset-[3px] has-focus-visible:outline-primary",
                carried && "border-[#f8cfae] bg-[#fffaf6]",
                picked &&
                  "-translate-y-0.5 border-primary shadow-[0_0_0_3px_rgba(247,173,36,0.35),0_22px_44px_-18px_rgba(43,21,8,0.26)]"
              )}
            >
              <input
                type="radio"
                name="plan-stack"
                value={plan.id}
                checked={picked}
                onChange={() => onSelect(plan.id)}
                className="sr-only"
              />

              <div className="flex items-center gap-[13px]">
                <span className="min-w-0 text-[clamp(1.25rem,3.6vw,1.6rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-text-primary">
                  {plan.name}
                </span>
                <span
                  className={cn(
                    "ml-auto inline-flex flex-none items-center gap-1.5 rounded-full border px-[13px] py-[7px] text-[11.5px] font-bold uppercase tracking-[0.04em] transition-colors duration-200",
                    picked && "border-primary bg-primary text-white",
                    carried &&
                      "border-[#3aa544]/25 bg-[#3aa544]/10 text-[#2c7f34]",
                    !picked &&
                      !carried &&
                      "border-[#fbe3d2] bg-[#fff6f1] text-[#8c7a70]"
                  )}
                >
                  {picked ? (
                    <>
                      <Check size={13} strokeWidth={3} /> Your pick
                    </>
                  ) : carried ? (
                    <>
                      <Check size={13} strokeWidth={3} /> Included
                    </>
                  ) : (
                    "Select"
                  )}
                </span>
              </div>

              <p className="mt-3 text-[0.9375rem] leading-[1.55] text-text-secondary">
                {plan.tagline}
              </p>

              <ul className="mt-4 grid gap-2.5 md:grid-cols-2 md:gap-x-6">
                {plan.adds.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2.5 text-[0.9rem] leading-[1.5] text-text-primary"
                  >
                    <span className="mt-0.5 grid size-[17px] flex-none place-items-center rounded-full bg-primary/10">
                      <Check
                        size={11}
                        strokeWidth={3.5}
                        className="text-primary"
                      />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              {plan.carried.length > 0 && (
                <div className="mt-[18px] border-t border-dashed border-[#f2d6c2] pt-[15px]">
                  <span className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#8c7a70]">
                    Also included
                  </span>
                  <ul className="mt-2.5 flex flex-wrap gap-[7px]">
                    {plan.carried.map((item) => (
                      <li
                        key={item}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#3aa544]/25 bg-[#3aa544]/[0.08] px-3 py-1.5 text-[12.5px] font-semibold text-[#2c7f34]"
                      >
                        <Check size={11} strokeWidth={3} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}
