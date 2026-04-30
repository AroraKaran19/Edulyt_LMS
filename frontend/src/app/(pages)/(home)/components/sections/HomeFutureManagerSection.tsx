import InstructorCarousel from "@/app/(pages)/courses/[slug]/components/InstructorCarousel";
import { Instructor } from "@/types";
import { Icon } from "@iconify/react";
import type { HomeFutureManagerSectionSettings } from "@/types/home-page-settings";

const DEFAULT_INSTRUCTORS: Partial<Instructor>[] = [
    {
      firstName: "John",
      lastName: "Doe",
      profilePicture: "/home/dummy_instructor.png",
      currentPosition: "Senior Manager ",
      currentCompany: "Bank of America",
      linkedinUrl: "https://www.linkedin.com/in/john-doe",
      industry: "Banking & Financial Services",
      bio: "Specializes in leading high-impact projects, team coordination, and delivering industry-ready training.",
    },
    {
      firstName: "John",
      lastName: "Doe",
      profilePicture: "/home/dummy_instructor.png",
      currentPosition: "Senior Manager ",
      currentCompany: "Bank of America",
      linkedinUrl: "https://www.linkedin.com/in/john-doe",
      industry: "Banking & Financial Services",
      bio: "Specializes in leading high-impact projects, team coordination, and delivering industry-ready training.",
    },
    {
      firstName: "John",
      lastName: "Doe",
      profilePicture: "/home/dummy_instructor.png",
      currentPosition: "Senior Manager ",
      currentCompany: "Bank of America",
      linkedinUrl: "https://www.linkedin.com/in/john-doe",
      industry: "Banking & Financial Services",
      bio: "Specializes in leading high-impact projects, team coordination, and delivering industry-ready training.",
    },
];

const HomeFutureManagerSection = ({
  settings,
}: {
  settings?: HomeFutureManagerSectionSettings;
}) => {
  const instructors: Partial<Instructor>[] =
    settings?.instructors && settings.instructors.length > 0
      ? settings.instructors
      : DEFAULT_INSTRUCTORS;
  const eyebrow = settings?.eyebrow || "Know Your Future Managers";
  const headingLearn = settings?.headingLearn || "Learn";
  const headingHire = settings?.headingHire || "From The People Who Hire.";

  return (
    <section
      id="home-future-manager"
      className="w-full from-primary/10 via-secondary/5 to-transparent bg-linear-to-tr"
    >
      <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 pl-8 lg:px-12">
        <div className="content border-l-2 border-gray-300 border-dashed h-full relative px-10 lg:px-12.5 py-20 flex flex-col gap-10">
          <div className="hand-badge size-12 absolute top-18 -left-6 text-secondary bg-primary rounded-full flex items-center justify-center">
            <Icon icon="mdi:teach-poll" width="32" height="32" />
          </div>
          <div className="content-body flex flex-col gap-6">
            <h3 className="text-base lg:text-2xl font-semibold capitalize">
              Know Your Future Managers
            </h3>
            <h2 className="text-2xl lg:text-4xl font-extrabold text-text-primary capitalize text-balance">
              <span className="text-primary">Learn</span> From The People Who{" "}
              <span className="text-primary">Hire.</span>
            </h2>
            <div className="mt-6 w-full flex flex-col items-center justify-center relative">
              <InstructorCarousel instructors={instructors as Instructor[]} />
              <div className="absolute w-full h-full bg-linear-to-r from-white/40 via-transparent to-white/40 z-10 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeFutureManagerSection;
