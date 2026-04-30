import { Icon } from "@iconify/react";
import type { HomeSupportSectionSettings } from "@/types/home-page-settings";

const DEFAULT_HIGHLIGHTS: { title: string; description: string }[] = [
  {
    title: "Instant 1:1 doubt support",
    description:
      "Get personalised guidance through live sessions, chat support, and expert mentorship to solve your doubts quickly and effectively.",
  },
  {
    title: "200+ Mentors helping learners grow faster",
    description:
      "Get personalised guidance through live sessions, chat support, and expert mentorship to solve your doubts quickly and effectively.",
  },
  {
    title: "5/5 satisfaction rating from our students",
    description:
      "Get personalised guidance through live sessions, chat support, and expert mentorship to solve your doubts quickly and effectively.",
  },
];

const HomeSupportSection = ({
  settings,
}: {
  settings?: HomeSupportSectionSettings;
}) => {
  const eyebrow = settings?.eyebrow || "We are Always here for your help with";
  const highlights =
    settings?.highlights && settings.highlights.length > 0
      ? settings.highlights
      : DEFAULT_HIGHLIGHTS;
  return (
    <section
      id="home-support"
      className="w-full from-primary/10 via-secondary/5 to-transparent bg-linear-to-tr"
    >
      <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 pl-8 lg:px-12">
        <div className="content border-l-2 border-gray-300 border-dashed h-full relative px-10 lg:px-12.5 py-20 flex flex-col gap-10">
          <div className="hand-badge size-12 absolute top-18 -left-6 text-secondary bg-primary rounded-full flex items-center justify-center">
            <Icon
              icon="material-symbols:contact-support"
              width="32"
              height="32"
            />
          </div>
          <div className="content-body flex flex-col gap-6">
            <h3 className="text-base lg:text-2xl font-semibold">{eyebrow}</h3>
            {highlights.map((h, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <h2 className="text-2xl lg:text-[42px] font-bold text-text-primary max-w-full lg:max-w-4xl">
                  {h.title}
                </h2>
                <p
                  className={`text-sm lg:text-base font-semibold text-text-secondary max-w-xl ${
                    idx < highlights.length - 1 ? "mb-10 lg:mb-15" : ""
                  }`}
                >
                  {h.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeSupportSection;
