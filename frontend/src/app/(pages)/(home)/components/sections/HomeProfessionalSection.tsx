import { Icon } from "@iconify/react";
import Image from "next/image";
import type { HomeProfessionalSectionSettings } from "@/types/home-page-settings";

const DEFAULT_PROMPTS = [
  "Stuck in a Non-Tech Job?",
  "Working in a Low-Salary Role?",
  "Want to Switch to Tech?",
  "Looking to Upskill for Higher Pay?",
];

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

const HomeProfessionalSection = ({
  settings,
}: {
  settings?: HomeProfessionalSectionSettings;
}) => {
  const clarityData =
    settings?.promptBullets && settings.promptBullets.length > 0
      ? settings.promptBullets
      : DEFAULT_PROMPTS;
  const eyebrow = settings?.eyebrow || "Your Career Path Doesn\u2019t End Here";
  const line1 = settings?.headingLine1 || "Not a";
  const highlightStudent =
    settings?.headingHighlightStudent || "Student Anymore?";
  const line2 = settings?.headingLine2 || "Already Working,";
  const highlightWorking = settings?.headingHighlightWorking || "But Not Growing?";
  const helpCtaText =
    settings?.helpCtaText || "We have professional courses for you";
  const imageSrc = settings?.imageSrc || "/home/profession_path.png";
  const imageAlt = settings?.imageAlt || "";

  return (
    <section
      id="home-clarity"
      className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 pl-8 lg:px-12"
    >
      <div className="content border-l-2 border-gray-300 border-dashed h-full relative px-10 lg:px-12.5 py-20 flex flex-col gap-10">
        <div className="hand-badge size-12 absolute top-18 -left-6 text-secondary bg-primary rounded-full flex items-center justify-center">
          <Icon icon="game-icons:think" width="32" height="32" />
        </div>
        <div className="content-body max-w-md h-full flex flex-col gap-10 mb-5">
          <h3 className="text-base lg:text-2xl font-semibold capitalize">
            {eyebrow}
          </h3>
          <h2 className="text-2xl lg:text-4xl font-extrabold capitalize text-balance">
            {line1}{" "}
            <span className="text-primary">{highlightStudent}</span>{" "}
            {line2}{" "}
            <span className="text-primary">{highlightWorking}</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 items-end gap-10 lg:gap-4 overflow-visible">
          <div className="clarify-section col-span-1 lg:col-span-3 border-l-2 border-gray-300 border-dashed h-full flex flex-col gap-6 relative">
            {clarityData.map((item, index) => {
              if (index === 0) {
                return (
                  <span
                    key={index}
                    className="w-full flex items-center relative"
                  >
                    <span className="absolute w-full max-w-[40px] lg:max-w-[54px] -translate-y-5 -translate-x-full border-t-2 border-dashed border-gray-300 align-middle"></span>
                    <ConfusionBadge key={index} title={item} />
                  </span>
                );
              }
              return <ConfusionBadge key={index} title={item} />;
            })}
            {/* Mobile help container */}
            <span className="lg:hidden help-container translate-y-5 lg:shrink-0 rounded-full flex items-center bg-[#CEFFD2] gap-2.5 pr-16">
              <div className="icon-container size-10 bg-[#59CC62] text-secondary p-2 rounded-full flex items-center justify-center">
                <Icon icon="solar:heart-bold" width="32" height="32" />
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
                    <Icon icon="solar:heart-bold" width="32" height="32" />
                  </div>
                  <span className="text-xs lg:text-base font-semibold text-wrap capitalize">
                    {helpCtaText}
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

export default HomeProfessionalSection;
