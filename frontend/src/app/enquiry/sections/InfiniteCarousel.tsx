"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A seamless looping row that a visitor can also slide by hand.
 *
 * The drift is the CSS animation and nothing else: copies of the row sit side
 * by side and each slides -100% of its own width, so copy n lands exactly where
 * copy n-1 started. That runs on the compositor at float precision, which is
 * what keeps it gliding. Driving `scrollLeft` from rAF instead looks wrong at
 * this speed, because scroll offsets quantise to whole pixels and a ~26px/s row
 * then advances in visible 27px steps rather than moving at all between them.
 *
 * Dragging is a second transform on the wrapper, added on top of an animation
 * that never stops or gets rewritten. The two never touch the same property, so
 * manual costs the auto half none of its smoothness.
 *
 * Two details the obvious version gets wrong:
 *
 * `gap` only separates items *within* a copy, so the join between copies would
 * have no gap at all. Each copy carries a trailing pad of the same size, which
 * `translateX(-100%)` counts as part of its width, so the rhythm holds across
 * the join and the loop still lands true.
 *
 * One copy only covers the viewport while it is at least as wide as it. The
 * animation and the drag offset each consume a copy width of travel, so
 * coverage needs two copies more than it takes to span the viewport.
 *
 * Every card on screen is a duplicate. The wrapper rests a copy to the left and
 * each copy slides at most its own width, so copy 0 never reaches the viewport.
 * That rules out `inert` on the duplicates: it suppresses their click events
 * too, which left rows like the CV strip with no working click target at all.
 * They are hidden from assistive tech and pulled out of the tab order by hand
 * instead, which is the half of `inert` this actually wanted.
 *
 * Reduced motion is handled globally by the `[data-enquiry]` block in
 * globals.css, so there is no per-element opt-out here.
 */

/** Past this, a pointer press was a drag and the click it ends with is not real. */
const DRAG_SLOP_PX = 5;

/** What `inert` would have taken out of the tab order on the duplicate rows. */
const FOCUSABLE =
  'a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])';

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
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const [copies, setCopies] = useState(3);

  const copyWidthRef = useRef(0);
  const offsetRef = useRef(0);
  const draggingRef = useRef(false);
  const movedRef = useRef(0);

  /**
   * Writes the drag offset. The wrapper rests a whole copy to the left, so the
   * offset has a copy's worth of room to move in either direction before it
   * wraps, and content repeats every copy width so the wrap cannot be seen.
   */
  const applyOffset = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const one = copyWidthRef.current;
    if (one > 0) offsetRef.current = ((offsetRef.current % one) + one) % one;
    wrap.style.transform = `translate3d(${offsetRef.current - one}px, 0, 0)`;
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    // ResizeObserver fires once on observe, so this covers the first
    // measurement too, without a setState in the effect body.
    const observer = new ResizeObserver(() => {
      const one = track.getBoundingClientRect().width;
      if (!one) return;
      copyWidthRef.current = one;
      // Not left to the drag effect: it only re-runs when the copy count
      // changes, and a row wider than the viewport settles on the same count it
      // started with, so the resting offset would never be written at all.
      applyOffset();
      setCopies(Math.max(3, Math.ceil(viewport.clientWidth / one) + 2));
    });
    observer.observe(viewport);
    observer.observe(track);
    return () => observer.disconnect();
  }, [applyOffset]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    // Copy 0 is the one assistive tech reads and tabs through; the duplicates
    // stay clickable but must not be stops of their own.
    for (const copy of Array.from(wrap.children).slice(1)) {
      for (const node of copy.querySelectorAll<HTMLElement>(FOCUSABLE)) {
        node.tabIndex = -1;
      }
    }
  }, [copies, children]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const wrap = wrapRef.current;
    if (!viewport || !wrap) return;

    /** Only while a finger or cursor is actually on it, so it never sits idle. */
    const setPaused = (paused: boolean) => {
      for (const copy of Array.from(wrap.children)) {
        (copy as HTMLElement).style.animationPlayState = paused
          ? "paused"
          : "running";
      }
    };

    const onPointerDown = () => {
      draggingRef.current = true;
      movedRef.current = 0;
      setPaused(true);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      movedRef.current += Math.abs(event.movementX);
      // Captured once the press is a drag, not on pointerdown: a capture that
      // is still held at pointerup retargets the click to the capturing
      // element, so a plain press never reached the card it landed on.
      if (
        movedRef.current > DRAG_SLOP_PX &&
        !viewport.hasPointerCapture(event.pointerId)
      ) {
        viewport.setPointerCapture(event.pointerId);
      }
      offsetRef.current += event.movementX;
      applyOffset();
    };

    const endDrag = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      // Straight back to drifting: a pause that outlives the gesture is what
      // made this look like it had stopped running by itself.
      setPaused(false);
      if (viewport.hasPointerCapture(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }
    };

    // A drag that ends over a card would otherwise open whatever it stopped on.
    const onClickCapture = (event: MouseEvent) => {
      if (movedRef.current <= DRAG_SLOP_PX) return;
      movedRef.current = 0;
      event.preventDefault();
      event.stopPropagation();
    };

    applyOffset();

    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);
    viewport.addEventListener("click", onClickCapture, true);

    return () => {
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", endDrag);
      viewport.removeEventListener("pointercancel", endDrag);
      viewport.removeEventListener("click", onClickCapture, true);
    };
  }, [copies, applyOffset]);

  return (
    <div
      ref={viewportRef}
      // `pan-y` keeps a vertical swipe scrolling the page while a sideways one
      // is ours to handle.
      className="relative flex cursor-grab touch-pan-y overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_3%,#000_97%,transparent)] active:cursor-grabbing"
    >
      <div ref={wrapRef} className="flex">
        {Array.from({ length: copies }, (_, copy) => (
          <ul
            key={copy}
            ref={copy === 0 ? trackRef : undefined}
            {...(copy > 0 ? { "aria-hidden": true } : {})}
            style={{ gap, paddingRight: gap, animationDuration: `${seconds}s` }}
            className="flex w-max flex-none animate-eq-slide items-stretch"
          >
            {children}
          </ul>
        ))}
      </div>
    </div>
  );
}
