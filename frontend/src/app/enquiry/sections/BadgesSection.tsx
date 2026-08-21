import Image from "next/image";
import { cn } from "@/lib/utils";
import { BADGES } from "../plans";
import { listOr, useSection, withSrc } from "../settings";
import InfiniteCarousel from "./InfiniteCarousel";
import { CARD, CONTAINER, EYEBROW, H2, LEAD, REVEAL, SECTION } from "./shared";

export default function BadgesSection() {
  const cms = useSection("badges");
  const badges = withSrc(listOr(cms.items, BADGES));

  return (
    <section className={SECTION} id="badges">
      <div className={CONTAINER}>
        <div data-reveal className={REVEAL}>
          <span className={EYEBROW}>
            <i className="size-1.5 flex-none rounded-full bg-primary" />
            {cms.eyebrow || "Badges"}
          </span>
          <h2 className={`${H2} mt-[18px]`}>
            {cms.heading || "The badges you"}{" "}
            <em className="not-italic text-primary">
              {cms.headingHighlight || "sit the exam for"}
            </em>
          </h2>
          <p className={LEAD}>
            {cms.lead ||
              "Clear the official exam and the badge is issued in your name by Microsoft or Pearson. Which ones you go for is decided with your counsellor on the call."}
          </p>
        </div>

        <div data-reveal className={`${REVEAL} mt-10 delay-[80ms]`}>
          <InfiniteCarousel seconds={38}>
            {badges.map((badge) => (
              <li
                key={badge.src}
                className={cn(
                  CARD,
                  "group/card flex w-[150px] flex-none flex-col items-center px-3 py-[18px] text-center transition-[transform,box-shadow,border-color] hover:-translate-y-1.5 hover:border-[#f2d6c2]",
                  "hover:shadow-[0_22px_44px_-18px_rgba(43,21,8,0.26),0_3px_8px_rgba(43,21,8,0.05)]",
                )}
              >
                <Image
                  src={badge.src}
                  alt={`${badge.issuer} ${badge.name}${
                    badge.level ? ` ${badge.level}` : ""
                  } badge`}
                  width={104}
                  height={104}
                  unoptimized
                  className="h-[104px] w-auto object-contain transition-transform duration-500 ease-[cubic-bezier(0.16,0.9,0.28,1)] group-hover/card:scale-[1.06]"
                />
                <span className="mt-3.5 text-[13.5px] font-extrabold leading-[1.25] tracking-[-0.01em] text-text-primary">
                  {badge.name}
                </span>
                <span className="mt-1 text-[11px] font-semibold text-[#8c7a70]">
                  {badge.level ? `${badge.level} · ` : ""}
                  {badge.issuer}
                </span>
              </li>
            ))}
          </InfiniteCarousel>
        </div>

      </div>
    </section>
  );
}
