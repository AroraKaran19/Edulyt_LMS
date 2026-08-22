"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  length: number;
  digits: string[];
  onChange: (digits: string[]) => void;
  /** Fires once every box is filled, so nobody hunts for a submit button. */
  onComplete: (code: string) => void;
  disabled?: boolean;
  invalid?: boolean;
};

export default function OtpBoxes({
  length,
  digits,
  onChange,
  onComplete,
  disabled,
  invalid,
}: Props) {
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  // Callers reset with `[]`, and writing into a short array leaves holes that
  // `every` skips: a digit typed into the last box alone would read as complete.
  const cells = Array.from({ length }, (_, i) => digits[i] ?? "");

  useEffect(() => {
    boxes.current[0]?.focus();
  }, []);

  const commit = (next: string[], focusAt: number) => {
    onChange(next);
    if (next.every(Boolean) && next.length === length) {
      onComplete(next.join(""));
      return;
    }
    boxes.current[Math.max(0, Math.min(length - 1, focusAt))]?.focus();
  };

  const setDigit = (index: number, raw: string) => {
    const only = raw.replace(/\D/g, "");
    if (!only) {
      commit(
        cells.map((d, i) => (i === index ? "" : d)),
        index,
      );
      return;
    }
    // Typing or pasting several digits at once fills forward from here, which is
    // what happens when the code arrives one tap away in another app.
    const next = [...cells];
    for (let i = 0; i < only.length && index + i < length; i += 1) {
      next[index + i] = only[i];
    }
    commit(next, index + only.length);
  };

  const onKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !cells[index] && index > 0) {
      e.preventDefault();
      commit(
        cells.map((d, i) => (i === index - 1 ? "" : d)),
        index - 1,
      );
    }
  };

  return (
    <div className="flex gap-2">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            boxes.current[i] = el;
          }}
          value={cells[i]}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={length}
          aria-label={`Digit ${i + 1}`}
          disabled={disabled}
          className={cn(
            "h-12 w-full min-w-0 rounded-xl border-[1.5px] bg-[#fffcfa] text-center text-[18px] font-extrabold text-text-primary outline-none transition-[border-color,box-shadow] focus:border-primary focus:bg-white focus:shadow-[0_0_0_3.5px_rgba(247,173,36,0.28)] disabled:opacity-60",
            invalid ? "border-[#d2451e]" : "border-[#ecdfd5]",
          )}
        />
      ))}
    </div>
  );
}
