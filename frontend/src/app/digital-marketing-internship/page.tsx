import { Suspense } from "react";
import type { Metadata } from "next";
import CaLanding from "./components/CaLanding";
import { caBodyFont, caDisplayFont } from "./fonts";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { fetchCaPageSettings, getCaPageSettings } from "@/lib/ca-page/getCaPageSettings";

// Throwing keeps the last good cached page; only the build falls back, so an API outage cannot fail it.
const loadSettings = () =>
  process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD ? getCaPageSettings() : fetchCaPageSettings();

export const metadata: Metadata = {
  title: "Airkrit Campus Ambassador: your first salary starts on campus",
  description:
    "Promote Airkrit at your college, earn a fixed monthly stipend plus incentives, and finish with an LOR, an internship certificate and a training certificate.",
  openGraph: {
    title: "Become an Airkrit Campus Ambassador",
    description: "A fixed monthly stipend, incentives, an offer letter in 24 hours and a shot at a full-time offer.",
    type: "website",
  },
};

export default async function CampusAmbassadorPage() {
  const settings = await loadSettings();
  return (
    <div className={`${caDisplayFont.variable} ${caBodyFont.variable}`}>
      <Suspense fallback={<div className="min-h-dvh bg-[#2B1508]" />}>
        <CaLanding settings={settings} />
      </Suspense>
    </div>
  );
}
