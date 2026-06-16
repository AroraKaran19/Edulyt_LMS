"use client";

import { useEffect, useRef, useState } from "react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { HomePageSettings } from "@/types/home-page-settings";
import { faqItems } from "@/constants/faq";
import HomeStudentSection from "./sections/HomeStudentSection";
import HomeCoursePath from "./sections/HomeCoursePath";
import HomeFutureManagerSection from "./sections/HomeFutureManagerSection";
import HomeIndustrySection from "./sections/HomeIndustrySection";
import HomeInternshipPath from "./sections/HomeInternshipPath";
import HomePrepareSection from "./sections/HomePrepareSection";
import HomeSupportSection from "./sections/HomeSupportSection";
import HomeTestimonialSection from "./sections/HomeTestimonialSection";
import HomeTrainingSection from "./sections/HomeTrainingSection";
import InstitutionSection from "./sections/InstitutionSection";
import HomeProfessionalSection from "./sections/HomeProfessionalSection";
import HomeDreamJobSection from "./sections/HomeDreamJobSection";
import HomePathSelectionSection from "./sections/HomePathSelectionSection";
import FAQSection from "../../programs/[slug]/components/FAQSection";

function parseSettings(payload: unknown): HomePageSettings {
  if (!payload || typeof payload !== "object") return {};
  const env = payload as { data?: unknown };
  const d = env.data;
  if (!d || typeof d !== "object") return {};
  return d as HomePageSettings;
}

export default function HomeSectionsFold() {
  const [settings, setSettings] = useState<HomePageSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const originalOverflowRef = useRef<string>("");

  useEffect(() => {
    originalOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    apiClient
      .get(ENDPOINTS.homePageSettings)
      .then((res) => setSettings(parseSettings(res.data)))
      .catch(() => setSettings({}))
      .finally(() => {
        setIsLoading(false);
        document.body.style.overflow = originalOverflowRef.current;
      });

    return () => {
      document.body.style.overflow = originalOverflowRef.current;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-text-secondary font-medium">
            Loading content&hellip;
          </p>
        </div>
      </div>
    );
  }

  const faqSection = settings?.faq;
  const faqs =
    faqSection?.faqs && faqSection.faqs.length > 0
      ? faqSection.faqs
      : faqItems;
  const faqDescription =
    faqSection?.description ||
    "Dive into Artificial Intelligence & Machine Learning projects to sharpen skills and build a unique portfolio";

  return (
    <>
      <HomeStudentSection settings={settings?.student} />
      <HomeIndustrySection settings={settings?.industry} />
      <HomeCoursePath
        title="We Have Two Powerful Paths for You"
        audience="college-students"
        settings={settings?.coursePathStudents}
      />
      <HomeInternshipPath settings={settings?.internshipPath} />
      <HomeTestimonialSection settings={settings?.testimonial} />
      <InstitutionSection settings={settings?.institutions} />
      <HomeTrainingSection settings={settings?.training} />
      <HomeSupportSection settings={settings?.support} />
      <HomePrepareSection settings={settings?.prepare} />
      <HomeFutureManagerSection settings={settings?.futureManagers} />
      <HomeProfessionalSection settings={settings?.professional} />
      <HomeCoursePath
        title="Switch to Tech with Industry-Focused Programs"
        audience="professionals"
        settings={settings?.coursePathProfessionals}
      />
      <HomeDreamJobSection settings={settings?.dreamJob} />
      <HomePathSelectionSection settings={settings?.pathSelection} />
      <FAQSection faqs={faqs} description={faqDescription} />
    </>
  );
}
