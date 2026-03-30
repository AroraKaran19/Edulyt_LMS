import DifferenceSection from "./components/home-timeline/DifferenceSection";
import TimelineSectionsWrapper from "./components/home-timeline/TimelineSectionsWrapper";
import CareerConfusionSection from "./components/home-timeline/CareerConfusionSection";
import ConsultationSection from "./components/home-timeline/ConsultationSection";
import CoursesSection from "./components/home-timeline/CoursesSection";
import InternshipsSection from "./components/home-timeline/InternshipsSection";
import TestimonialsSection from "./components/home-timeline/TestimonialsSection";
import CollegesSection from "./components/home-timeline/CollegesSection";
import TrainingSection from "./components/home-timeline/TrainingSection";

import SupportSection from "./components/home-timeline/SupportSection";
import CareerPrepSection from "./components/home-timeline/CareerPrepSection";
import ManagersSection from "./components/home-timeline/ManagersSection";
import ProfessionalGrowthSection from "./components/home-timeline/ProfessionalGrowthSection";
import ProfessionalCoursesSection from "./components/home-timeline/ProfessionalCoursesSection";
import PlacementSection from "./components/home-timeline/PlacementSection";
import TransformationSection from "./components/home-timeline/TransformationSection";
import FAQSection from "./(pages)/internships/components/FAQSection";

const HomePage = () => {
  return (
    <div className="bg-[#fffcfa]">
      <DifferenceSection />
      <TimelineSectionsWrapper className="bg-[#fffcfa] left-0 sm:left-28 pt-10">
        <CareerConfusionSection />
        <div className="h-4 sm:h-4" aria-hidden />
        <ConsultationSection />
        <div className="h-4 sm:h-4" aria-hidden />
        <CoursesSection />
        <div className="h-4 sm:h-4" aria-hidden />
        <InternshipsSection />
        <div className="h-4 sm:h-4" aria-hidden />
        <TestimonialsSection />
        <div className="h-4 sm:h-4" aria-hidden />
        <CollegesSection />
        <div className="h-4 sm:h-4" aria-hidden />
        <TrainingSection />
        <div className="h-4 sm:h-4" aria-hidden />
        <SupportSection />
        <div className="h-4 sm:h-4" aria-hidden />
        <CareerPrepSection />
        <div className="h-4 sm:h-4" aria-hidden />
        <ManagersSection />
        <div className="h-4 sm:h-4" aria-hidden />
        <ProfessionalGrowthSection />
        <div className="h-4 sm:h-4" aria-hidden />
        <ProfessionalCoursesSection />
        <div className="h-4 sm:h-4" aria-hidden />
        <PlacementSection />
        <div className="h-4 sm:h-4" aria-hidden />
        <TransformationSection />
      </TimelineSectionsWrapper>
      <FAQSection />
    </div>
  );
};

export default HomePage;
