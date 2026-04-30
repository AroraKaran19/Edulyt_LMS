import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import type { HomeDreamJobSectionSettings } from "@/types/home-page-settings";

const DEFAULT_BULLETS = [
  "Get Placed in top companies",
  "Earn a Higher Salary",
  "Break Into Tech with Confidence",
  "Accelerate Your Career Growth",
];

const HomeDreamJobSection = ({
  settings,
}: {
  settings?: HomeDreamJobSectionSettings;
}) => {
  const bullets =
    settings?.bullets && settings.bullets.length > 0
      ? settings.bullets
      : DEFAULT_BULLETS;
  const eyebrow = settings?.eyebrow || "Land in your Dream Job";
  const line1 = settings?.headingLine1 || "A structured path from";
  const highlightLearn = settings?.headingHighlightLearn || "Learning";
  const highlightPlacement = settings?.headingHighlightPlacement || "Placement";
  const getStartedLabel = settings?.getStartedLabel || "Get Started Now";
  const getStartedHref = settings?.getStartedHref || "";
  const imageSrc = settings?.imageSrc || "/home/dream_job.png";
  const imageAlt = settings?.imageAlt || "dream job";

  const button = getStartedHref ? (
    <Link href={getStartedHref}>
      <OrangeButton>{getStartedLabel}</OrangeButton>
    </Link>
  ) : (
    <OrangeButton>{getStartedLabel}</OrangeButton>
  );

  return (
    <section
      id="home-training"
      className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 pl-8 lg:px-12"
    >
      <div className="content border-l-2 border-gray-300 border-dashed h-full relative px-10 lg:px-12.5 py-20 flex flex-col gap-10">
        <div className="hand-badge size-12 absolute top-18 -left-6 text-secondary bg-primary rounded-full flex items-center justify-center">
          <Icon icon="icon-park-solid:landing" width="32" height="32" />
        </div>
        <div className="content-body flex flex-col gap-6">
          <h3 className="text-base lg:text-2xl font-semibold capitalize">
            {eyebrow}
          </h3>
          <h2 className="text-2xl lg:text-4xl font-extrabold text-text-primary capitalize max-w-full lg:max-w-3xl">
            {line1}{" "}
            <span className="text-primary">{highlightLearn}</span> to{" "}
            <span className="text-primary">{highlightPlacement}</span>.
          </h2>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="col-span-1 flex flex-col gap-5 max-w-lg">
              {bullets.map((item, index) => (
                <div className="w-full flex items-center gap-2.5" key={index}>
                  <div className="w-full bg-primary/10 rounded-full flex items-center gap-2.5">
                    <div className="icon-container shrink-0 size-10 bg-primary text-secondary p-2 rounded-full flex items-center justify-center">
                      <Icon icon="mdi:tick-circle" width="40" height="40" />
                    </div>
                    <h3 className="text-base lg:text-lg font-semibold capitalize">
                      {item}
                    </h3>
                  </div>
                </div>
              ))}
              <div className="mt-auto w-full flex items-center">
                {button}
              </div>
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

export default HomeDreamJobSection;
