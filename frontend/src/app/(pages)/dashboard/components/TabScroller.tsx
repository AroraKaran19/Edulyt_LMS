"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Horizontal tab row that shows fades and arrows when tabs are hidden off-screen. */
export default function TabScroller({ children, activeKey }: { children: ReactNode; activeKey: string }) {
  const ref = useRef<HTMLElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.querySelector<HTMLElement>("[aria-current='page']")?.scrollIntoView({ block: "nearest", inline: "center" });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeKey, measure]);

  const nudge = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 200, behavior: "smooth" });

  return (
    <div className="relative">
      <nav
        ref={ref}
        onScroll={measure}
        className="flex w-full items-center gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </nav>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white to-transparent transition-opacity",
          edges.left ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white via-white/80 to-transparent transition-opacity",
          edges.right ? "opacity-100" : "opacity-0",
        )}
      />
      {edges.left && (
        <button
          type="button"
          aria-label="Show earlier tabs"
          onClick={() => nudge(-1)}
          className="absolute left-0 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-gray-200 bg-white shadow-sm"
        >
          <ChevronLeft className="size-4" />
        </button>
      )}
      {edges.right && (
        <button
          type="button"
          aria-label="Show more tabs"
          onClick={() => nudge(1)}
          className="absolute right-0 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-gray-200 bg-white shadow-sm"
        >
          <ChevronRight className="size-4" />
        </button>
      )}
    </div>
  );
}
