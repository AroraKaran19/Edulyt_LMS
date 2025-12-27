import HeroSection from "../components/HeroSection";
import ProfessionalGuidanceForm from "../components/ProfessionalGuidanceForm";
import PerksSection from "../components/PerksSection";
import InternshipFeaturesCarousel from "../components/InternshipFeaturesCarousel";
import WhyJoinSection from "../components/WhyJoinSection";
import PrerequisitesSection from "../components/PrerequisitesSection";
import MentorsProfileSection from "../components/MentorsProfileSection";
import InternshipJourneySection from "../components/InternshipJourneySection";
import LearnersTestimonialsSection from "../components/LearnersTestimonialsSection";
import ExploreCoursesSection from "../components/ExploreCoursesSection";
import CollegesSection from "../components/CollegesSection";
import MediaCertificateSection from "../components/MediaCertificateSection";
import KnowYourManagersSection from "../components/KnowYourManagersSection";
import FAQSection from "../components/FAQSection";

const InternshipPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content Section */}
      {/* Hero Section with Internship Details */}
      <HeroSection />

      {/* Bottom Section */}
      <ProfessionalGuidanceForm />

      {/* Perks of Internship Section */}
      <PerksSection />

      {/* Internship Features Section */}
      <InternshipFeaturesCarousel />

      {/* Why Join This Internship Section */}
      <WhyJoinSection />

      {/* Pre-Requisites Section */}
      <PrerequisitesSection />

      {/* Our Mentors Profile Section */}
      <MentorsProfileSection />

      {/* Internship Journey Section */}
      <InternshipJourneySection />

      {/* Learners Testimonials Section */}
      <LearnersTestimonialsSection />

      {/* Explore Courses Section */}
      <ExploreCoursesSection />

      {/* Colleges Section */}
      <CollegesSection />

      {/* Media Certificate Section */}
      <MediaCertificateSection />

      {/* Know Your Future Managers Section */}
      <KnowYourManagersSection />

      {/* FAQ Section */}
      <FAQSection />
    </div>
  );
};

export default InternshipPage;
