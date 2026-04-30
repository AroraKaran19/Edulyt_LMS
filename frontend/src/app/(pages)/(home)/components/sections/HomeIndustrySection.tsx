import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import type { HomeIndustrySectionSettings } from "@/types/home-page-settings";

const HelpBadge = ({ title }: { title: string }) => {
  return (
    <div className="w-full bg-primary/10 rounded-full flex items-center gap-2.5">
      <div className="icon-container shrink-0 size-15 bg-primary text-secondary p-2 rounded-full flex items-center justify-center">
        <Icon icon="mdi:tick-circle" width="40" height="40" />
      </div>
      <div className="content-body flex flex-wrap p-2">
        <h3 className="text-base lg:text-lg font-bold capitalize">{title}</h3>
      </div>
    </div>
  );
};

const DEFAULT_HELP = [
  "Understanding your current level",
  "Identifying skill gaps",
  "Creating a personalized career roadmap",
];

const HomeIndustrySection = ({
  settings,
}: {
  settings?: HomeIndustrySectionSettings;
}) => {
  const helpData =
    settings?.expertHelpBullets && settings.expertHelpBullets.length > 0
      ? settings.expertHelpBullets
      : DEFAULT_HELP;
  const headingPrimary =
    settings?.headingPrimary || "One Conversation Can Change Everything.";
  const headingSecondary =
    settings?.headingSecondary || "You don’t need to figure it out alone.";
  const helpIntroText =
    settings?.helpIntroText || "Our industry experts help you in...";
  const ctaLabel = settings?.bookConsultationLabel || "Book Consultation";
  const ctaHref = settings?.bookConsultationHref || "";
  const imageSrc = settings?.imageSrc || "/home/industry_image.jpg";
  const imageAlt = settings?.imageAlt || "industry";

  return (
    <section
      id="home-industry"
      className="w-full from-primary/10 via-secondary/5 to-transparent bg-linear-to-tr"
    >
      <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 pl-8 lg:px-12">
        <div className="content border-l-2 border-gray-300 border-dashed h-full relative px-10 lg:px-12.5 py-12.5 flex flex-col gap-10">
          <div className="hand-badge size-12 absolute top-15 lg:top-10 -left-6 text-secondary bg-primary rounded-full flex items-center justify-center">
            <Icon icon="famicons:call" width="32" height="32" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="col-span-1 flex flex-col gap-6">
              <h3 className="text-2xl font-extrabold">{headingPrimary}</h3>
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
            <div className="col-span-1 flex flex-col gap-6">
              <h3 className="text-2xl lg:text-4xl font-extrabold capitalize">
                {headingSecondary}
              </h3>

              <span className="help-container w-full rounded-full flex items-center bg-[#CEFFD2] gap-2.5 mb-5">
                <div className="icon-container size-10 bg-[#59CC62] text-secondary p-2 rounded-full flex items-center justify-center">
                  <Icon icon="fa7-brands:kakao-talk" width="32" height="32" />
                </div>
                <span className="text-base font-bold text-wrap capitalize">
                  {helpIntroText}
                </span>
              </span>

              <div className="help-data flex flex-col gap-5">
                {helpData.map((item, index) => (
                  <HelpBadge key={index} title={item} />
                ))}
              </div>

              <div className="mt-auto">
                {ctaHref ? (
                  <Link href={ctaHref}>
                    <OrangeButton>{ctaLabel}</OrangeButton>
                  </Link>
                ) : (
                  <OrangeButton>{ctaLabel}</OrangeButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeIndustrySection;
