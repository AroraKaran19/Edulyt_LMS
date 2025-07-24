import SectionContainer from "@/components/ui/course/SectionContainer";
import OrangeButton from "@/components/ui/OrangeButton";
import React from "react";
import Link from "next/link";
import VerticalCarousel from "../../components/VerticalCarousel";

const VerticalCarouselSection = () => {
  return (
    <SectionContainer
      id="explore"
      className="!py-0 flex-col md:flex-row gap-10"
    >
      <div className="section-header w-full md:w-2/5 flex flex-col gap-2 p-5 my-auto">
        <h2 className="text-5xl font-extrabold font-coolvetica">
          Take next step to <br /> your{" "}
          <span className="text-[#F77124] italic">Carreer!</span>
        </h2>
        <OrangeButton className="mt-5 px-8 w-fit">
          <Link
            href="/courses"
            className="text-white font-bold text-sm md:text-base"
          >
            Explore courses
          </Link>
        </OrangeButton>
      </div>
      <div className="vertical-carousel w-full md:w-3/5">
        <VerticalCarousel />
      </div>
    </SectionContainer>
  );
};

export default VerticalCarouselSection;
