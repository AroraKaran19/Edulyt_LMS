"use client";

import React, { useState } from "react";
import { Check, ChevronDown, ChevronRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ADMIN_PERMISSION_CATALOG,
  AdminSection,
} from "@/config/adminPermissions";

/**
 * Section/page permission tree.
 *
 * Works internally in fully-expanded page keys, then collapses on every change:
 * a section with all pages selected emits its bare section key ("courses"),
 * otherwise the individual page keys ("courses.enrollments"). Single-page
 * sections always emit their one key.
 */

/** value (mixed section/page keys) → set of concrete page keys. */
const expandToPageKeys = (keys: readonly string[]): Set<string> => {
  const set = new Set<string>();
  for (const section of ADMIN_PERMISSION_CATALOG) {
    for (const page of section.pages) {
      if (keys.includes(page.key) || keys.includes(section.key)) {
        set.add(page.key);
      }
    }
  }
  return set;
};

/** set of page keys → collapsed keys (section key when a section is fully on). */
const collapse = (pageSet: Set<string>): string[] => {
  const out: string[] = [];
  for (const section of ADMIN_PERMISSION_CATALOG) {
    const selected = section.pages.filter((p) => pageSet.has(p.key));
    if (selected.length === 0) continue;
    if (!section.single && selected.length === section.pages.length) {
      out.push(section.key);
    } else {
      out.push(...selected.map((p) => p.key));
    }
  }
  return out;
};

type CheckState = "checked" | "indeterminate" | "unchecked";

const CheckBox = ({
  state,
  disabled,
}: {
  state: CheckState;
  disabled?: boolean;
}) => (
  <span
    className={cn(
      "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
      state === "unchecked"
        ? "border-gray-300 bg-white"
        : "border-orange-500 bg-orange-500 text-white",
      disabled && "opacity-50",
    )}
  >
    {state === "checked" && <Check className="size-3.5" strokeWidth={3} />}
    {state === "indeterminate" && <Minus className="size-3.5" strokeWidth={3} />}
  </span>
);

const PermissionPicker = ({
  value,
  onChange,
  disabled = false,
}: {
  value: string[];
  onChange: (keys: string[]) => void;
  disabled?: boolean;
}) => {
  const pageSet = expandToPageKeys(value);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const emit = (next: Set<string>) => onChange(collapse(next));

  const togglePage = (pageKey: string) => {
    if (disabled) return;
    const next = new Set(pageSet);
    if (next.has(pageKey)) next.delete(pageKey);
    else next.add(pageKey);
    emit(next);
  };

  const toggleSection = (section: AdminSection) => {
    if (disabled) return;
    const next = new Set(pageSet);
    const allOn = section.pages.every((p) => next.has(p.key));
    section.pages.forEach((p) => (allOn ? next.delete(p.key) : next.add(p.key)));
    emit(next);
  };

  return (
    <div className="flex flex-col gap-2">
      {ADMIN_PERMISSION_CATALOG.map((section) => {
        const selectedCount = section.pages.filter((p) =>
          pageSet.has(p.key),
        ).length;
        const total = section.pages.length;
        const sectionState: CheckState =
          selectedCount === 0
            ? "unchecked"
            : selectedCount === total
              ? "checked"
              : "indeterminate";
        const isOpen = expanded[section.key] ?? false;

        return (
          <div
            key={section.key}
            className="rounded-lg border border-gray-200 bg-white overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2.5">
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggleSection(section)}
                className="flex items-center gap-2.5 flex-1 min-w-0 text-left disabled:cursor-not-allowed"
              >
                <CheckBox state={sectionState} disabled={disabled} />
                <span className="font-semibold text-sm text-[#1D2939] truncate">
                  {section.label}
                </span>
                {!section.single && (
                  <span className="text-xs text-[#475467] shrink-0">
                    {selectedCount}/{total}
                  </span>
                )}
              </button>
              {!section.single && (
                <button
                  type="button"
                  onClick={() =>
                    setExpanded((prev) => ({
                      ...prev,
                      [section.key]: !isOpen,
                    }))
                  }
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
                  aria-label={isOpen ? "Collapse" : "Expand"}
                >
                  {isOpen ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                </button>
              )}
            </div>

            {!section.single && isOpen && (
              <div className="border-t border-gray-100 bg-gray-50/50 px-3 py-2 flex flex-col gap-1">
                {section.pages.map((page) => {
                  const checked = pageSet.has(page.key);
                  return (
                    <button
                      key={page.key}
                      type="button"
                      disabled={disabled}
                      onClick={() => togglePage(page.key)}
                      className="flex items-center gap-2.5 py-1.5 pl-6 text-left rounded-md hover:bg-white disabled:cursor-not-allowed"
                    >
                      <CheckBox
                        state={checked ? "checked" : "unchecked"}
                        disabled={disabled}
                      />
                      <span className="text-sm text-[#344054]">
                        {page.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PermissionPicker;
