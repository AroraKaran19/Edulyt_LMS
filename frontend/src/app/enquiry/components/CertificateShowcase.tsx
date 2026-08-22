"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CERTIFICATES, type Certificate } from "../plans";

/** How long each certificate holds before the list advances on its own. */
const AUTO_ADVANCE_MS = 2000;

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
  /** Set on first pick. Advancing under someone's finger is hostile. */
  const [userPicked, setUserPicked] = useState(false);
  /** Off screen it holds at the first item, so nobody arrives mid-rotation. */
  const [onScreen, setOnScreen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const activeRef = useRef<HTMLLIElement>(null);
  const shown = items[active];

  useEffect(() => {
    const list = listRef.current;
    // Only the mobile strip scrolls. On the desktop grid there is nothing to
    // centre, and `block: "nearest"` would drag the page back to this section
    // every few seconds while someone is reading further down.
    if (!list || list.scrollWidth <= list.clientWidth) return;
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [active]);

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
    if (userPicked || !onScreen || items.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(
      () => setActive((i) => (i + 1) % items.length),
      AUTO_ADVANCE_MS,
    );
    return () => clearInterval(timer);
  }, [userPicked, onScreen, items.length]);

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
          "flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2",
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
                  setUserPicked(true);
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
