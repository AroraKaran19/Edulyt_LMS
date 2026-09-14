"use client";

import type { HomePageSettings } from "@/types/home-page-settings";
import { faqItems } from "@/constants/faq";
import HomeStudentSection from "./sections/HomeStudentSection";
import HomeCoursePath from "./sections/HomeCoursePath";
import HomeFutureManagerSection from "./sections/HomeFutureManagerSection";
import HomeIndustrySection from "./sections/HomeIndustrySection";
import HomePrepareSection from "./sections/HomePrepareSection";
import HomeSupportSection from "./sections/HomeSupportSection";
import HomeTestimonialSection from "./sections/HomeTestimonialSection";
import HomeTrainingSection from "./sections/HomeTrainingSection";
import InstitutionSection from "./sections/InstitutionSection";
import HomeDreamJobSection from "./sections/HomeDreamJobSection";
import FAQSection from "../../programs/[slug]/components/FAQSection";

export default function HomeSectionsFold({
  settings,
}: {
  /** Server-fetched CMS settings; `{}` when the API is unreachable. */
  settings: HomePageSettings;
}) {
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
      <HomeTestimonialSection settings={settings?.testimonial} />
      <InstitutionSection settings={settings?.institutions} />
      <HomeTrainingSection settings={settings?.training} />
      <HomeSupportSection settings={settings?.support} />
      <HomePrepareSection settings={settings?.prepare} />
      <HomeFutureManagerSection settings={settings?.futureManagers} />
      <HomeDreamJobSection settings={settings?.dreamJob} />
      <FAQSection faqs={faqs} description={faqDescription} />
    </>
  );
}
