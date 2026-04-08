import { Icon } from "@iconify/react";
import Image from "next/image";

interface PathSelectionContent {
  title: string;
  description: string;
}

const PathSelectionCard = ({ title, description }: PathSelectionContent) => {
  return (
    <div className="w-full max-w-lg flex flex-col gap-5">
      <div className="w-full bg-primary/10 rounded-full flex items-center gap-2.5">
        <div className="icon-container shrink-0 size-19 bg-primary text-secondary p-2 rounded-full flex items-center justify-center">
          <Icon icon="mdi:tick-circle" width="40" height="40" />
        </div>
        <div className="content-body flex flex-col p-1.5">
          <h3 className="text-base lg:text-lg font-bold capitalize">{title}</h3>
          <p className="text-sm lg:text-base text-text-secondary">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

const HomePathSelectionSection = () => {
  const pathSelectionContent: PathSelectionContent[] = [
    {
      title: "Industry-Led Mentorship",
      description: "Learn directly from professionals.",
    },
    {
      title: "Hands-On Projects",
      description: "Work on real-world problems.",
    },
    {
      title: "Internship Opportunities",
      description: "Learn directly from professionals.",
    },
    {
      title: "Career Support",
      description: "Resume, interviews, and placement.",
    },
  ];

  return (
    <section id="home-path-selection" className="w-full relative">
      <div className="absolute w-full h-full pointer-events-none">
        <Image
          src="/home/hero_bg.png"
          alt="Hero Background"
          fill
          draggable={false}
          unoptimized
          className="object-cover w-full h-full select-none opacity-10"
          quality={100}
          priority
        />
      </div>
      <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 pl-8 lg:px-12 z-10">
        <div className="content border-l-2 border-gray-300 border-dashed h-full relative px-10 lg:px-12.5 py-20 flex flex-col gap-10">
          <div className="hand-badge size-12 absolute top-18 -left-6 text-secondary bg-primary rounded-full flex items-center justify-center">
            <Icon icon="mdi:tick-circle" width="32" height="32" />
          </div>
          <div className="content-body flex flex-col gap-6">
            <h3 className="text-base lg:text-2xl font-semibold capitalize">
              It’s Time to Choose the Right Path.
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="col-span-1 flex flex-col gap-6">
                <h2 className="text-2xl lg:text-4xl font-extrabold text-text-primary capitalize">
                  Your Transformation Starts With{" "}
                  <span className="text-primary">One Decision.</span>
                </h2>
                <p className="text-sm lg:text-base font-semibold text-text-secondary">
                  We help students and professionals move from confusion to
                  clarity with expert guidance and practical learning.
                </p>
                <p className="text-sm lg:text-base font-semibold text-text-secondary">
                  Our programs are designed around real industry demands,
                  focusing on practical skills, hands-on projects, and job-ready
                  training. Everything we offer is aligned toward meaningful
                  career growth and real placement outcomes.
                </p>
              </div>
              <div className="col-span-1 flex flex-col gap-4 items-center justify-center">
                {pathSelectionContent.map((item, index) => (
                  <PathSelectionCard key={index} {...item} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomePathSelectionSection;
