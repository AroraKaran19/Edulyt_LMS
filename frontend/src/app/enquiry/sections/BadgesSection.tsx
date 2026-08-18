import Image from "next/image";
import { cn } from "@/lib/utils";
import { BADGES } from "../plans";
import { CARD, CONTAINER, EYEBROW, H2, LEAD, REVEAL, SECTION } from "./shared";

/** Stagger caps out so a long row does not leave the last badge lagging. */
const DELAYS = [
  "",
  "delay-[60ms]",
  "delay-[120ms]",
  "delay-[180ms]",
  "delay-[240ms]",
  "delay-[300ms]",
];

export default function BadgesSection() {
  return (
    <section className={SECTION} id="badges">
      <div className={CONTAINER}>
        <div data-reveal className={REVEAL}>
          <span className={EYEBROW}>
            <i className="size-1.5 flex-none rounded-full bg-primary" />
            Badges
          </span>
          <h2 className={`${H2} mt-[18px]`}>
            The badges you{" "}
            <em className="not-italic text-primary">sit the exam for</em>
          </h2>
          <p className={LEAD}>
            Clear the official exam and the badge is issued in your name by
            Microsoft or Pearson. Which ones you go for is decided with your
            counsellor on the call.
          </p>
        </div>

        <ul className="mt-10 grid grid-cols-2 gap-[18px] sm:grid-cols-3 lg:grid-cols-6">
          {BADGES.map((badge, i) => (
            <li
              key={badge.src}
              data-reveal
              className={cn(
                CARD,
                REVEAL,
                "group flex flex-col items-center px-3 py-[18px] text-center transition-[transform,box-shadow,border-color] hover:-translate-y-1.5 hover:border-[#f2d6c2]",
                "hover:shadow-[0_22px_44px_-18px_rgba(43,21,8,0.26),0_3px_8px_rgba(43,21,8,0.05)]",
                DELAYS[i] ?? ""
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
                className="h-[104px] w-auto object-contain transition-transform duration-500 ease-[cubic-bezier(0.16,0.9,0.28,1)] group-hover:scale-[1.06]"
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
        </ul>
      </div>
    </section>
  );
}
