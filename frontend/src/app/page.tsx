import HeroSection from "./(pages)/components/HeroSection";
import ProfessionalGuidanceForm from "./(pages)/components/ProfessionalGuidanceForm";
import PerksSection from "./(pages)/components/PerksSection";
import InternshipFeaturesCarousel from "./(pages)/components/InternshipFeaturesCarousel";
import WhyJoinSection from "./(pages)/components/WhyJoinSection";
import PrerequisitesSection from "./(pages)/components/PrerequisitesSection";
import MentorsProfileSection from "./(pages)/components/MentorsProfileSection";

const HomePage = () => {
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
    </div>
  );
};

export default HomePage;
