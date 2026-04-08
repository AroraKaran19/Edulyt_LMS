import TestimonialCard from "@/app/(pages)/courses/[slug]/components/TestimonialCard";
import TestimonialCarousel from "@/app/(pages)/courses/[slug]/components/TestimonialCarousel";
import { Testimonial } from "@/types";
import { Icon } from "@iconify/react";

const HomeTestimonialSection = () => {
  const testimonials: Testimonial[] = [
    {
      name: "John Doe",
      currentRole: "Software Engineer",
      currentCompany: "Google",
      linkedin: "https://www.linkedin.com/in/john-doe",
      feedback: "I love the course and it helped me get a job at Google.",
      college: "University of California, Los Angeles",
      collegeUrl: "https://www.ucla.edu",
      collegeProfileUrl: "https://www.ucla.edu/profile/john-doe",
      pastRole: "Software Engineer",
      pastCompany: "Apple",
    },
    {
      name: "John Doe",
      currentRole: "Software Engineer",
      currentCompany: "Google",
      linkedin: "https://www.linkedin.com/in/john-doe",
      feedback: "I love the course and it helped me get a job at Google.",
      college: "University of California, Los Angeles",
      collegeUrl: "https://www.ucla.edu",
      collegeProfileUrl: "https://www.ucla.edu/profile/john-doe",
      pastRole: "Software Engineer",
      pastCompany: "Apple",
    },
    {
      name: "John Doe",
      currentRole: "Software Engineer",
      currentCompany: "Google",
      linkedin: "https://www.linkedin.com/in/john-doe",
      feedback: "I love the course and it helped me get a job at Google.",
      college: "University of California, Los Angeles",
      collegeUrl: "https://www.ucla.edu",
      collegeProfileUrl: "https://www.ucla.edu/profile/john-doe",
      pastRole: "Software Engineer",
      pastCompany: "Apple",
    },
  ];

  return (
    <section
      id="home-testimonial"
      className="w-full from-primary/10 via-secondary/5 to-transparent bg-linear-to-tr"
    >
      <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 pl-8 lg:px-12">
        <div className="content border-l-2 border-gray-300 border-dashed h-full relative px-10 pr-6 lg:px-12.5 py-20 flex flex-col gap-10">
          <div className="hand-badge size-12 absolute top-18 -left-6 text-secondary bg-primary rounded-full flex items-center justify-center">
            <Icon icon="solar:heart-bold" width="32" height="32" />
          </div>
          <div className="content-body flex flex-col gap-6">
            <h3 className="text-base lg:text-2xl font-semibold capitalize">
              Hear from our past students
            </h3>
            <h2 className="text-2xl lg:text-4xl max-w-6xl font-extrabold text-text-primary text-balance">
              Students who started{" "}
              <span className="text-primary">just like you</span> are now placed
              in <span className="text-primary">leading companies.</span>
            </h2>

            <TestimonialCarousel testimonials={testimonials} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeTestimonialSection;
