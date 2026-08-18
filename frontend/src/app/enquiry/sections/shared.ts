/** Class strings every enquiry section repeats. Kept byte-identical to what
 *  the sections used inline, so extracting them changed nothing visually. */

export const CONTAINER =
  "relative z-[1] mx-auto w-full max-w-[1240px] px-5 md:px-8";

/**
 * Vertical rhythm for every section between the hero and the footer.
 */
export const SECTION = "relative z-[1] py-12 lg:py-14";

/** Paired with `data-reveal`, which `useReveal` toggles on scroll. */
export const REVEAL =
  "translate-y-6 opacity-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,0.9,0.28,1)] data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100";

export const CARD =
  "rounded-2xl border border-[#fbe3d2] bg-white shadow-[0_10px_30px_-14px_rgba(43,21,8,0.18),0_2px_6px_rgba(43,21,8,0.04)]";

export const EYEBROW =
  "inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-[7px] text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#c4551a]";

export const H2 =
  "text-[clamp(2rem,4.4vw,2.9rem)] font-extrabold leading-[1.1] tracking-[-0.02em] text-balance text-text-primary";

export const LEAD =
  "mt-3.5 max-w-[58ch] text-base leading-[1.65] text-text-secondary";
