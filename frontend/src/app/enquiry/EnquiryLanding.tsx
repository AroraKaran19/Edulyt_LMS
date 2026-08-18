"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ISSUERS, PLANS, type PlanId } from "./plans";
import { useReveal } from "./useReveal";
import SiteHeader from "./sections/SiteHeader";
import OfferStrip from "./sections/OfferStrip";
import HeroSection from "./sections/HeroSection";
import MarqueeStrip from "./sections/MarqueeStrip";
import CertificatesSection from "./sections/CertificatesSection";
import BadgesSection from "./sections/BadgesSection";
import ResumeSection from "./sections/ResumeSection";
import LanguageNote from "./sections/LanguageNote";
import PlansSection from "./sections/PlansSection";
import HowItRunsSection from "./sections/HowItRunsSection";
import TrackRecordSection from "./sections/TrackRecordSection";
import ClosingSection from "./sections/ClosingSection";
import MobileDock from "./sections/MobileDock";

/** Scroll offset past which the mobile plan dock slides in. */
const DOCK_AFTER = 620;

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
  const initialCollege = params.get("college") ?? "";
  const initialCollegeId = params.get("collegeId") ?? "";
  const [docked, setDocked] = useState(false);

  useReveal(rootRef);

  useEffect(() => {
    const onScroll = () => setDocked(window.scrollY > DOCK_AFTER);
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

      <SiteHeader />

      <OfferStrip />

      <HeroSection
        plan={plan}
        onPlan={setPlan}
        cert={cert}
        onCert={setCert}
        onCompare={toPlans}
        initialCollege={initialCollege}
        initialCollegeId={initialCollegeId}
      />

      <MarqueeStrip />

      <CertificatesSection />

      <BadgesSection />

      <ResumeSection />

      <LanguageNote />

      <PlansSection
        plan={plan}
        onPlan={setPlan}
        cert={cert}
        onCert={setCert}
      />

      <HowItRunsSection />

      <TrackRecordSection />

      <ClosingSection planName={picked.name} onCta={toForm} />

      <MobileDock planName={picked.name} visible={docked} onCta={toForm} />
    </div>
  );
}
