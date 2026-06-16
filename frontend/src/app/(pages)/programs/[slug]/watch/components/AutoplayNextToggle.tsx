"use client";

import { cn } from "@/lib/utils";
import { ListVideo } from "lucide-react";

interface AutoplayNextToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export default function AutoplayNextToggle({
  enabled,
  onChange,
}: AutoplayNextToggleProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-linear-to-r from-gray-50/90 to-white px-4 py-3 shadow-sm">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F77124]/10 text-[#F77124]">
          <ListVideo className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">
            Autoplay next lesson
          </p>
          <p className="text-xs text-gray-500 leading-snug mt-0.5">
            After a video or quiz finishes, go to the next item automatically.
            Your choice is saved on this device.
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={enabled ? "Autoplay next lesson on" : "Autoplay next lesson off"}
        onClick={() => onChange(!enabled)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F77124]",
          enabled ? "bg-[#F77124]" : "bg-gray-300"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 translate-x-1 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-out",
            enabled ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}
