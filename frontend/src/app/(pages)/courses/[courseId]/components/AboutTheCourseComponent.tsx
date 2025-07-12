import React from "react";
import { CodeXml } from "lucide-react";

const AboutTheCourseComponent = () => {
  const skills: {
    icon: React.ReactNode;
    text: string;
  }[] = [
    {
      icon: <CodeXml />,
      text: "Data Science",
    },
  ];

  return (
    <>
      <section
        id="what-will-you-learn"
        className="what-will-you-learn w-full flex flex-col gap-6"
      >
        <h2 className="text-3xl font-normal font-coolvetica">
          What will you learn?
        </h2>
        <p className="text-base font-normal">
          Lorem ipsum dolor sit amet consectetur. Orci at ultricies pellentesque
          egestas sollicitudin amet morbi tortor. Mattis odio sagittis
          ullamcorper maecenas viverra orci at. Pellentesque sed lacus felis
          consequat purus turpis purus ornare purus. At lacus sed elementum
          imperdiet. Faucibus sit massa duis arcu quis ultricies. Tellus aliquam
          enim commodo egestas rhoncus aliquet velit scelerisque amet. Commodo
          in eu mattis cras. Mus faucibus netus et aliquet. Pulvinar hendrerit
          tristique scelerisque sed eget in.
        </p>
      </section>
      <section
        id="skills-you-will-learn"
        className="skills-you-will-learn w-full flex flex-col gap-6"
      >
        <h2 className="text-3xl font-normal font-coolvetica">
          Skills you wil learn
        </h2>
        <div className="skills-card-container w-full flex gap-4 flex-wrap">
          {[...skills, ...skills, ...skills].map((skill, index) => (
            <div
              key={index}
              className="skills-card w-max bg-black/10 rounded-lg py-2.5 px-4 flex items-center gap-2"
            >
              {skill?.icon && skill?.icon}
              <div className="skills-card-text text-base font-normal">
                {skill?.text}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section
        id="why-should-you-join"
        className="why-should-you-join mt-9.5 w-full flex flex-col gap-6"
      >
        <h2 className="flex flex-col gap-2">
          <p className="text-base font-normal">Key program highlights</p>
          <span className="text-3xl font-normal font-coolvetica">
            Why should you join?
          </span>
        </h2>
        <div className="reasons-cards-container w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-10">
          {["Expert Guidance", "Expert Guidance", "Expert Guidance"].map(
            (item, index) => (
              <div
                key={index}
                className="w-full bg-white px-3 md:px-6 py-3 md:py-4 rounded-xl border-2 border-[rgb(233,117,0)] shadow-[0_0_2px_3px_rgba(233,117,0,0.3)] flex flex-col items-center justify-center gap-1.5 md:gap-2.5"
              >
                <div className="icon size-8 md:size-14">
                  <img src="/Hat.svg" alt="Hat" className="w-full h-full" />
                </div>
                <p className="text-xl md:text-2xl font-normal text-center font-coolvetica text-[#F77124]">{item}</p>
                <p className="text-xs md:text-sm font-normal text-center mt-1.5">
                  Receive guidance and mentorship from seasoned professionals
                  (having 10+ years of experience) in the field, providing
                  invaluable insights and advice.
                </p>
              </div>
            )
          )}
        </div>
      </section>
    </>
  );
};

export default AboutTheCourseComponent;
