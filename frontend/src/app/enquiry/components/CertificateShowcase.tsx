"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CERTIFICATES, type Certificate } from "../plans";

/** How long each certificate holds before the list advances on its own. */
const AUTO_ADVANCE_MS = 2000;

/**
 * How long the rotation stands back after someone drives it themselves. Long
 * enough to actually read the one they picked, and it lapses on its own rather
 * than retiring the rotation, so the section still shows itself off to a
 * visitor who touched it once and moved on.
 */
const RESUME_AFTER_MS = 6000;

/** The two step-through controls sitting over the preview. */
const ARROW =
  "absolute top-1/2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-[#f2d6c2] bg-white/95 text-[#c4551a] shadow-[0_6px_16px_-6px_rgba(43,21,8,0.4)] transition-[background-color,border-color,transform] duration-200 hover:-translate-y-1/2 hover:scale-105 hover:border-primary hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/**
 * The documents themselves, previewed at size.
 *
 * Every entry is a self-contained image, so the frame just contains it. The MNC
 * certificates were cut out of their shared A4 sheets ahead of time rather than
 * being framed with background-position, which clipped at some widths.
 *
 * Two layouts from one markup: a vertical list beside the preview on desktop, a
 * horizontal snap strip beneath it on mobile, where a column of eight would push
 * the preview off screen.
 */
export default function CertificateShowcase({
  items = CERTIFICATES,
}: {
  items?: Certificate[];
}) {
  const [active, setActive] = useState(0);
  /** Off screen it holds at the first item, so nobody arrives mid-rotation. */
  const [onScreen, setOnScreen] = useState(false);
  /**
   * True on the mobile layout, where the list is a snap strip rather than the
   * desktop column. Everything the rotation does there happens inside a
   * scroller the visitor is holding, so it stays off. See the auto-advance.
   */
  const [isStrip, setIsStrip] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const activeRef = useRef<HTMLLIElement>(null);
  const shown = items[active];

  /** Wall-clock ms until which the rotation keeps out of the way. */
  const holdUntilRef = useRef(0);
  const hold = () => {
    holdUntilRef.current = Date.now() + RESUME_AFTER_MS;
  };

  /** Stepping is driving it by hand, so the rotation waits its turn. */
  const step = (delta: number) => {
    setActive((i) => (i + delta + items.length) % items.length);
    hold();
  };

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => setIsStrip(list.scrollWidth > list.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [items.length]);

  useEffect(() => {
    const list = listRef.current;
    const item = activeRef.current;
    // Only the strip scrolls; the desktop column has nothing to centre.
    if (!list || !item || !isStrip) return;

    // Driving scrollLeft, not scrollIntoView: that one walks every scrollable
    // ancestor, so on first paint it hauled the whole page down to this section
    // and a visitor opening /enquiry landed here instead of the top.
    const listBox = list.getBoundingClientRect();
    const itemBox = item.getBoundingClientRect();
    const offset =
      itemBox.left + itemBox.width / 2 - (listBox.left + listBox.width / 2);
    list.scrollTo({ left: list.scrollLeft + offset, behavior: "smooth" });
  }, [active, isStrip]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!onScreen || isStrip || items.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // The timer keeps running through a manual pick and skips the ticks it
    // lands on, so the two ways of driving this share one clock instead of one
    // of them switching the other off.
    const timer = setInterval(() => {
      if (Date.now() < holdUntilRef.current) return;
      setActive((i) => (i + 1) % items.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [onScreen, isStrip, items.length]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    // Pointer events only: the auto-advance centres the strip itself, and a
    // `scroll` listener would read its own work as someone reaching in.
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) hold();
    };
    const onPointerDown = () => hold();

    list.addEventListener("pointerdown", onPointerDown, { passive: true });
    list.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      list.removeEventListener("pointerdown", onPointerDown);
      list.removeEventListener("wheel", onWheel);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="mt-9 grid items-start gap-6 lg:grid-cols-[1fr_400px] lg:gap-8"
    >
      {/* ---------- preview ---------- */}
      <div className="rounded-2xl border border-[#fbe3d2] bg-white p-4 shadow-[0_16px_40px_-20px_rgba(43,21,8,0.28)]">
        <div className="relative flex h-[340px] items-center justify-center overflow-hidden rounded-xl bg-[#fff6f1] p-3 sm:h-[540px]">
          <Image
            key={shown.src}
            src={shown.src}
            alt={`${shown.issuer} ${shown.title}, sample`}
            width={1200}
            height={1600}
            className="max-h-full w-auto max-w-full animate-eq-fade-up rounded-md object-contain shadow-[0_10px_30px_-14px_rgba(43,21,8,0.45)]"
          />
          <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#c4551a] shadow-[0_4px_12px_-4px_rgba(43,21,8,0.4)]">
            Sample
          </span>

          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous certificate"
                className={cn(ARROW, "left-2.5")}
              >
                <ChevronLeft size={18} strokeWidth={2.8} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next certificate"
                className={cn(ARROW, "right-2.5")}
              >
                <ChevronRight size={18} strokeWidth={2.8} aria-hidden="true" />
              </button>
            </>
          )}
        </div>

        <div className="mt-3.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 px-1">
          <span className="text-[15px] font-extrabold tracking-[-0.01em] text-text-primary">
            {shown.title}
          </span>
          <span className="text-[12.5px] font-semibold text-[#8c7a70]">
            issued by {shown.issuer}
          </span>
          <span className="ml-auto rounded-full bg-[#fff6f1] px-2.5 py-1 text-[10.5px] font-bold whitespace-nowrap text-[#c4551a]">
            {shown.availability}
          </span>
        </div>
      </div>

      {/* ---------- list: strip on mobile, column on desktop ---------- */}
      <ul
        ref={listRef}
        role="tablist"
        aria-label="Certificates"
        className={cn(
          "flex snap-x snap-proximity gap-2 overflow-x-auto overscroll-x-contain pb-2",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "lg:grid lg:gap-1.5 lg:overflow-visible lg:pb-0",
        )}
      >
        {items.map((item, i) => {
          const on = i === active;
          return (
            <li
              key={item.src}
              ref={on ? activeRef : undefined}
              className="w-[72%] flex-none snap-center sm:w-[46%] lg:w-auto"
            >
              <button
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setActive(i);
                  hold();
                }}
                className={cn(
                  "flex h-full w-full cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-[border-color,background-color,box-shadow] duration-200",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  on
                    ? "border-primary bg-white shadow-[0_0_0_3px_rgba(247,173,36,0.25)]"
                    : "border-transparent bg-white/60 hover:border-[#f2d6c2] hover:bg-white",
                )}
              >
                <span
                  className={cn(
                    "size-2 flex-none rounded-full transition-colors duration-200",
                    on ? "bg-primary" : "bg-[#e0cec1]",
                  )}
                />

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-extrabold text-text-primary">
                    {item.title}
                  </span>
                  <span
                    className={cn(
                      "block text-[11.5px] leading-[1.4] transition-colors duration-200",
                      on ? "text-text-secondary" : "text-[#8c7a70]",
                    )}
                  >
                    {/* The blurb only fits the wider desktop row. */}
                    <span className="hidden lg:inline">
                      {on ? item.blurb : item.issuer}
                    </span>
                    <span className="lg:hidden">{item.issuer}</span>
                  </span>
                </span>

                <ChevronRight
                  size={15}
                  strokeWidth={2.6}
                  className={cn(
                    "hidden flex-none transition-[color,transform] duration-200 lg:block",
                    on ? "translate-x-0.5 text-primary" : "text-[#c7b5a8]",
                  )}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
