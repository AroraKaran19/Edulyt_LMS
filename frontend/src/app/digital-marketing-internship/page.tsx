import { Suspense } from "react";
import type { Metadata } from "next";
import CaLanding from "./components/CaLanding";
import { caBodyFont, caDisplayFont } from "./fonts";
import { DEFAULT_SEO } from "./content";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { fetchCaPageSettings, getCaPageSettings } from "@/lib/ca-page/getCaPageSettings";

// Throwing keeps the last good cached page; only the build falls back, so an API outage cannot fail it.
const loadSettings = () =>
  process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD ? getCaPageSettings() : fetchCaPageSettings();

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await loadSettings();
  const title = seo.title || DEFAULT_SEO.title;
  const description = seo.description || DEFAULT_SEO.description;
  const ogTitle = seo.ogTitle || seo.title || DEFAULT_SEO.ogTitle;
  const ogDescription = seo.ogDescription || seo.description || DEFAULT_SEO.ogDescription;
  const images = seo.ogImage ? [{ url: seo.ogImage }] : undefined;
  return {
    title,
    description,
    keywords: seo.keywords.length ? seo.keywords : undefined,
    alternates: { canonical: "/digital-marketing-internship" },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: "/digital-marketing-internship",
      type: "website",
      ...(images && { images }),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      ...(images && { images }),
    },
  };
}

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
