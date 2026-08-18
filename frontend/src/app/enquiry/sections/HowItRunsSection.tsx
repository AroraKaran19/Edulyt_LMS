import { cn } from "@/lib/utils";
import { STEPS } from "../plans";
import { CARD, CONTAINER, EYEBROW, H2, LEAD, REVEAL, SECTION } from "./shared";

export default function HowItRunsSection() {
  return (
    <section className={SECTION}>
      <div className={CONTAINER}>
        <div data-reveal className={REVEAL}>
          <span className={EYEBROW}>
            <i className="size-1.5 flex-none rounded-full bg-primary" />
            How it runs
          </span>
          <h2 className={`${H2} mt-[18px]`}>
            Learn, get mentored,{" "}
            <em className="not-italic text-primary">get placed</em>
          </h2>
          <p className={LEAD}>
            Three stages, in order. Every plan covers the first, Mentor-Led adds
            the second, Mentor-to-Placement carries you through all three.
          </p>
        </div>

        <div className="mt-10 grid gap-[18px] sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <article
              key={step.no}
              data-reveal
              className={cn(
                CARD,
                REVEAL,
                "hover:shadow-[0_22px_44px_-18px_rgba(43,21,8,0.26),0_3px_8px_rgba(43,21,8,0.05)]",
                "relative flex flex-col px-[22px] py-6 transition-[transform,box-shadow,border-color] hover:-translate-y-1.5 hover:border-[#f2d6c2]",
                i === 0 && "delay-[80ms]",
                i === 1 && "delay-[160ms]",
                i === 2 && "delay-[240ms]"
              )}
            >
              <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-[15px] font-extrabold text-primary">
                {step.no}
              </span>
              <h3 className="mt-4 mb-2 text-[1.3rem] font-extrabold leading-[1.2] tracking-[-0.02em] text-text-primary">
                {step.title}
              </h3>
              <p className="text-[0.9rem] leading-[1.6] text-text-secondary">
                {step.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
