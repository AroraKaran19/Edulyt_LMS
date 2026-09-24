"use client";

import { Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CaStatementIcon } from "@/types/ca-page-settings";
import Icon, { ICON_NAMES } from "@/app/digital-marketing-internship/components/Icon";

const label = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

export default function IconPicker({
  value,
  onChange,
}: {
  value: CaStatementIcon;
  onChange: (icon: CaStatementIcon) => void;
}) {
  const options: CaStatementIcon[] = ["none", ...ICON_NAMES];

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-700">Icon</p>
      <div role="radiogroup" aria-label="Icon" className="flex flex-wrap gap-2">
        {options.map((name) => {
          const selected = value === name;
          const title = name === "none" ? "No icon (quiet note)" : label(name);
          return (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={title}
              title={title}
              onClick={() => onChange(name)}
              className={cn(
                "flex size-10 items-center justify-center rounded-lg border transition-colors",
                selected
                  ? "border-orange-500 bg-orange-50 text-orange-600 ring-2 ring-orange-500/20"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50",
              )}
            >
              {name === "none" ? <Ban className="size-[18px]" /> : <Icon name={name} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
