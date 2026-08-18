"use client";

import { Lock } from "lucide-react";

/**
 * The sealed reward. This is the page's one loud element and the whole reason
 * the flow reads as earning rather than claiming.
 *
 * It never names the discount. The size of the reward is what the candidate is
 * playing for, so showing it here would turn the test into a toll booth in
 * front of a posted price.
 *
 * The caption promises the reveal rather than counting what stands in the way:
 * an obstacle count on the prize itself reads as a warning, not an invitation.
 */
export default function Seal() {
  return (
    <div className="relative">
      <div className="sch-foil relative grid aspect-[16/9] place-items-center overflow-hidden rounded-2xl px-6 sm:aspect-[2/1]">
        {/* Slow sheen so the seal reads as metal, not a flat orange block. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[60%] -translate-x-[60%] animate-sch-sheen bg-[linear-gradient(72deg,transparent_42%,rgba(255,255,255,0.55)_50%,transparent_58%)] motion-reduce:animate-none"
        />
        <div className="relative z-10 text-center">
          <span className="block font-sch-mono text-[0.625rem] uppercase tracking-[0.28em] text-[#2a1a08]/60">
            Waiting for you
          </span>
          <span className="mt-1 block font-sch-display text-[clamp(1.75rem,4vw,3rem)] font-semibold leading-none tracking-tight text-[#2a1a08]">
            Your reward
          </span>
          <span className="mt-2 block text-sm text-[#2a1a08]/70">
            Revealed the moment you finish
          </span>
        </div>
      </div>

      {/* Sits half on the seal, half off it: the seal has to look fastened to
          something rather than floating as a coloured rectangle. */}
      <span className="absolute -bottom-3 left-1/2 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full border-[1.5px] border-sch-ink-line bg-sch-ink">
        <Lock className="h-4 w-4 text-sch-gold" />
      </span>
    </div>
  );
}
