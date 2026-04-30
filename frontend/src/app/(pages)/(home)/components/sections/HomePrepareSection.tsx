import { Icon } from "@iconify/react";
import type {
  HomeIconTitleCard,
  HomePrepareSectionSettings,
} from "@/types/home-page-settings";

interface PrepareContent {
  title: string;
  description: string;
  icon: string;
}

const DEFAULT_ITEMS: HomeIconTitleCard[] = [
  {
    title: "1:1 Mentorship Sessions",
    description:
      "Personalised support to prepare you for real job opportunities.",
    icon: "material-symbols:communication-rounded",
  },
  {
    title: "Mock Interviews",
    description:
      "Practice real interview scenarios and improve problem-solving skills.",
    icon: "icon-park-solid:communication",
  },
  {
    title: "Resume & Profile Review",
    description:
      "Get your resume reviewed by industry experts and improve your job visibility.",
    icon: "mdi:resume",
  },
  {
    title: "Soft Skills & Career Training",
    description: "Improve communication, confidence, and interview presence.",
    icon: "material-symbols:star-rounded",
  },
];

const PrepareCard = ({ title, description, icon }: PrepareContent) => {
  return (
    <div className="w-full flex flex-col gap-5">
      <div className="w-full bg-primary/10 rounded-full flex items-center gap-2.5">
        <div className="icon-container shrink-0 size-15 bg-primary text-secondary p-2 rounded-full flex items-center justify-center">
          <Icon icon={icon} width="40" height="40" />
        </div>
        <div className="content-body flex flex-wrap p-2">
          <h3 className="text-base lg:text-lg font-bold capitalize">{title}</h3>
        </div>
      </div>
      <p className="text-sm lg:text-base text-text-secondary">{description}</p>
    </div>
  );
};

const HomePrepareSection = ({
  settings,
}: {
  settings?: HomePrepareSectionSettings;
}) => {
  const prepareContent: PrepareContent[] =
    settings?.items && settings.items.length > 0
      ? settings.items
      : DEFAULT_ITEMS;
  const eyebrow = settings?.eyebrow || "Everything You Need to Succeed";
  const headingPrefix =
    settings?.headingPrefix || "We Don’t Just Train, We";
  const headingHighlight = settings?.headingHighlight || "Prepare You.";

  return (
    <section
      id="home-prepare"
      className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 pl-8 lg:px-12"
    >
      <div className="content border-l-2 border-gray-300 border-dashed h-full relative px-10 lg:px-12.5 py-20 flex flex-col gap-10">
        <div className="hand-badge size-12 absolute top-18 -left-6 text-secondary bg-primary rounded-full flex items-center justify-center">
          <Icon icon="famicons:bulb-sharp" width="32" height="32" />
        </div>
        <div className="content-body flex flex-col gap-6">
          <h3 className="text-base lg:text-2xl font-semibold capitalize">
            {eyebrow}
          </h3>
          <h2 className="text-2xl lg:text-4xl font-extrabold text-text-primary capitalize text-balance">
            {headingPrefix}{" "}
            <span className="text-primary">{headingHighlight}</span>
          </h2>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {prepareContent.map((item, index) => (
              <PrepareCard key={index} {...item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomePrepareSection;
