import { cn } from "@/lib/utils";
import { COURSE_LANGUAGES } from "../plans";
import { CONTAINER, REVEAL } from "./shared";

export default function LanguageNote() {
  return (
    <div className={`${CONTAINER} pb-12 lg:pb-14`}>
      <div
        data-reveal
        className={cn(
          REVEAL,
          "relative overflow-hidden rounded-3xl border border-[#fbe3d2] bg-linear-to-br from-white via-[#fffaf6] to-[#fff1e6] px-6 py-9 shadow-[0_10px_30px_-14px_rgba(43,21,8,0.18)] sm:px-10 sm:py-11"
        )}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(247,113,36,0.14)_1.1px,transparent_1.1px)] bg-[size:20px_20px] [mask-image:radial-gradient(70%_70%_at_50%_0%,#000,transparent)]"
        />

        <div className="relative mx-auto max-w-[54ch] text-center">
          <h2 className="text-[clamp(1.5rem,3.1vw,2.15rem)] font-extrabold leading-[1.12] tracking-[-0.02em] text-balance text-text-primary">
            Learn in the language{" "}
            <em className="not-italic text-primary">you think in</em>
          </h2>
          <p className="mt-3.5 text-[0.9375rem] leading-[1.6] text-text-secondary">
            English is the default, not the requirement. Select courses also run
            in Hindi, Tamil, Marathi, Telugu and Kannada, so a concept lands the
            first time you hear it.
          </p>
        </div>

        <ul className="relative mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-4 sm:mt-9 sm:gap-x-10">
          {COURSE_LANGUAGES.map((language) => (
            <li
              key={language.code}
              lang={language.code}
              className="text-[clamp(1.375rem,3.4vw,1.875rem)] leading-none font-extrabold tracking-[-0.02em] text-text-primary"
            >
              {language.native}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
