import { Suspense } from "react";
import type { Metadata } from "next";
import CaLanding from "./components/CaLanding";
import { caBodyFont, caDisplayFont } from "./fonts";
import { getCaPageSettings } from "@/lib/ca-page/getCaPageSettings";

/*
 * `getCaPageSettings` never throws, so a dead API on a background ISR
 * regeneration would otherwise bake "Applications open soon" into the static
 * page for up to an hour. Rendering per request keeps that fallback scoped to
 * the one request that hit it; the tagged fetch below still caches a
 * successful response, so this costs nothing on the common path.
 */
export const dynamic = "force-dynamic";

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
  const settings = await getCaPageSettings();
  return (
    <div className={`${caDisplayFont.variable} ${caBodyFont.variable}`}>
      <Suspense fallback={<div className="min-h-dvh bg-[#2B1508]" />}>
        <CaLanding settings={settings} />
      </Suspense>
    </div>
  );
}
