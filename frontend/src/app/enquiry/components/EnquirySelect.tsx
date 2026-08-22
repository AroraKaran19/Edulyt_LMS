"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type EnquiryOption = { value: string; label: string };

/**
 * A listbox in place of a native `<select>`, because `<option>` cannot be
 * styled and the OS menu reads as a different product next to this page.
 *
 * Follows the ARIA listbox pattern: the trigger owns the label, the popup takes
 * focus while open, and the highlighted row is announced through
 * `aria-activedescendant` rather than by moving focus between options.
 */
export default function EnquirySelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: EnquiryOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  /** Keyboard highlight, which moves independently of the selection. */
  const [cursor, setCursor] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options[selectedIndex];

  const openAt = (index: number) => {
    setCursor(index);
    setOpen(true);
  };

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const commit = (index: number) => {
    onChange(options[index].value);
    close();
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector(`[data-index="${cursor}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, cursor]);

  const onListKeyDown = (event: React.KeyboardEvent) => {
    const last = options.length - 1;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setCursor((i) => Math.min(i + 1, last));
        break;
      case "ArrowUp":
        event.preventDefault();
        setCursor((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        event.preventDefault();
        setCursor(0);
        break;
      case "End":
        event.preventDefault();
        setCursor(last);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        commit(cursor);
        break;
      case "Escape":
        event.preventDefault();
        close();
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  const onTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      openAt(selectedIndex);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <span
        id={`${id}-label`}
        className="mb-1 block text-[11.5px] font-bold text-text-primary"
      >
        {label}
      </span>

      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-controls={`${id}-list`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={`${id}-label`}
        onClick={() => (open ? close(false) : openAt(selectedIndex))}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "flex h-[42px] w-full cursor-pointer items-center gap-2 rounded-xl border-[1.5px] bg-[#fffcfa] pr-3 pl-3 text-left text-[14px] text-text-primary",
          "transition-[border-color,box-shadow,background-color] duration-150 hover:border-[#f2d6c2]",
          "focus-visible:outline-none",
          open
            ? "border-primary bg-white shadow-[0_0_0_3.5px_rgba(247,173,36,0.28)]"
            : "border-[#ecdfd5] focus-visible:border-primary focus-visible:bg-white focus-visible:shadow-[0_0_0_3.5px_rgba(247,173,36,0.28)]",
        )}
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label}</span>
        <ChevronDown
          size={16}
          strokeWidth={2.6}
          aria-hidden="true"
          className={cn(
            "flex-none text-[#8c7a70] transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={`${id}-list`}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={`${id}-label`}
          aria-activedescendant={`${id}-opt-${cursor}`}
          onKeyDown={onListKeyDown}
          className={cn(
            "absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-[228px] overflow-y-auto",
            "animate-eq-fade-up rounded-xl border border-[#f2d6c2] bg-white p-1 [animation-duration:160ms]",
            "shadow-[0_18px_40px_-16px_rgba(43,21,8,0.32),0_2px_6px_rgba(43,21,8,0.06)] focus:outline-none",
          )}
        >
          {options.map((option, i) => {
            const isSelected = i === selectedIndex;
            return (
              <li
                key={option.value}
                id={`${id}-opt-${i}`}
                data-index={i}
                role="option"
                aria-selected={isSelected}
                onClick={() => commit(i)}
                onPointerMove={() => setCursor(i)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-[13.5px] leading-[1.3]",
                  isSelected
                    ? "font-extrabold text-text-primary"
                    : "font-semibold text-text-secondary",
                  i === cursor && "bg-[#fff6f1]",
                )}
              >
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {isSelected && (
                  <Check
                    size={14}
                    strokeWidth={3}
                    aria-hidden="true"
                    className="flex-none text-primary"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
