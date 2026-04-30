"use client";

import { useCallback } from "react";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import Input from "@/components/ui/inputs/Input";
import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  description,
  index,
  total,
}: {
  title: string;
  description?: string;
  index?: number;
  total?: number;
}) {
  return (
    <header className="mb-6">
      {typeof index === "number" && typeof total === "number" && (
        <p className="text-xs uppercase tracking-wide text-orange-600 font-semibold mb-1">
          Section {index + 1} of {total}
        </p>
      )}
      <h1 className="text-2xl font-semibold text-stone-900">{title}</h1>
      {description && (
        <p className="text-sm text-stone-500 mt-1">{description}</p>
      )}
    </header>
  );
}

export function FieldGroup({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm",
        className
      )}
    >
      {(title || description) && (
        <header className="mb-4">
          {title && (
            <h2 className="text-base font-semibold text-stone-900">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-stone-500 mt-0.5">{description}</p>
          )}
        </header>
      )}
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  required,
  type = "text",
  min,
  step,
}: {
  label?: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  type?: string;
  min?: number;
  step?: string | number;
}) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      <Input
        label={label}
        required={required}
        type={type}
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {helperText && (
        <p className="text-xs text-stone-500">{helperText}</p>
      )}
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  helperText,
  required,
}: {
  label?: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  rows?: number;
  helperText?: string;
  required?: boolean;
}) {
  return (
    <div className="w-full flex flex-col gap-1.5 text-sm">
      {label && (
        <label className="font-medium text-black block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full px-4 py-3 border rounded-xl bg-white text-black border-gray-300",
          "focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500",
          "hover:border-orange-400 hover:shadow-sm",
          "transition-all duration-200 ease-in-out outline-none shadow-sm"
        )}
      />
      {helperText && (
        <p className="text-xs text-stone-500">{helperText}</p>
      )}
    </div>
  );
}

export function StringListField({
  label,
  description,
  items,
  onChange,
  placeholder,
  addLabel = "Add item",
  multiline = false,
}: {
  label?: string;
  description?: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  addLabel?: string;
  multiline?: boolean;
}) {
  const setAt = useCallback(
    (idx: number, val: string) => {
      const next = [...items];
      next[idx] = val;
      onChange(next);
    },
    [items, onChange]
  );

  const removeAt = useCallback(
    (idx: number) => onChange(items.filter((_, i) => i !== idx)),
    [items, onChange]
  );

  const move = useCallback(
    (idx: number, dir: -1 | 1) => {
      const target = idx + dir;
      if (target < 0 || target >= items.length) return;
      const next = [...items];
      [next[idx], next[target]] = [next[target], next[idx]];
      onChange(next);
    },
    [items, onChange]
  );

  return (
    <div className="w-full flex flex-col gap-2">
      {(label || description) && (
        <div>
          {label && (
            <label className="text-sm font-medium text-black block">
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-stone-500 mt-0.5">{description}</p>
          )}
        </div>
      )}
      <div className="flex flex-col gap-2">
        {items.length === 0 && (
          <p className="text-xs text-stone-400 italic">No items yet.</p>
        )}
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <div className="flex-1">
              {multiline ? (
                <textarea
                  rows={3}
                  value={item}
                  onChange={(e) => setAt(idx, e.target.value)}
                  placeholder={placeholder}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg bg-white text-sm text-black border-gray-300",
                    "focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                  )}
                />
              ) : (
                <Input
                  value={item}
                  onChange={(e) => setAt(idx, e.target.value)}
                  placeholder={placeholder}
                  variant="small"
                />
              )}
            </div>
            <div className="flex items-center gap-1 pt-1">
              <button
                type="button"
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                className="size-8 flex items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                aria-label="Move up"
              >
                <ArrowUpIcon className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => move(idx, 1)}
                disabled={idx === items.length - 1}
                className="size-8 flex items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                aria-label="Move down"
              >
                <ArrowDownIcon className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="size-8 flex items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                aria-label="Remove"
              >
                <Trash2Icon className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="self-start inline-flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium"
      >
        <PlusIcon className="size-4" />
        {addLabel}
      </button>
    </div>
  );
}

export function ItemListField<T>({
  label,
  description,
  items,
  onChange,
  renderItem,
  newItem,
  addLabel = "Add item",
  itemTitle,
}: {
  label?: string;
  description?: string;
  items: T[];
  onChange: (next: T[]) => void;
  renderItem: (item: T, update: (next: T) => void, idx: number) => React.ReactNode;
  newItem: () => T;
  addLabel?: string;
  itemTitle?: (item: T, idx: number) => string;
}) {
  const updateAt = useCallback(
    (idx: number, val: T) => {
      const next = [...items];
      next[idx] = val;
      onChange(next);
    },
    [items, onChange]
  );

  const removeAt = useCallback(
    (idx: number) => onChange(items.filter((_, i) => i !== idx)),
    [items, onChange]
  );

  const move = useCallback(
    (idx: number, dir: -1 | 1) => {
      const target = idx + dir;
      if (target < 0 || target >= items.length) return;
      const next = [...items];
      [next[idx], next[target]] = [next[target], next[idx]];
      onChange(next);
    },
    [items, onChange]
  );

  return (
    <div className="w-full flex flex-col gap-3">
      {(label || description) && (
        <div>
          {label && (
            <h3 className="text-sm font-semibold text-black">{label}</h3>
          )}
          {description && (
            <p className="text-xs text-stone-500 mt-0.5">{description}</p>
          )}
        </div>
      )}
      <div className="flex flex-col gap-3">
        {items.length === 0 && (
          <p className="text-xs text-stone-400 italic">No items yet.</p>
        )}
        {items.map((item, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-stone-200 bg-stone-50/40 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-stone-600 uppercase tracking-wide">
                {itemTitle ? itemTitle(item, idx) : `Item ${idx + 1}`}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="size-7 flex items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ArrowUpIcon className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  disabled={idx === items.length - 1}
                  className="size-7 flex items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ArrowDownIcon className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="size-7 flex items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                  aria-label="Remove"
                >
                  <Trash2Icon className="size-4" />
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {renderItem(item, (next) => updateAt(idx, next), idx)}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, newItem()])}
        className="self-start inline-flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium"
      >
        <PlusIcon className="size-4" />
        {addLabel}
      </button>
    </div>
  );
}
