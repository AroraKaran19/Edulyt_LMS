import Image from "next/image";
import EnquiryForm from "../courses/[slug]/components/EnquiryForm";
import { Course } from "@/types";

const ProfessionalGuidanceForm = () => {
  // Create a minimal course object for internship enquiry
  const internshipCourse: Course = {
    _id: "internship",
    title: "Internship Program",
    description: "Professional internship program",
    shortDescription: "Internship program",
    category: [],
    thumbnail: "",
    whatYouWillLearn: "",
    skills: [],
    highlights: [],
    careerPaths: [],
    skillLevel: "",
    whoShouldJoin: "",
    duration: "",
    instructor: [],
    plans: {},
    reviews: [],
    testimonials: [],
    faqs: [],
    isActive: true,
    createdBy: null,
    audience: "college-students",
    slug: "internship",
    language: "en",
  };

  return (
    <div className="px-4 lg:px-8 xl:px-12 mt-8 lg:mt-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Professional Guidance Form */}
        <div className="lg:col-span-2">
          <EnquiryForm course={internshipCourse} />
        </div>

        {/* Professional Image */}
          <div className="relative rounded-2xl shadow-lg h-full min-h-[200px]">
            <Image
              src="/assets/ProfesssionalGuidance.png"
              alt="Professional guidance"
              fill
              className="object-cover"
              priority
            />
          </div>
      </div>
    </div>
  );
};

export default ProfessionalGuidanceForm;
