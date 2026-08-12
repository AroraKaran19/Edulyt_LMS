"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import JoinButton from "./JoinButton";
import LeadForm from "./LeadForm";
import PlanStack from "./PlanStack";
import { ARTIFACTS, ISSUERS, PLANS, STATS, type PlanId } from "./plans";
import { useReveal } from "./useReveal";

const MARQUEE = [
  "Every course unlocked",
  "Cisco certified",
  "Meta certified",
  "Apple certified",
  "Recommendation letter",
  "Live internship",
];


export default function JoinLanding() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [plan, setPlan] = useState<PlanId>(3);
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
    const target = document.getElementById("jo-form");
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.querySelector<HTMLInputElement>("input")?.focus({
      preventScroll: true,
    });
  };

  const picked = PLANS.find((p) => p.id === plan)!;

  return (
    <div
      data-join
      ref={rootRef}
      className="relative isolate overflow-x-clip bg-[#fff6f1] text-text-secondary antialiased"
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
        <div className="relative z-[1] mx-auto w-full max-w-[1240px] px-5 md:px-8 flex h-[70px] items-center gap-4">
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
              className="h-[34px] w-auto"
            />
          </Link>
          <span className="ml-auto hidden items-center gap-2 rounded-full bg-[#3aa544]/10 px-3.5 py-[7px] text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#2c7f34] md:inline-flex">
            <i className="size-[7px] flex-none rounded-full bg-[#3aa544]" />
            Admissions open
          </span>
          <JoinButton
            variant="ghost"
            className="ml-auto md:ml-0"
            onClick={toForm}
          >
            Get your plan
          </JoinButton>
        </div>
      </header>

      <section
        className="relative z-[1] py-[72px] lg:py-[104px] pt-9 pb-[60px] lg:pt-[52px] lg:pb-[88px]"
      >
        <div
          className="relative z-[1] mx-auto w-full max-w-[1240px] px-5 md:px-8 grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14"
        >
          <div>
            <span
              data-fade
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-[7px] text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#c4551a] animate-jo-fade-up [animation-delay:300ms]"
            >
              <i className="size-1.5 flex-none rounded-full bg-primary" />
              One enrolment · Three plans
            </span>

            <h1 className="mt-5 text-[clamp(2rem,6.4vw,4.05rem)] font-extrabold leading-[1.04] tracking-[-0.03em] text-text-primary">
              <span className="block overflow-hidden pb-[0.06em]">
                <span className="block animate-jo-rise [animation-delay:50ms]">
                  Anyone can learn it.
                </span>
              </span>
              <span className="block overflow-hidden pb-[0.06em]">
                <span className="block animate-jo-rise [animation-delay:130ms]">
                  Few can <em className="not-italic text-primary">prove</em> it.
                </span>
              </span>
            </h1>

            <p
              data-fade
              className="mt-5 max-w-[50ch] animate-jo-fade-up text-[1.0625rem] leading-[1.62] text-text-secondary [animation-delay:300ms]"
            >
              Courses teach you the skill. Airkrit hands you the proof a recruiter
              actually looks for:{" "}
              <strong className="font-bold text-text-primary">
                certifications, a recommendation letter and a real internship
              </strong>
              . Pick how far you want to go.
            </p>

            <ul
              data-fade
              className="mt-7 grid animate-jo-fade-up gap-2.5 [animation-delay:300ms] sm:grid-cols-3"
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
              className="mt-[30px] animate-jo-fade-up border-t border-[#fbe3d2] pt-[22px] [animation-delay:420ms]"
            >
              <span className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-[#8c7a70]">
                Certifications issued by
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
            className="animate-jo-fade-up [animation-delay:300ms] lg:sticky lg:top-24"
          >
            <LeadForm selected={plan} onSelect={setPlan} onCompare={toPlans} />
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
            className="flex min-w-full flex-none animate-jo-slide items-center justify-around gap-[22px]"
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

      <section className="relative z-[1] py-[72px] lg:py-[104px]" id="plans">
        <div className="relative z-[1] mx-auto w-full max-w-[1240px] px-5 md:px-8">
          <div data-reveal className="translate-y-6 opacity-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,0.9,0.28,1)] data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-[7px] text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#c4551a]">
              <i className="size-1.5 flex-none rounded-full bg-primary" />
              The plans
            </span>
            <h2 className="mt-[18px] text-[clamp(2rem,4.4vw,2.9rem)] font-extrabold leading-[1.1] tracking-[-0.02em] text-balance text-text-primary">
              Each plan <em className="not-italic text-primary">keeps</em>{" "}
              everything in the one above it
            </h2>
            <p className="mt-3.5 max-w-[58ch] text-base leading-[1.65] text-text-secondary">
              Nothing resets and nothing is sold to you twice. Every plan carries
              the one above it forward and adds a new kind of proof. Pick a plan
              to see exactly what you would be holding.
            </p>
          </div>

          <div data-reveal className="translate-y-6 opacity-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,0.9,0.28,1)] data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100 delay-[80ms]">
            <PlanStack selected={plan} onSelect={setPlan} />
          </div>
        </div>
      </section>

      <section className="relative z-[1] py-[72px] lg:py-[104px]">
        <div className="relative z-[1] mx-auto w-full max-w-[1240px] px-5 md:px-8">
          <div data-reveal className="translate-y-6 opacity-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,0.9,0.28,1)] data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-[7px] text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#c4551a]">
              <i className="size-1.5 flex-none rounded-full bg-primary" />
              On paper
            </span>
            <h2 className="mt-[18px] text-[clamp(2rem,4.4vw,2.9rem)] font-extrabold leading-[1.1] tracking-[-0.02em] text-balance text-text-primary">
              What you <em className="not-italic text-primary">walk away</em>{" "}
              holding
            </h2>
            <p className="mt-3.5 max-w-[58ch] text-base leading-[1.65] text-text-secondary">
              The parts of the programme that outlive it. These are documents that
              go into a job application, not a screenshot of a progress bar.
            </p>
          </div>

          <div className="mt-10 grid gap-[18px] sm:grid-cols-3">
            {ARTIFACTS.map((item, i) => (
              <article
                key={item.title}
                data-reveal
                className={cn(
                  "rounded-2xl border border-[#fbe3d2] bg-white shadow-[0_10px_30px_-14px_rgba(43,21,8,0.18),0_2px_6px_rgba(43,21,8,0.04)]",
                  "translate-y-6 opacity-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,0.9,0.28,1)] data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100",
                  "hover:shadow-[0_22px_44px_-18px_rgba(43,21,8,0.26),0_3px_8px_rgba(43,21,8,0.05)]",
                  "relative flex flex-col px-[22px] py-6 hover:-translate-y-1.5 hover:border-[#f2d6c2]",
                  i === 0 && "delay-[80ms]",
                  i === 1 && "delay-[160ms]",
                  i === 2 && "delay-[240ms]"
                )}
              >
                <span className="absolute top-6 right-5 text-[11.5px] font-bold text-[#c4551a]">
                  {item.rung}
                </span>
                <span className="inline-flex self-start rounded-full bg-[#f7ad24]/[0.16] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.07em] text-[#8a5c05]">
                  {item.kind}
                </span>
                <h3 className="mt-4 mb-2 text-[1.3rem] font-extrabold leading-[1.2] tracking-[-0.02em] text-text-primary">
                  {item.title}
                </h3>
                <p className="mb-5 text-[0.9rem] leading-[1.6] text-text-secondary">
                  {item.body}
                </p>
                <span className="mt-auto flex items-center gap-2 border-t border-[#fbe3d2] pt-4 text-[12.5px] font-bold text-[#2c7f34]">
                  <BadgeCheck size={16} strokeWidth={2.4} />
                  {item.seal}
                </span>
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
              Share your name, email and number. We will send the plan breakdown
              and fee structure, then call to fix your batch.
            </p>
            <JoinButton variant="onColor" className="relative" onClick={toForm}>
              Get {picked.name} details
              <ArrowRight size={16} strokeWidth={2.6} />
            </JoinButton>
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
        <JoinButton className="ml-auto h-[46px] flex-none" onClick={toForm}>
          Get details
        </JoinButton>
      </div>
    </div>
  );
}
