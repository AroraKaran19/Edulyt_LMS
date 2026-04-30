import { Instructor, Internship } from "@/types";
import InternshipHeader from "./components/InternshipHeader";
import EnquirySection from "./components/EnquirySection";
import PerksSection from "./components/PerksSection";
import InternshipFeatureSection from "./components/InternshipFeatureSection";
import WhyJoinSection from "./components/WhyJoinSection";
import PreRequisitesSection from "./components/PreRequisitesSection";
import MentorSection from "./components/MentorSection";

const InternshipPage = ({ internship }: { internship: Internship }) => {
  return (
    <div
      className={`${internship?.slug}-internship-page w-full min-h-[calc(100dvh-78px)] flex flex-col`}
    >
      <InternshipHeader internship={internship} />
      <EnquirySection internship={internship} />
      <PerksSection perks={internship.perks} />
      <InternshipFeatureSection features={internship.features} />
      <WhyJoinSection whyJoin={internship.whyJoin} />
      <PreRequisitesSection preRequisites={internship.preRequisites} whoCanJoin={internship.whoCanJoin} />
      <MentorSection instructors={internship.mentors as Instructor[]} />
    </div>
  );
};

export default InternshipPage;
