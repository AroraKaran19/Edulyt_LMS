import HomeStudentSection from "./components/sections/HomeStudentSection";
import HomeCoursePath from "./components/sections/HomeCoursePath";
import HomeFutureManagerSection from "./components/sections/HomeFutureManagerSection";
import HomeHeroSection from "./components/sections/HomeHeroSection";
import HomeIndustrySection from "./components/sections/HomeIndustrySection";
import HomeInternshipPath from "./components/sections/HomeInternshipPath";
import HomePrepareSection from "./components/sections/HomePrepareSection";
import HomeSupportSection from "./components/sections/HomeSupportSection";
import HomeTestimonialSection from "./components/sections/HomeTestimonialSection";
import HomeTrainingSection from "./components/sections/HomeTrainingSection";
import InstitutionSection from "./components/sections/InstitutionSection";
import HomeProfessionalSection from "./components/sections/HomeProfessionalSection";
import HomeDreamJobSection from "./components/sections/HomeDreamJobSection";
import HomePathSelectionSection from "./components/sections/HomePathSelectionSection";
import FAQSection from "../courses/[slug]/components/FAQSection";
import { faqItems } from "@/constants/faq";

const Homepage = () => {
  return (
    <div className="w-full">
      <HomeHeroSection />
      <HomeStudentSection />
      <HomeIndustrySection />
      <HomeCoursePath
        title="We Have Two Powerful Paths for You"
        audience="college-students"
      />
      <HomeInternshipPath />
      <HomeTestimonialSection />
      <InstitutionSection />
      <HomeTrainingSection />
      <HomeSupportSection />
      <HomePrepareSection />
      <HomeFutureManagerSection />
      <HomeProfessionalSection />
      <HomeCoursePath
        title="Switch to Tech with Industry-Focused Programs"
        audience="professionals"
      />
      <HomeDreamJobSection />
      <HomePathSelectionSection />
      <FAQSection
        faqs={faqItems}
        description="Dive into Artifical Intelligence & Machine Learning projects to sharpen skills and build a unique portfolio"
      />
    </div>
  );
};

export default Homepage;
