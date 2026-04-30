import { Icon } from "@iconify/react";
import InstituteCard from "../InstituteCard";
import type {
  HomeInstitutionSectionSettings,
  HomePageInstitute,
} from "@/types/home-page-settings";

const DEFAULT_INSTITUTES: HomePageInstitute[] = [
    {
      image: "/home/InstituteDummy.png",
      name: "Harvard University",
      line1: "Internship Participation",
      internship_student_count: 100,
      line2: "Courses Enrollment",
      course_student_count: 100,
    },
    {
      image: "/home/InstituteDummy.png",
      name: "Harvard University",
      line1: "Internship Participation",
      internship_student_count: 100,
      line2: "Courses Enrollment",
      course_student_count: 100,
    },
    {
      image: "/home/InstituteDummy.png",
      name: "Harvard University",
      line1: "Internship Participation",
      internship_student_count: 100,
      line2: "Courses Enrollment",
      course_student_count: 100,
    },

    {
      image: "/home/InstituteDummy.png",
      name: "Harvard University",
      line1: "Internship Participation",
      internship_student_count: 100,
      line2: "Courses Enrollment",
      course_student_count: 100,
    },
    {
      image: "/home/InstituteDummy.png",
      name: "Harvard University",
      line1: "Internship Participation",
      internship_student_count: 100,
      line2: "Courses Enrollment",
      course_student_count: 100,
    },
    {
      image: "/home/InstituteDummy.png",
      name: "Harvard University",
      line1: "Internship Participation",
      internship_student_count: 100,
      line2: "Courses Enrollment",
      course_student_count: 100,
    },
];

const InstitutionSection = ({
  settings,
}: {
  settings?: HomeInstitutionSectionSettings;
}) => {
  const institutes =
    settings?.institutes && settings.institutes.length > 0
      ? settings.institutes
      : DEFAULT_INSTITUTES;
  const eyebrow =
    settings?.eyebrow || "Trusted by Students from Top Institutions";
  const headingHighlight = settings?.headingHighlight || "Colleges our";
  const headingRest = settings?.headingRest || "students comes from";
  const body =
    settings?.body ||
    "Students from diverse academic backgrounds and leading colleges have joined our internship to gain real industry experience and practical skills. Here are some of the institutes our past interns come from.";

  return (
    <section
      id="home-institution"
      className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 pl-8 lg:px-12"
    >
      <div className="content border-l-2 border-gray-300 border-dashed h-full relative px-10 lg:px-12.5 py-20 flex flex-col gap-10">
        <div className="hand-badge size-12 absolute top-18 -left-6 text-secondary bg-primary rounded-full flex items-center justify-center">
          <Icon icon="eos-icons:trusted-organization" width="32" height="32" />
        </div>
        <div className="content-body flex flex-col gap-6">
          <h3 className="text-base lg:text-2xl font-semibold capitalize">
            {eyebrow}
          </h3>
          <h2 className="text-2xl lg:text-4xl max-w-6xl font-extrabold text-text-primary text-balance">
            <span className="text-primary">{headingHighlight}</span> {headingRest}
          </h2>
          <p className="text-sm lg:text-base text-text-secondary max-w-4xl">
            {body}
          </p>

          <div className="institutes grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {institutes.map((institute, index) => (
              <InstituteCard key={index} institute={institute} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default InstitutionSection;
