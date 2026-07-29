import { Icon } from "@iconify/react";
import Image from "next/image";
import type { HomeStudentSectionSettings } from "@/types/home-page-settings";

const ConfusionBadge = ({ title }: { title: string }) => {
  return (
    <div className="w-full max-w-xs shrink-0 bg-primary/10 rounded-full flex items-center gap-2.5 relative -translate-x-5 lg:-translate-y-5">
      <div className="icon-container size-10 bg-primary text-secondary p-2 rounded-full flex items-center justify-center">
        <Icon icon="stash:question-solid" width="32" height="32" />
      </div>
      <div className="content-body ">
        <h3 className="text-base font-normal capitalize">{title}</h3>
      </div>
    </div>
  );
};

const DEFAULT_PROMPTS = [
  "What should I do next?",
  "How do I get a good job?",
  "What skills should I learn?",
  "Am I already too late?",
];

const HomeStudentSection = ({
  settings,
}: {
  settings?: HomeStudentSectionSettings;
}) => {
  const clarityData =
    settings?.confusionPrompts && settings.confusionPrompts.length > 0
      ? settings.confusionPrompts
      : DEFAULT_PROMPTS;
  const badgeLabel = settings?.badgeLabel || "Hello Students";
  const headingPrefix =
    settings?.headingPrefix || "Are you feeling confused about your";
  const headingHighlight = settings?.headingHighlightCareer || "career?";
  const helpCtaText =
    settings?.helpCtaText || "Talk to our professionals and get clarity.";
  const imageSrc = settings?.imageSrc || "/home/clarity_image.png";
  const imageAlt = settings?.imageAlt || "";

  return (
    <section
      id="home-student"
      className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 pl-8 lg:px-12 pt-10"
    >
      <div className="content border-l-2 border-gray-300 border-dashed h-full relative px-10 lg:px-12.5 pb-20 flex flex-col gap-10">
        <div className="hand-badge size-12 absolute top-2 -left-6 text-secondary bg-primary rounded-full flex items-center justify-center">
          <Icon icon="mdi:hand-wave" width="32" height="32" />
        </div>
        <div className="content-body max-w-md h-full flex flex-col gap-10 mb-5">
          <h3 className="text-2xl font-bold">{badgeLabel}</h3>
          <h2 className="text-4xl font-extrabold capitalize text-balance">
            {headingPrefix}{" "}
            <span className="text-orange-500">{headingHighlight}</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 items-end gap-10 lg:gap-4 overflow-visible">
          <div className="clarify-section col-span-1 lg:col-span-3 border-l-2 border-gray-300 border-dashed h-full flex flex-col gap-6 relative">
            {clarityData.map((item, index) => {
              if (index === 0) {
                return (
                  <span key={index} className="w-full flex items-center">
                    <ConfusionBadge key={index} title={item} />
                    <span className="hidden lg:block w-full max-w-sm -translate-y-5 -translate-x-5 border-t-2 border-dashed border-gray-300 align-middle relative">
                      <span className="absolute top-1/2 right-0 -translate-y-1/2 icon-container size-10 bg-primary text-secondary p-2 rounded-full flex items-center justify-center">
                        <Icon
                          icon="mdi:thinking"
                          width="32"
                          height="32"
                          className="size-full"
                        />
                      </span>
                    </span>
                  </span>
                );
              }
              return <ConfusionBadge key={index} title={item} />;
            })}
            {/* Mobile help container */}
            <span className="lg:hidden help-container translate-y-10 lg:shrink-0 rounded-full flex items-center bg-[#CEFFD2] gap-2.5 pr-16">
              <div className="icon-container size-10 bg-[#59CC62] text-secondary p-2 rounded-full flex items-center justify-center">
                <Icon icon="fa7-brands:kakao-talk" width="32" height="32" />
              </div>
              <span className="text-xs lg:text-base font-semibold text-wrap capitalize">
                {helpCtaText}
              </span>
            </span>
            {/* Desktop help container */}
            <span className="hidden lg:flex w-full items-center">
              <span className="absolute bottom-0 translate-y-4 lg:translate-y-5 flex items-center">
                <span className="hidden lg:block border-b-2 border-dashed border-gray-300 w-full min-w-[30px]" />
                <span className="help-container lg:shrink-0 rounded-full flex items-center bg-[#CEFFD2] gap-2.5 pr-16 relative">
                  <div className="icon-container size-10 bg-[#59CC62] text-secondary p-2 rounded-full flex items-center justify-center">
                    <Icon icon="fa7-brands:kakao-talk" width="32" height="32" />
                  </div>
                  <span className="text-xs lg:text-base font-semibold text-wrap capitalize">
                    Talk to our professionals and get clarity.
                  </span>
                </span>
              </span>
            </span>
          </div>
          <div className="col-span-1 lg:col-span-2 relative w-full overflow-visible">
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={800}
              height={600}
              className="hidden lg:block relative lg:absolute bottom-0 right-0 z-0 h-[min(520px,82vh)] w-[600px] max-w-none object-contain object-bottom-right opacity-95 select-none pointer-events-none mask-[linear-gradient(to_right,transparent_0%,black_32%,black_68%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_32%,black_68%,transparent_100%)]"
              sizes="(max-width: 1024px) 90vw, 40vw"
              unoptimized
              draggable={false}
              quality={100}
              loading="lazy"
            />
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={800}
              height={600}
              sizes="(max-width: 1024px) 90vw, 40vw"
              unoptimized
              draggable={false}
              quality={100}
              loading="lazy"
              className="block lg:hidden"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeStudentSection;
