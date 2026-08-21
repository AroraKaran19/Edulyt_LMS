import { cn } from "@/lib/utils";

/**
 * A seamless looping row, using the same two-copy trick as `MarqueeStrip`.
 *
 * Each copy is `min-w-full flex-none` and slides by -100% of *its own* width, so
 * the second copy lands exactly where the first started whether the content is
 * narrower or wider than the viewport. That is what makes it loop without a
 * measured width or a resize listener.
 *
 * The duplicate is `inert`, not just `aria-hidden`: these rows contain buttons,
 * and hiding a focusable element from assistive tech without removing it from
 * the tab order is worse than not hiding it at all.
 *
 * Reduced motion is handled globally by the `[data-enquiry]` block in
 * globals.css, so there is no per-element opt-out here.
 */
export default function InfiniteCarousel({
  children,
  seconds = 45,
  gapClass = "gap-[18px]",
}: {
  children: React.ReactNode;
  seconds?: number;
  gapClass?: string;
}) {
  return (
    <div className="group relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_3%,#000_97%,transparent)]">
      {[0, 1].map((copy) => (
        <ul
          key={copy}
          {...(copy === 1 ? { inert: true } : {})}
          style={{ animationDuration: `${seconds}s` }}
          className={cn(
            "flex min-w-full flex-none animate-eq-slide items-stretch justify-around",
            "group-hover:[animation-play-state:paused]",
            gapClass,
          )}
        >
          {children}
        </ul>
      ))}
    </div>
  );
}
