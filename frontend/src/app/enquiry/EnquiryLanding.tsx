"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import EnquiryButton from "./EnquiryButton";
import LeadForm from "./LeadForm";
import PlanMatrix from "./PlanMatrix";
import CertificateShowcase from "./CertificateShowcase";
import { ISSUERS, PLANS, RATING, STATS, STEPS, type PlanId } from "./plans";
import { useReveal } from "./useReveal";

const MARQUEE = [
  "15+ hrs live mentorship",
  "Live projects on real data",
  "Internship offer letter",
  "Mock interviews",
  "ATS-optimised resume",
  "Referrals into 5 top companies",
];


export default function EnquiryLanding() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  /*
   * Google sign-in is a full page redirect, so the picks a student made before
   * it are carried in the return URL rather than in storage. Reading them as
   * lazy initial state keeps the server and client render identical.
   */
  const params = useSearchParams();
  const [plan, setPlan] = useState<PlanId>(() => {
    const raw = Number(params.get("plan"));
    return raw === 1 || raw === 2 || raw === 3 ? (raw as PlanId) : 3;
  });
  /** Which MNC certification the student wants, null if none. */
  const [cert, setCert] = useState<string | null>(() => {
    const raw = params.get("cert");
    return ISSUERS.some((i) => i.name === raw) ? raw : null;
  });
  const initialStage = params.get("stage") ?? "";
  const [docked, setDocked] = useState(false);

  useReveal(rootRef);

  useEffect(() => {
    const onScroll = () => setDocked(window.scrollY > 620);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toPlans = () => {
    document
      .getElementById("plans")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toForm = () => {
    const target = document.getElementById("eq-form");
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.querySelector<HTMLInputElement>("input")?.focus({
      preventScroll: true,
    });
  };

  const picked = PLANS.find((p) => p.id === plan)!;

  return (
    <div
      data-enquiry
      ref={rootRef}
      className="relative isolate overflow-x-clip bg-[#fff6f1] font-[family-name:var(--font-eq-body)] text-text-secondary antialiased"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(rgba(247,113,36,0.16)_1.2px,transparent_1.2px)] bg-[size:24px_24px] [mask-image:linear-gradient(180deg,#000,rgba(0,0,0,0.35)_60%,transparent)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[-10%] top-[-280px] z-0 h-[900px] bg-[radial-gradient(50%_50%_at_20%_30%,rgba(247,173,36,0.22),transparent_70%),radial-gradient(45%_45%_at_82%_8%,rgba(247,113,36,0.16),transparent_70%)]"
      />

      <header className="sticky top-0 z-40 border-b border-[#fbe3d2] bg-white/[0.86] backdrop-blur-[14px]">
        <div className="relative z-[1] mx-auto w-full max-w-[1240px] px-5 md:px-8 flex h-[78px] items-center gap-4">
          <Link
            href="/"
            className="flex flex-none items-center"
            aria-label="Airkrit home"
          >
            <Image
              src="/logo.svg"
              alt="Airkrit"
              width={105}
              height={30}
              priority
              unoptimized
              className="h-11 w-auto sm:h-[52px]"
            />
          </Link>
          <span className="ml-auto hidden items-center gap-2 rounded-full bg-[#3aa544]/10 px-3.5 py-[7px] text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#2c7f34] md:inline-flex">
            <i className="size-[7px] flex-none rounded-full bg-[#3aa544]" />
            Admissions open
          </span>
          <EnquiryButton
            variant="ghost"
            className="ml-auto md:ml-0"
            onClick={toForm}
          >
            Get your plan
          </EnquiryButton>
        </div>
      </header>

      <section
        className="relative z-[1] py-[72px] lg:py-[104px] pt-9 pb-[60px] lg:pt-[52px] lg:pb-[88px]"
      >
        <div
          className="relative z-[1] mx-auto w-full max-w-[1240px] px-5 md:px-8 grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14"
        >
          <div>
            <div
              data-fade
              className="flex animate-eq-fade-up flex-wrap items-center gap-2.5 [animation-delay:300ms]"
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-[7px] text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#c4551a]">
                <i className="size-1.5 flex-none rounded-full bg-primary" />
                Career Acceleration Program
              </span>

              {/* Google rating, partial star drawn by clipping a gold row over a grey one */}
              <span className="inline-flex items-center gap-2 rounded-full border border-[#fbe3d2] bg-white py-[6px] pr-3.5 pl-3 shadow-[0_6px_18px_-12px_rgba(43,21,8,0.28)]">
                <span className="sr-only">
                  Rated {RATING.score} out of 5 from {RATING.count} {RATING.source}
                </span>
                <span
                  aria-hidden="true"
                  className="relative inline-flex items-center"
                >
                  <span className="flex gap-[1px] text-[#e6d6c8]">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} size={13} strokeWidth={0} fill="currentColor" />
                    ))}
                  </span>
                  <span
                    className="absolute inset-y-0 left-0 overflow-hidden"
                    style={{ width: `${(RATING.score / 5) * 100}%` }}
                  >
                    <span className="flex gap-[1px] text-[#f7ad24]">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Star
                          key={i}
                          size={13}
                          strokeWidth={0}
                          fill="currentColor"
                        />
                      ))}
                    </span>
                  </span>
                </span>
                <span aria-hidden="true" className="text-[12px] font-extrabold text-text-primary">
                  {RATING.score}
                </span>
                <span aria-hidden="true" className="text-[11.5px] font-semibold text-[#8c7a70]">
                  by students across India
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

            <ul
              data-fade
              className="mt-7 grid animate-eq-fade-up gap-2.5 [animation-delay:300ms] sm:grid-cols-3"
            >
              {STATS.map((stat) => (
                <li
                  key={stat.value}
                  className="rounded-2xl border border-[#fbe3d2] bg-white shadow-[0_10px_30px_-14px_rgba(43,21,8,0.18),0_2px_6px_rgba(43,21,8,0.04)] flex items-center gap-3.5 px-4 py-3.5 sm:block sm:pt-4 sm:pb-[15px]"
                >
                  <b className="min-w-[46px] flex-none text-[2.1rem] font-extrabold leading-none tracking-[-0.03em] text-primary sm:block sm:text-[clamp(1.9rem,4.4vw,2.35rem)]">
                    {stat.value}
                  </b>
                  <span className="text-[13px] font-semibold leading-[1.4] text-text-secondary sm:mt-2 sm:block sm:text-[12.5px]">
                    {stat.label}
                  </span>
                </li>
              ))}
            </ul>

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
                    className="rounded-2xl border border-[#fbe3d2] bg-white shadow-[0_10px_30px_-14px_rgba(43,21,8,0.18),0_2px_6px_rgba(43,21,8,0.04)] grid min-h-[58px] place-items-center px-[18px] py-3"
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
              onSelect={setPlan}
              cert={cert}
              onCert={setCert}
              onCompare={toPlans}
              initialStage={initialStage}
            />
          </div>
        </div>
      </section>

      <div
        aria-hidden="true"
        className="relative z-1 flex overflow-hidden border-y border-[#fbe3d2] bg-white py-[15px] [mask-image:linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)]"
      >
        {[0, 1].map((copy) => (
          <div
            key={copy}
            className="flex min-w-full flex-none animate-eq-slide items-center justify-around gap-[22px]"
          >
            {MARQUEE.map((item) => (
              <Fragment key={item}>
                <span className="whitespace-nowrap text-[14.5px] font-bold text-text-primary">
                  {item}
                </span>
                <i className="not-italic text-[#f7ad24]">✦</i>
              </Fragment>
            ))}
          </div>
        ))}
      </div>

      <section className="relative z-[1] py-[60px] lg:py-[72px]" id="plans">
        <div className="relative z-[1] mx-auto w-full max-w-[1240px] px-5 md:px-8">
          <div data-reveal className="translate-y-6 opacity-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,0.9,0.28,1)] data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-[7px] text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#c4551a]">
              <i className="size-1.5 flex-none rounded-full bg-primary" />
              Compare the plans
            </span>
            <h2 className="mt-[18px] text-[clamp(2rem,4.4vw,2.9rem)] font-extrabold leading-[1.1] tracking-[-0.02em] text-balance text-text-primary">
              Everything we offer, and{" "}
              <em className="not-italic text-primary">what each plan unlocks</em>
            </h2>
            <p className="mt-3.5 max-w-[58ch] text-base leading-[1.65] text-text-secondary">
              Pick a plan on the right. The list lights up with what you get and
              dims what you do not. The MNC certification is free on
              Mentor-to-Placement and can be added to either other plan.
            </p>
          </div>

          <div data-reveal className="translate-y-6 opacity-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,0.9,0.28,1)] data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100 delay-[80ms]">
            <PlanMatrix
              selected={plan}
              onSelect={setPlan}
              cert={cert}
              onCert={setCert}
            />
          </div>
        </div>
      </section>

      <section className="relative z-[1] py-[60px] lg:py-[80px]" id="certificates">
        <div className="relative z-[1] mx-auto w-full max-w-[1240px] px-5 md:px-8">
          <div data-reveal className="translate-y-6 opacity-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,0.9,0.28,1)] data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-[7px] text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#c4551a]">
              <i className="size-1.5 flex-none rounded-full bg-primary" />
              Certificates
            </span>
            <h2 className="mt-[18px] text-[clamp(2rem,4.4vw,2.9rem)] font-extrabold leading-[1.1] tracking-[-0.02em] text-balance text-text-primary">
              The certificates and letters{" "}
              <em className="not-italic text-primary">you walk away with</em>
            </h2>
            <p className="mt-3.5 max-w-[58ch] text-base leading-[1.65] text-text-secondary">
              Every one of these is issued in your name and verifiable. Pick any
              on the right to see the real document.
            </p>

            <p className="mt-4 flex max-w-[62ch] items-start gap-2.5 rounded-xl border border-[#3aa544]/25 bg-[#3aa544]/[0.07] px-4 py-3 text-[13.5px] leading-[1.55] text-text-primary">
              <BadgeCheck
                size={17}
                strokeWidth={2.4}
                className="mt-0.5 flex-none text-[#2c7f34]"
              />
              <span>
                <b className="font-extrabold">
                  Airkrit certification is guaranteed on every plan.
                </b>{" "}
                Clear the programme goals and your training certificate,
                internship offer letter and internship certificate are issued
                whichever plan you are on. The MNC certification is the only one
                that depends on your plan or an add-on.
              </span>
            </p>
          </div>

          <div data-reveal className="translate-y-6 opacity-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,0.9,0.28,1)] data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100 delay-[80ms]">
            <CertificateShowcase />
          </div>
        </div>
      </section>

      <section className="relative z-[1] py-[72px] lg:py-[104px]">
        <div className="relative z-[1] mx-auto w-full max-w-[1240px] px-5 md:px-8">
          <div data-reveal className="translate-y-6 opacity-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,0.9,0.28,1)] data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-[7px] text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#c4551a]">
              <i className="size-1.5 flex-none rounded-full bg-primary" />
              How it runs
            </span>
            <h2 className="mt-[18px] text-[clamp(2rem,4.4vw,2.9rem)] font-extrabold leading-[1.1] tracking-[-0.02em] text-balance text-text-primary">
              Learn, get mentored,{" "}
              <em className="not-italic text-primary">get placed</em>
            </h2>
            <p className="mt-3.5 max-w-[58ch] text-base leading-[1.65] text-text-secondary">
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
                  "rounded-2xl border border-[#fbe3d2] bg-white shadow-[0_10px_30px_-14px_rgba(43,21,8,0.18),0_2px_6px_rgba(43,21,8,0.04)]",
                  "translate-y-6 opacity-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,0.9,0.28,1)] data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100",
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

      <section className="relative z-[1] py-[72px] lg:py-[104px] pb-24 lg:pb-[120px]">
        <div className="relative z-[1] mx-auto w-full max-w-[1240px] px-5 md:px-8">
          <div
            data-reveal
            className={cn(
              "translate-y-6 opacity-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,0.9,0.28,1)] data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100",
              "relative z-[1] overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#f77124_0%,#f7902a_55%,#f7ad24_100%)] px-6 py-11 text-center shadow-[0_24px_50px_-24px_rgba(247,113,36,0.7)] sm:px-11 sm:py-16"
            )}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.22)_1.2px,transparent_1.2px)] bg-[size:22px_22px] [mask-image:radial-gradient(70%_70%_at_50%_0%,#000,transparent)]"
            />
            <h2 className="relative mb-3 text-[clamp(1.8rem,4.6vw,2.7rem)] font-extrabold leading-[1.12] tracking-[-0.025em] text-white">
              Three plans. One short form.
            </h2>
            <p className="relative mx-auto mb-[26px] max-w-[50ch] text-base leading-[1.6] text-white/[0.92]">
              Share your name, email and number. We will send the full plan
              breakdown, confirm your batch and answer anything about the MNC
              certification add-on.
            </p>
            <EnquiryButton variant="onColor" className="relative" onClick={toForm}>
              Get {picked.name} details
              <ArrowRight size={16} strokeWidth={2.6} />
            </EnquiryButton>
          </div>

          <footer className="relative z-[1] mt-11 flex flex-wrap items-center gap-x-[22px] gap-y-3 border-t border-[#fbe3d2] pt-6 text-[13px] font-semibold text-[#8c7a70]">
            <span>© {new Date().getFullYear()} Airkrit India</span>
            <Link
              href="/terms-of-use"
              className="text-text-secondary hover:text-primary"
            >
              Terms
            </Link>
            <Link
              href="/privacy-policy"
              className="text-text-secondary hover:text-primary"
            >
              Privacy
            </Link>
            <Link
              href="/cancellation-refund-policy"
              className="text-text-secondary hover:text-primary"
            >
              Refunds
            </Link>
            <Link href="/" className="text-text-secondary hover:text-primary">
              airkrit.com
            </Link>
          </footer>
        </div>
      </section>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex items-center gap-3 border-t border-[#fbe3d2] bg-white/95 px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] backdrop-blur-[14px] transition-transform duration-300 ease-[cubic-bezier(0.16,0.9,0.28,1)] lg:hidden",
          docked ? "translate-y-0" : "translate-y-[130%]"
        )}
      >
        <span className="min-w-0 text-[11.5px] font-semibold leading-[1.4] text-[#8c7a70]">
          Selected
          <b className="block truncate text-[15px] font-extrabold text-text-primary">
            {picked.name}
          </b>
        </span>
        <EnquiryButton className="ml-auto h-[46px] flex-none" onClick={toForm}>
          Get details
        </EnquiryButton>
      </div>
    </div>
  );
}
