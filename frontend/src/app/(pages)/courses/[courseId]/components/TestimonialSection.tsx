import { cn } from "@/lib/utils";
import React from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import TestimonialCarousel from "./TestimonialCarousel";

const plusJakartaSans = Plus_Jakarta_Sans({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700", "800"],
})

const TestimonialSection = () => {

	const howItHelped = [
		{
			title: "50%",
			subtitle: "Average salary hike",
		},
		{
			title: "1000+",
			subtitle: "Hiring Companies",
		},
		{
			title: "3/4",
			subtitle: "Learner in this role",
		},
		{
			title: "1800+",
			subtitle: "Shift to leaders",
		},
	]

  return (
    <section
      id="testimonials"
      className="testimonial-section w-full bg-white rounded-2xl py-4 px-8 lg:px-[13%] md:py-10 flex flex-col items-center justify-center gap-8"
    >
      <div className="w-full h-0.75 bg-[linear-gradient(90deg,rgba(246,110,33,0)_0%,#F66E21_53%,rgba(246,110,33,0)_100%)]" />
      <h2 className="testimonial-header w-full text-2xl md:text-4xl font-bold font-coolvetica tracking-wide text-center">
        Our learners <span className="text-[#F66E21]">transformed</span> <br />
        their careers
      </h2>
      <div className="how-it-helped w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {howItHelped.map((item, index) => (
          <div key={index} className="how-it-helped-item w-full py-4 flex flex-col gap-1.5 items-center justify-center border-2 border-gray-200 rounded-2xl">
            <h3 className={cn("text-2xl md:text-4xl font-extrabold font-coolvetica tracking-wide", plusJakartaSans.className)}>{item.title}</h3>
            <p className={cn("text-base font-normal text-center", plusJakartaSans.className)}>{item.subtitle}</p>
          </div>
        ))}
      </div>
      <div className="testimonial-cards w-full flex flex-col items-center justify-center">
				<TestimonialCarousel />
      </div>
    </section>
  );
};

export default TestimonialSection;
