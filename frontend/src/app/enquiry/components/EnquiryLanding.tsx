"use client";

import { useEffect, useRef, useState } from "react";
import publicClient from "@/configs/scholarshipApiConfig";
import { REF_STORAGE_KEY } from "@/constants/crm";
import type { ExtraQuestion } from "./LeadForm";
import { useSearchParams } from "next/navigation";
import { ISSUERS, type PlanId } from "../plans";
import { usePlanData } from "../usePlanData";
import { useReveal } from "../useReveal";
import {
  EnquiryPricingProvider,
  EnquiryScholarshipProvider,
  EnquirySettingsProvider,
  type EnquiryPricing,
  type EnquiryScholarship,
} from "../settings";
import type { EnquiryPageSettings } from "@/types/enquiry-page-settings";
import SiteHeader from "../sections/SiteHeader";
import OfferStrip from "../sections/OfferStrip";
import HeroSection from "../sections/HeroSection";
import MarqueeStrip from "../sections/MarqueeStrip";
import CertificatesSection from "../sections/CertificatesSection";
import BadgesSection from "../sections/BadgesSection";
import ResumeSection from "../sections/ResumeSection";
import LanguageNote from "../sections/LanguageNote";
import PlansSection from "../sections/PlansSection";
import HowItRunsSection from "../sections/HowItRunsSection";
import TrackRecordSection from "../sections/TrackRecordSection";
import ClosingSection from "../sections/ClosingSection";
import MobileDock from "../sections/MobileDock";

/** Scroll offset past which the mobile plan dock slides in. */
const DOCK_AFTER = 620;

export default function EnquiryLanding({
  settings = {},
}: {
  settings?: EnquiryPageSettings;
}) {
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
  /*
   * Carried here from the scholarship result screen and from the coupon email,
   * so someone arriving from either does not retype an address they just gave.
   * Validated before use: a junk param would otherwise seed a field that fails
   * on submit for a reason nobody typed.
   */
  const initialEmail = (() => {
    const raw = (params.get("email") ?? "").trim().toLowerCase().slice(0, 254);
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw) ? raw : "";
  })();
  const [docked, setDocked] = useState(false);

  /*
   * The referral code and everything it resolves to live here rather than in
   * LeadForm, because the plans section needs the price setting and the form
   * needs the extra question. One request feeds both.
   *
   * Read as lazy initial state and persisted, so a student who reloads or comes
   * back from the Google round trip keeps the attribution they arrived with.
   */
  const [refCode] = useState(() => {
    if (typeof window === "undefined") return "";
    const fromUrl = new URLSearchParams(window.location.search).get("ref");
    const clean = (fromUrl ?? "").trim().slice(0, 32);
    if (clean) {
      try {
        sessionStorage.setItem(REF_STORAGE_KEY, clean);
      } catch {
        /* private mode: fall back to this render's value */
      }
      return clean;
    }
    try {
      return sessionStorage.getItem(REF_STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  });

  const [extraQuestions, setExtraQuestions] = useState<ExtraQuestion[]>([]);
  /**
   * Withheld until the endpoint answers, so a hidden visit never flashes a
   * price before the fetch lands.
   */
  const [pricing, setPricing] = useState<EnquiryPricing>({
    plans: [],
    mncAddonPrice: null,
  });
  /** Null until the fetch lands, so no line ever flashes and then vanishes. */
  const [scholarship, setScholarship] = useState<EnquiryScholarship>(null);

  /*
   * Take the code out of the address bar. `history.replaceState` rather than
   * `router.replace` so React state survives: a soft navigation here would
   * reset a half-finished form, including the OTP step.
   */
  useEffect(() => {
    const url = new URL(window.location.href);
    // `email` goes too, and for a second reason: an address left in the address
    // bar rides into browser history, shared links and referrer headers.
    const carried = ["ref", "email"].filter((k) => url.searchParams.has(k));
    if (carried.length === 0) return;
    carried.forEach((k) => url.searchParams.delete(k));
    window.history.replaceState({}, "", url.toString());
  }, []);

  /*
   * Resolved here rather than in the server component: reading `searchParams`
   * up there would make this whole landing page dynamic, and it is the page ads
   * point at. The endpoint decides whose questions this visit asks.
   */
  useEffect(() => {
    let cancelled = false;
    publicClient
      .get("/enquiry-page-settings/questions", {
        params: refCode ? { ref: refCode } : undefined,
      })
      .then((res) => {
        if (cancelled) return;
        setExtraQuestions(res.data?.data?.questions ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setExtraQuestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [refCode]);

  /*
   * Prices, per visit. Runs with or without a code: the bare page is governed
   * by the admin switch, a referred one by that link owner's setting, and the
   * endpoint decides which applies.
   */
  useEffect(() => {
    let cancelled = false;
    publicClient
      .get("/enquiry-page-settings/pricing", {
        params: refCode ? { ref: refCode } : undefined,
      })
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data;
        setPricing({
          plans: Array.isArray(data?.plans) ? data.plans : [],
          mncAddonPrice:
            typeof data?.mncAddonPrice === "number" ? data.mncAddonPrice : null,
        });
      })
      .catch(() => {
        // Withheld on failure rather than shown: a network blip must not leak
        // a price the owner or the admin chose to hide.
        if (!cancelled) setPricing({ plans: [], mncAddonPrice: null });
      });
    return () => {
      cancelled = true;
    };
  }, [refCode]);

  /*
   * The scholarship line, per visit. Same precedence as pricing: a referred
   * visit carries its link owner's campaign, every other one the admin's.
   */
  useEffect(() => {
    let cancelled = false;
    publicClient
      .get("/enquiry-page-settings/scholarship", {
        params: refCode ? { ref: refCode } : undefined,
      })
      .then((res) => {
        if (cancelled) return;
        const slug = res.data?.data?.slug;
        setScholarship(typeof slug === "string" && slug ? { slug } : null);
      })
      .catch(() => {
        if (!cancelled) setScholarship(null);
      });
    return () => {
      cancelled = true;
    };
  }, [refCode]);

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

  const picked = usePlanData().planById(plan);

  return (
    <EnquirySettingsProvider value={settings}>
      <EnquiryPricingProvider value={pricing}>
        <EnquiryScholarshipProvider value={scholarship}>
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
              initialEmail={initialEmail}
              refCode={refCode}
              extraQuestions={extraQuestions}
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

            <MobileDock
              planName={picked.name}
              visible={docked}
              onCta={toForm}
            />
          </div>
        </EnquiryScholarshipProvider>
      </EnquiryPricingProvider>
    </EnquirySettingsProvider>
  );
}
