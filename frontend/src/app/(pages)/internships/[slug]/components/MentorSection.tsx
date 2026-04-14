import InstructorCarousel from "@/app/(pages)/courses/[slug]/components/InstructorCarousel";
import { Instructor } from "@/types";

const MentorSection = ({ instructors }: { instructors: Instructor[] }) => {
  return (
    <section
      id="mentor"
      className="w-full bg-linear-to-t from-primary/2 via-primary/4 to-secondary/15"
    >
      <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 py-10 lg:py-14">
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl font-bold text-text-primary text-center">
            <span className="text-primary">Meet</span> Your Mentors
          </h1>
          <div className="mt-6 w-full flex flex-col items-center justify-center relative">
            <InstructorCarousel instructors={instructors} />
            <div className="absolute w-full h-full bg-linear-to-r from-white/40 via-transparent to-white/40 z-10 pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default MentorSection;
