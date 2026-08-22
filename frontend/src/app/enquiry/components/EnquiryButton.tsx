"use client";

import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "onColor";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  block?: boolean;
};

/**
 * Labels wrap rather than run on, and the heights are minimums rather than fixed.
 * Hero CTA labels come from the CMS, and a nowrap button sets a min-content width
 * its grid track then has to honour: one long label used to widen the whole hero
 * past the viewport. A one-line label still measures exactly as it did.
 */
const BASE =
  "relative inline-flex max-w-full items-center justify-center gap-[9px] rounded-2xl px-6 text-center text-[14.5px] font-bold transition-[transform,box-shadow,filter] duration-200 active:translate-y-0 disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none";

const VARIANTS: Record<Variant, string> = {
  primary:
    "min-h-12 py-2.5 bg-[linear-gradient(to_top,#f77124_0%,#fa8b3f_55%,#fb9d5a_100%)] text-white shadow-[0_0_0_3px_rgba(247,173,36,0.55),0_12px_24px_-12px_rgba(247,113,36,0.85)] hover:-translate-y-0.5 hover:saturate-[1.06] hover:shadow-[0_0_0_3px_rgba(247,173,36,0.75),0_18px_30px_-14px_rgba(247,113,36,0.95)]",
  ghost:
    "min-h-11 py-2 border-[1.5px] border-[#f2d6c2] bg-white px-5 text-[#c4551a] hover:border-primary hover:bg-[#fffaf6]",
  onColor:
    "min-h-12 py-2.5 bg-white text-[#c4551a] shadow-[0_12px_26px_-12px_rgba(43,21,8,0.5)] hover:-translate-y-0.5 hover:shadow-[0_18px_32px_-14px_rgba(43,21,8,0.6)]",
};

/** Same styling for anything that has to be an anchor rather than a button. */
export const enquiryButtonClass = (
  variant: Variant = "primary",
  block?: boolean,
  className?: string
) =>
  cn(BASE, VARIANTS[variant], block && "min-h-[46px] w-full text-[14.5px]", className);

export default function EnquiryButton({
  variant = "primary",
  block,
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      className={cn(
        BASE,
        VARIANTS[variant],
        block && "min-h-[46px] w-full text-[14.5px]",
        className
      )}
    >
      {children}
    </button>
  );
}
