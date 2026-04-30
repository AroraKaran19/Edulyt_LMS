import { Icon } from "@iconify/react";
import Image from "next/image";
import type {
  HomeIconTitleCard,
  HomeTrainingSectionSettings,
} from "@/types/home-page-settings";

interface TrainingContent {
  title: string;
  description: string;
  icon: string;
}

const DEFAULT_PILLARS: HomeIconTitleCard[] = [
  {
    title: "Learn",
    description:
      "Master concepts through structured courses designed by industry experts. Follow a clear roadmap instead of random tutorials.",
    icon: "streamline-plump:global-learning-solid",
  },
  {
    title: "Build",
    description:
      "Work on real-world projects using real data.Gain hands-on experience that companies actually value.",
    icon: "material-symbols:build-rounded",
  },
  {
    title: "Launch",
    description:
      "Get internship opportunities, career guidance, and placement support to confidently step into your dream role.",
    icon: "material-symbols:rocket-launch",
  },
];

const TrainingCard = ({ title, description, icon }: TrainingContent) => {
  return (
    <div className="w-full flex flex-col gap-5">
      <div className="w-full bg-primary/10 rounded-full flex items-center gap-2.5">
        <div className="icon-container shrink-0 size-12.5 bg-primary text-secondary p-2 rounded-full flex items-center justify-center">
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

const HomeTrainingSection = ({
  settings,
}: {
  settings?: HomeTrainingSectionSettings;
}) => {
  const trainingContent: TrainingContent[] =
    settings?.pillars && settings.pillars.length > 0
      ? settings.pillars
      : DEFAULT_PILLARS;
  const eyebrow = settings?.eyebrow || "What Makes Our Training Different?";
  const line1 = settings?.headingLine1 || "A";
  const highlight1 = settings?.headingHighlight1 || "Career-Focused";
  const line2 = settings?.headingLine2 || "Learning Model to Make You";
  const highlight2 = settings?.headingHighlight2 || "Job-Ready";
  const imageSrc = settings?.imageSrc || "/home/training.jpg";
  const imageAlt = settings?.imageAlt || "training";

  return (
    <section
      id="home-training"
      className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 pl-8 lg:px-12"
    >
      <div className="content border-l-2 border-gray-300 border-dashed h-full relative px-10 lg:px-12.5 py-20 flex flex-col gap-10">
        <div className="hand-badge size-12 absolute top-18 -left-6 text-secondary bg-primary rounded-full flex items-center justify-center">
          <Icon icon="mdi:teach-poll" width="32" height="32" />
        </div>
        <div className="content-body flex flex-col gap-6">
          <h3 className="text-base lg:text-2xl font-semibold capitalize">
            {eyebrow}
          </h3>
          <h2 className="text-2xl lg:text-4xl font-extrabold text-text-primary capitalize max-w-full lg:max-w-3xl">
            {line1} <span className="text-primary">{highlight1}</span> {line2}{" "}
            <span className="text-primary">{highlight2}</span>
          </h2>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="col-span-1 flex flex-col gap-5 max-w-lg">
              {trainingContent.map((item, index) => (
                <TrainingCard key={index} {...item} />
              ))}
            </div>
            <div className="col-span-1">
              <Image
                src={imageSrc}
                alt={imageAlt}
                width={500}
                height={500}
                className="w-full h-full object-cover rounded-2xl select-none pointer-events-none mask-[linear-gradient(to_right,transparent_0%,black_32%,black_68%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_32%,black_68%,transparent_100%)]"
                unoptimized
                draggable={false}
                quality={100}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeTrainingSection;
