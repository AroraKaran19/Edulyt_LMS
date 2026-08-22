"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A seamless looping row.
 *
 * Copies of the row sit side by side and each slides -100% of its own width, so
 * copy n lands exactly where copy n-1 started. That is what loops without a
 * measured offset or a resize listener.
 *
 * Two details the obvious version gets wrong:
 *
 * `gap` only separates items *within* a copy, so the join between copies would
 * have no gap at all. Each copy carries a trailing pad of the same size, which
 * `translateX(-100%)` counts as part of its width, so the rhythm holds across
 * the join and the loop still lands true.
 *
 * One copy only covers the viewport while it is at least as wide as it. A short
 * row would leave a bald patch at the right on every pass, so the copy count is
 * measured rather than fixed at two.
 *
 * The duplicates are `inert`, not just `aria-hidden`: these rows contain
 * buttons, and hiding a focusable element from assistive tech without removing
 * it from the tab order is worse than not hiding it at all.
 *
 * Reduced motion is handled globally by the `[data-enquiry]` block in
 * globals.css, so there is no per-element opt-out here.
 */
export default function InfiniteCarousel({
  children,
  seconds = 45,
  gap = 18,
}: {
  children: React.ReactNode;
  seconds?: number;
  gap?: number;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const [copies, setCopies] = useState(2);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    // ResizeObserver fires once on observe, so this covers the first
    // measurement too, without a setState in the effect body.
    const observer = new ResizeObserver(() => {
      const one = track.getBoundingClientRect().width;
      if (!one) return;
      // The last copy's slot empties out at the end of each pass, so coverage
      // needs one more copy than it takes to span the viewport.
      setCopies(Math.max(2, Math.ceil(viewport.clientWidth / one) + 1));
    });
    observer.observe(viewport);
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={viewportRef}
      className="group relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_3%,#000_97%,transparent)]"
    >
      {Array.from({ length: copies }, (_, copy) => (
        <ul
          key={copy}
          ref={copy === 0 ? trackRef : undefined}
          {...(copy > 0 ? { inert: true } : {})}
          style={{ gap, paddingRight: gap, animationDuration: `${seconds}s` }}
          className="flex w-max flex-none animate-eq-slide items-stretch group-hover:[animation-play-state:paused]"
        >
          {children}
        </ul>
      ))}
    </div>
  );
}
