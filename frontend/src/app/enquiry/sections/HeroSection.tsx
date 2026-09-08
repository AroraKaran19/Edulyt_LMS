import Image from "next/image";
import EnquiryButton, { enquiryButtonClass } from "../components/EnquiryButton";
import LeadForm, { type ExtraQuestion } from "../components/LeadForm";
import { ISSUERS, RATING, type PlanId } from "../plans";
import { listOr, useSection, withSrc } from "../settings";
import { CARD, CONTAINER, EYEBROW } from "./shared";
import type { EnquiryCta } from "@/types/enquiry-page-settings";

type Props = {
  plan: PlanId;
  onPlan: (id: PlanId) => void;
  cert: string | null;
  onCert: (cert: string | null) => void;
  onCompare: () => void;
  initialCollege: string;
  initialCollegeId: string;
  initialEmail: string;
  /** Resolved once by EnquiryLanding and passed down; see LeadForm's props. */
  refCode: string;
  extraQuestions: ExtraQuestion[];
};

/**
 * A hero button. With no target configured it stays an inert button rather than
 * an anchor to nowhere, so an unconfigured slot cannot 404 a visitor.
 */
function HeroCta({
  cta,
  fallbackLabel,
  variant = "primary",
}: {
  cta: EnquiryCta;
  fallbackLabel: string;
  variant?: "primary" | "ghost";
}) {
  const label = cta.label || fallbackLabel;
  if (!cta.href) {
    return <EnquiryButton variant={variant}>{label}</EnquiryButton>;
  }

  // Uploaded documents and off-site links both open away from the funnel.
  const external = cta.source === "upload" || /^https?:\/\//i.test(cta.href);
  return (
    <a
      href={cta.href}
      className={enquiryButtonClass(variant)}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {label}
    </a>
  );
}

export default function HeroSection({
  plan,
  onPlan,
  cert,
  onCert,
  onCompare,
  initialCollege,
  initialCollegeId,
  initialEmail,
  refCode,
  extraQuestions,
}: Props) {
  const cms = useSection("hero");
  const partners = withSrc(listOr(cms.partners, ISSUERS));
  const score = cms.ratingScore || RATING.score;
  const primary = cms.primaryCta ?? {};
  const secondary = cms.secondaryCta ?? {};

  return (
    <section className="relative z-[1] py-[72px] lg:py-[104px] pt-9 pb-[60px] lg:pt-[52px] lg:pb-[88px]">
      <div
        className={`${CONTAINER} grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14`}
      >
        {/* `min-w-0` on both tracks. Without it a track sizes to its content's
            min-content, so one long CTA label widens the whole hero past the
            viewport and the page's overflow-x-clip shears off the right side. */}
        <div className="min-w-0">
          <div
            data-fade
            className="flex animate-eq-fade-up flex-wrap items-center gap-2.5 [animation-delay:300ms]"
          >
            <span className={EYEBROW}>
              <i className="size-1.5 flex-none rounded-full bg-primary" />
              {cms.eyebrow || "Career Acceleration Program"}
            </span>

            {/* A link, not a badge: a score nobody can check is worth nothing,
                so this opens the listing it is quoting. */}
            <a
              href={cms.ratingHref || RATING.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-[18px] border-[1.5px] border-[#fbe3d2] bg-white py-2 pr-5 pl-3 shadow-[0_10px_30px_-14px_rgba(43,21,8,0.18),0_2px_6px_rgba(43,21,8,0.04)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#f2d6c2] hover:shadow-[0_14px_34px_-14px_rgba(43,21,8,0.26),0_2px_6px_rgba(43,21,8,0.05)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              <span className="sr-only">
                Rated {score} out of 5 from {cms.ratingCount || RATING.count}{" "}
                {cms.ratingSource || RATING.source}. Opens the listing in a new
                tab.
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
                  {cms.ratingLabel || "Trusted learners"}
                </span>
                <span className="text-[17px] leading-none font-extrabold tracking-[-0.015em] text-text-primary">
                  {score}/5 Rating on Google
                </span>
              </span>
            </a>

          </div>

          <h1 className="mt-5 font-[family-name:var(--font-eq-display)] text-[clamp(2rem,6.4vw,4.05rem)] font-extrabold leading-[1.04] tracking-[-0.03em] text-text-primary">
            <span className="block overflow-hidden pb-[0.06em]">
              <span className="block animate-eq-rise [animation-delay:50ms]">
                {cms.headingLine1 || "Don't just learn."}
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.06em]">
              <span className="block animate-eq-rise [animation-delay:130ms]">
                <em className="not-italic text-primary">
                  {cms.headingLine2 || "Get placed at a top MNC."}
                </em>
              </span>
            </span>
          </h1>

          <p
            data-fade
            className="mt-5 max-w-[50ch] animate-eq-fade-up text-[1.0625rem] leading-[1.62] text-text-secondary [animation-delay:300ms]"
          >
            {cms.introHtml ? (
              <span dangerouslySetInnerHTML={{ __html: cms.introHtml }} />
            ) : (
              <>
                India&apos;s first edtech collaborating with{" "}
                <strong className="font-bold text-text-primary">
                  Meta, Microsoft, Adobe and Cisco
                </strong>{" "}
                for certifications. Learn, get mentored, get placed. Pick the
                plan that matches how much support you want.
              </>
            )}
          </p>

          <div
            data-fade
            className="mt-7 flex animate-eq-fade-up flex-wrap gap-3 [animation-delay:300ms]"
          >
            <HeroCta cta={primary} fallbackLabel="Click me" />
            <HeroCta cta={secondary} fallbackLabel="Click me" variant="ghost" />
          </div>

          <div
            data-fade
            className="mt-[30px] animate-eq-fade-up border-t border-[#fbe3d2] pt-[22px] [animation-delay:420ms]"
          >
            <span className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-[#8c7a70]">
              {cms.partnersHeading || "Certification partners (CATC)"}
            </span>
            <ul className="mt-3.5 grid max-w-[560px] grid-cols-2 gap-2.5 sm:grid-cols-4">
              {partners.map((issuer) => (
                <li
                  key={issuer.src}
                  className={`${CARD} grid min-h-[58px] place-items-center px-[18px] py-3`}
                >
                  <Image
                    src={issuer.src}
                    alt={issuer.name ?? ""}
                    height={issuer.height ?? 24}
                    width={Math.round((issuer.height ?? 24) * (issuer.ratio ?? 1))}
                    style={{ height: issuer.height ?? 24, width: "auto" }}
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
          className="min-w-0 animate-eq-fade-up [animation-delay:300ms] lg:sticky lg:top-24"
        >
          <LeadForm
            selected={plan}
            onSelect={onPlan}
            cert={cert}
            onCert={onCert}
            onCompare={onCompare}
            initialCollege={initialCollege}
            initialCollegeId={initialCollegeId}
            initialEmail={initialEmail}
            refCode={refCode}
            extraQuestions={extraQuestions}
          />
        </div>
      </div>
    </section>
  );
}
