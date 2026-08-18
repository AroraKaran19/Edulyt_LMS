import Image from "next/image";
import EnquiryButton from "../EnquiryButton";
import LeadForm from "../LeadForm";
import { ISSUERS, RATING, type PlanId } from "../plans";
import { CARD, CONTAINER, EYEBROW } from "./shared";

type Props = {
  plan: PlanId;
  onPlan: (id: PlanId) => void;
  cert: string | null;
  onCert: (cert: string | null) => void;
  onCompare: () => void;
  initialCollege: string;
  initialCollegeId: string;
};

export default function HeroSection({
  plan,
  onPlan,
  cert,
  onCert,
  onCompare,
  initialCollege,
  initialCollegeId,
}: Props) {
  return (
    <section className="relative z-[1] py-[72px] lg:py-[104px] pt-9 pb-[60px] lg:pt-[52px] lg:pb-[88px]">
      <div
        className={`${CONTAINER} grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14`}
      >
        <div>
          <div
            data-fade
            className="flex animate-eq-fade-up flex-wrap items-center gap-2.5 [animation-delay:300ms]"
          >
            <span className={EYEBROW}>
              <i className="size-1.5 flex-none rounded-full bg-primary" />
              Career Acceleration Program
            </span>

            <span className="inline-flex items-center gap-3 rounded-[18px] border-[1.5px] border-[#fbe3d2] bg-white py-2 pr-5 pl-3 shadow-[0_10px_30px_-14px_rgba(43,21,8,0.18),0_2px_6px_rgba(43,21,8,0.04)]">
              <span className="sr-only">
                Rated {RATING.score} out of 5 from {RATING.count}{" "}
                {RATING.source}
              </span>
              <span
                aria-hidden="true"
                className="grid size-10 flex-none place-items-center rounded-full bg-[#fff6f1]"
              >
                <Image
                  src="/google-icon.svg"
                  alt=""
                  width={20}
                  height={20}
                  className="size-5"
                />
              </span>
              <span aria-hidden="true" className="flex flex-col gap-0.5">
                <span className="text-[11.5px] leading-none font-semibold text-[#8c7a70]">
                  Trusted learners
                </span>
                <span className="text-[17px] leading-none font-extrabold tracking-[-0.015em] text-text-primary">
                  {RATING.score}/5 Rating on Google
                </span>
              </span>
            </span>

          </div>

          <h1 className="mt-5 font-[family-name:var(--font-eq-display)] text-[clamp(2rem,6.4vw,4.05rem)] font-extrabold leading-[1.04] tracking-[-0.03em] text-text-primary">
            <span className="block overflow-hidden pb-[0.06em]">
              <span className="block animate-eq-rise [animation-delay:50ms]">
                Don&apos;t just learn.
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.06em]">
              <span className="block animate-eq-rise [animation-delay:130ms]">
                <em className="not-italic text-primary">
                  Get placed at a top MNC.
                </em>
              </span>
            </span>
          </h1>

          <p
            data-fade
            className="mt-5 max-w-[50ch] animate-eq-fade-up text-[1.0625rem] leading-[1.62] text-text-secondary [animation-delay:300ms]"
          >
            India&apos;s first edtech collaborating with{" "}
            <strong className="font-bold text-text-primary">
              Meta, Microsoft, Adobe and Cisco
            </strong>{" "}
            for certifications. Learn, get mentored, get placed. Pick the plan
            that matches how much support you want.
          </p>

          {/* Placeholders. Labels and destinations still to be decided. */}
          <div
            data-fade
            className="mt-7 flex animate-eq-fade-up flex-wrap gap-3 [animation-delay:300ms]"
          >
            <EnquiryButton>Click me</EnquiryButton>
            <EnquiryButton variant="ghost">Click me</EnquiryButton>
          </div>

          <div
            data-fade
            className="mt-[30px] animate-eq-fade-up border-t border-[#fbe3d2] pt-[22px] [animation-delay:420ms]"
          >
            <span className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-[#8c7a70]">
              Certification partners (CATC)
            </span>
            <ul className="mt-3.5 grid max-w-[560px] grid-cols-2 gap-2.5 sm:grid-cols-4">
              {ISSUERS.map((issuer) => (
                <li
                  key={issuer.name}
                  className={`${CARD} grid min-h-[58px] place-items-center px-[18px] py-3`}
                >
                  <Image
                    src={issuer.src}
                    alt={issuer.name}
                    height={issuer.height}
                    width={Math.round(issuer.height * issuer.ratio)}
                    style={{ height: issuer.height, width: "auto" }}
                    unoptimized
                    className="block max-w-full object-contain"
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          data-fade
          className="animate-eq-fade-up [animation-delay:300ms] lg:sticky lg:top-24"
        >
          <LeadForm
            selected={plan}
            onSelect={onPlan}
            cert={cert}
            onCert={onCert}
            onCompare={onCompare}
            initialCollege={initialCollege}
            initialCollegeId={initialCollegeId}
          />
        </div>
      </div>
    </section>
  );
}
