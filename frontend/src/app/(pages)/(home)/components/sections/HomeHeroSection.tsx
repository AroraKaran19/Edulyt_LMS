import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Check, X } from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type {
  HomeHeroComparisonRow,
  HomeHeroSettings,
  HomeHeroTopCard,
} from "@/types/home-page-settings";

interface TopCardProps {
  title: string;
  description: string;
}

interface ComparisonProps {
  feature: string;
  airkrit: string | ReactNode;
  youtube: string | ReactNode;
  others: string | ReactNode;
}

/** "check" / "x" → icon. Anything else passes through as text. */
function renderComparisonCell(value: string): string | ReactNode {
  const v = value?.trim().toLowerCase();
  if (v === "check") return <ComparisonCheck />;
  if (v === "x") return <ComparisonX />;
  return value;
}

const ComparisonCheck = () => (
  <span
    className="inline-flex items-center justify-center size-7 rounded-full bg-[#4CAF50] text-white shadow-sm"
    aria-hidden
  >
    <Check className="size-4" strokeWidth={3} />
  </span>
);

const ComparisonX = () => (
  <span
    className="inline-flex items-center justify-center size-7 rounded-full bg-[#F44336] text-white shadow-sm"
    aria-hidden
  >
    <X className="size-4" strokeWidth={3} />
  </span>
);

const TopCard = ({ title, description }: TopCardProps) => {
  return (
    <div className="top-card w-full flex flex-col justify-center gap-2.5 bg-white rounded-2xl px-2.5 py-4.5 shadow-[0_0_10px_0_rgba(255,102,0,0.2)]">
      <div className="title flex items-stretch rounded-full from-orange-500/20 via-orange-50/10 to-orange-50/10 bg-linear-to-r  gap-2.5 pr-2.5">
        <span className="size-8 lg:size-10 shrink-0 p-2 bg-[#F5891D] rounded-full">
          <Icon
            icon="stash:question-solid"
            width="24"
            height="24"
            className="text-white size-full"
          />
        </span>
        <span className="leading-none text-base font-semibold flex-1 flex items-center capitalize">
          {title}
        </span>
      </div>
      <span className="description text-lg lg:text-2xl text-balance text-black text-center font-bold">
        {description}
      </span>
    </div>
  );
};

const DEFAULT_TOP_CARDS: HomeHeroTopCard[] = [
  { title: "Who we are ?", description: "Education to Employment Experts" },
  { title: "What we do ?", description: "100% Project-Based Learning" },
  { title: "What we offer ?", description: "Industry-Focused Career Programs" },
  { title: "Why choose us ?", description: "Built From Real Industry Experience" },
];

const DEFAULT_COMPARISON_ROWS: HomeHeroComparisonRow[] = [
  { feature: "Project-based learning", airkrit: "100% Real Projects", youtube: "Mostly Theory", others: "Limited" },
  { feature: "Industry-Derived Curriculum", airkrit: "Build from Projects", youtube: "x", others: "x" },
  { feature: "Mentors Working in Industry", airkrit: "check", youtube: "x", others: "x" },
  { feature: "Interaction with Future Managers", airkrit: "check", youtube: "x", others: "x" },
  { feature: "Industry-Standard Placement Assistance", airkrit: "check", youtube: "x", others: "x" },
];

const HomeHeroSection = ({ settings }: { settings?: HomeHeroSettings }) => {
  const topCards =
    settings?.topCards && settings.topCards.length > 0
      ? settings.topCards
      : DEFAULT_TOP_CARDS;

  const comparisonRows =
    settings?.comparisonRows && settings.comparisonRows.length > 0
      ? settings.comparisonRows
      : DEFAULT_COMPARISON_ROWS;

  const comparisons: ComparisonProps[] = comparisonRows.map((row) => ({
    feature: row.feature,
    airkrit: renderComparisonCell(row.airkrit),
    youtube: renderComparisonCell(row.youtube),
    others: renderComparisonCell(row.others),
  }));

  const headingHtml =
    settings?.comparisonHeadingHtml?.trim() ||
    'The <span class="text-[#F5891D]">Difference</span> That Gets You <span class="text-[#F5891D]">Hired!</span>';

  const exploreLabel = settings?.exploreOfferingsLabel || "Explore Offerings";
  const exploreHref = settings?.exploreOfferingsHref || "";

  return (
    <section id="home-hero" className="w-full relative">
      <div className="absolute w-full h-full pointer-events-none bg-linear-to-r from-[#FFFBF7] via-orange-50/35 to-[#FFF8F0]">
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
      <div className="relative z-10 max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 lg:px-12 py-10">
        <div className="top-cards grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {topCards.map((card) => (
            <TopCard
              key={card.title}
              title={card.title}
              description={card.description}
            />
          ))}
        </div>
        <div className="comparison-table w-full mt-10 grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="col-span-3 flex flex-col gap-5">
            <h3
              className="text-xl text-balance text-black font-bold"
              dangerouslySetInnerHTML={{ __html: headingHtml }}
            />
            <div className="w-full overflow-x-auto shadow-[0_0_10px_0_rgba(255,102,0,0.2)] rounded-2xl [-webkit-overflow-scrolling:touch]">
              <table className="table-fixed w-full min-w-[640px] bg-white rounded-2xl border-collapse">
                <thead>
                  <tr>
                    <th className="w-[40%] min-w-20 text-left text-xl py-4 px-3 sm:px-5 font-bold text-black border-[0_1px_1px_0] border-gray-200">
                      Features
                    </th>
                    <th className="w-[20%] min-w-20 text-center align-middle py-4 px-2 sm:px-5 font-semibold border-[0_1px_1px_1px] border-gray-200">
                      <Image
                        src="/logo.svg"
                        alt="Airkrit Logo"
                        width={100}
                        height={100}
                        className="mx-auto block w-auto h-7 sm:h-8 max-w-full pointer-events-none select-none"
                        unoptimized
                        draggable={false}
                        quality={100}
                        priority
                      />
                    </th>
                    <th className="w-[20%] min-w-20 text-center align-middle py-4 px-2 sm:px-5 font-semibold border-[0_1px_1px_1px] border-gray-200">
                      <Image
                        src="/youtube-logo.svg"
                        alt="YouTube Logo"
                        width={100}
                        height={100}
                        className="mx-auto block w-auto h-7 sm:h-8 max-w-full pointer-events-none select-none"
                        unoptimized
                        draggable={false}
                        quality={100}
                        priority
                      />
                    </th>
                    <th className="w-[20%] min-w-20 text-center text-base sm:text-lg py-4 px-2 sm:px-5 font-bold text-black border-[0_0_1px_1px] border-gray-200">
                      Others
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((comparison, rowIndex) => (
                    <tr key={rowIndex}>
                      <td
                        className={cn(
                          "py-4 px-3 sm:px-5 border-[0_1px_1px_0] border-gray-200 align-middle text-sm sm:text-base",
                          rowIndex === comparisons.length - 1 && "border-b-0",
                        )}
                      >
                        {comparison.feature}
                      </td>
                      <td
                        className={cn(
                          "text-center py-4 px-2 sm:px-5 border-[0_1px_1px_1px] border-gray-200 align-middle",
                          rowIndex === comparisons.length - 1 && "border-b-0",
                        )}
                      >
                        {comparison.airkrit}
                      </td>
                      <td
                        className={cn(
                          "text-center py-4 px-2 sm:px-5 border-[0_1px_1px_1px] border-gray-200 align-middle",
                          rowIndex === comparisons.length - 1 && "border-b-0",
                        )}
                      >
                        {comparison.youtube}
                      </td>
                      <td
                        className={cn(
                          "text-center py-4 px-2 sm:px-5 border-[0_0_1px_1px] border-gray-200 align-middle",
                          rowIndex === comparisons.length - 1 && "border-b-0",
                        )}
                      >
                        {comparison.others}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-auto">
              {exploreHref ? (
                <Link href={exploreHref}>
                  <OrangeButton>{exploreLabel}</OrangeButton>
                </Link>
              ) : (
                <OrangeButton>{exploreLabel}</OrangeButton>
              )}
            </div>
          </div>
          <div className="col-span-2">
            <Image
              src="/home/hero_side_image.jpeg"
              alt="Hero Side Image"
              width={100}
              height={100}
              className="w-full h-full object-cover select-none pointer-events-none mask-[linear-gradient(to_right,transparent_0%,black_32%,black_68%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_32%,black_68%,transparent_100%)]"
              unoptimized
              draggable={false}
              quality={100}
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeHeroSection;
