"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Loader2,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import apiClient from "@/configs/apiConfig";
import type { Testimonial } from "@/types/course";
import type { FAQ } from "@/types/faq";
import type { Instructor } from "@/types/user";
import { cn } from "@/lib/utils";

type EntityType = "testimonial" | "instructor" | "faq";

type AnyEntity = Testimonial | FAQ | Instructor;

interface EntityMultiSelectProps {
  type: EntityType;
  /** Selected items in display order. Mix of full objects (hydrated from server) or string IDs. */
  value: AnyEntity[];
  onChange: (next: AnyEntity[]) => void;
  label?: string;
  description?: string;
  emptyText?: string;
}

function getId(entity: AnyEntity): string | null {
  return (entity as { _id?: string })._id ?? null;
}

function getDisplay(type: EntityType, entity: AnyEntity): {
  title: string;
  subtitle?: string;
} {
  if (type === "testimonial") {
    const t = entity as Testimonial;
    return {
      title: t.name || "Untitled",
      subtitle: [t.currentRole, t.currentCompany].filter(Boolean).join(" · "),
    };
  }
  if (type === "instructor") {
    const i = entity as Instructor;
    const name =
      [i.firstName, i.lastName].filter(Boolean).join(" ") ||
      i.email ||
      "Untitled";
    return {
      title: name,
      subtitle: [i.currentPosition, i.currentCompany].filter(Boolean).join(" · "),
    };
  }
  const f = entity as FAQ;
  return { title: f.question || "Untitled", subtitle: f.answer?.slice(0, 80) };
}

function parseListEnvelope(payload: unknown): AnyEntity[] {
  if (!payload || typeof payload !== "object") return [];
  const env = payload as { data?: unknown };
  const d = env.data;
  if (Array.isArray(d)) return d as AnyEntity[];
  if (d && typeof d === "object") {
    const inner = d as Record<string, unknown>;
    for (const key of [
      "testimonials",
      "faqs",
      "instructors",
      "items",
      "results",
      "list",
    ]) {
      if (Array.isArray(inner[key])) return inner[key] as AnyEntity[];
    }
  }
  return [];
}

/**
 * Hardcoded to match the actual mounted backend routes (which differ from
 * `ENDPOINTS` in some places, e.g. FAQs are mounted at `/api/faq`, singular).
 */
const ENDPOINT_BY_TYPE: Record<EntityType, string> = {
  testimonial: "/testimonials/admin",
  faq: "/faq/admin",
  instructor: "/instructors",
};

const TITLE_BY_TYPE: Record<EntityType, string> = {
  testimonial: "Pick testimonials",
  instructor: "Pick instructors",
  faq: "Pick FAQs",
};

export default function EntityMultiSelect({
  type,
  value,
  onChange,
  label,
  description,
  emptyText,
}: EntityMultiSelectProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
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

      {value.length === 0 ? (
        <p className="text-xs text-stone-400 italic">
          {emptyText ?? "Nothing selected yet."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {value.map((entity, idx) => {
            const display = getDisplay(type, entity);
            return (
              <li
                key={getId(entity) ?? idx}
                className="flex items-start gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2.5"
              >
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-900 truncate">
                    {display.title}
                  </p>
                  {display.subtitle && (
                    <p className="text-xs text-stone-500 truncate">
                      {display.subtitle}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (idx === 0) return;
                      const next = [...value];
                      [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
                      onChange(next);
                    }}
                    disabled={idx === 0}
                    className="size-7 flex items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ArrowUpIcon className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (idx === value.length - 1) return;
                      const next = [...value];
                      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                      onChange(next);
                    }}
                    disabled={idx === value.length - 1}
                    className="size-7 flex items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ArrowDownIcon className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(value.filter((_, i) => i !== idx))}
                    className="size-7 flex items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                    aria-label="Remove"
                  >
                    <Trash2Icon className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="self-start inline-flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium"
      >
        <PlusIcon className="size-4" />
        {value.length === 0 ? "Pick items" : "Add more"}
      </button>

      {pickerOpen && (
        <PickerModal
          type={type}
          selected={value}
          onClose={() => setPickerOpen(false)}
          onApply={(next) => {
            onChange(next);
            setPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}

function PickerModal({
  type,
  selected,
  onClose,
  onApply,
}: {
  type: EntityType;
  selected: AnyEntity[];
  onClose: () => void;
  onApply: (next: AnyEntity[]) => void;
}) {
  const [list, setList] = useState<AnyEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<AnyEntity[]>(selected);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(ENDPOINT_BY_TYPE[type], {
          params: { limit: 200 },
        });
        if (!cancelled) setList(parseListEnvelope(res.data));
      } catch {
        if (!cancelled) setList([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type]);

  const pickedIds = useMemo(
    () => new Set(picked.map((e) => getId(e)).filter(Boolean) as string[]),
    [picked]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((entity) => {
      const { title, subtitle } = getDisplay(type, entity);
      return (
        title.toLowerCase().includes(q) ||
        (subtitle ?? "").toLowerCase().includes(q)
      );
    });
  }, [list, search, type]);

  const togglePick = (entity: AnyEntity) => {
    const id = getId(entity);
    if (!id) return;
    if (pickedIds.has(id)) {
      setPicked((prev) => prev.filter((e) => getId(e) !== id));
    } else {
      setPicked((prev) => [...prev, entity]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <h3 className="text-base font-semibold text-stone-900">
            {TITLE_BY_TYPE[type]}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-md text-stone-500 hover:bg-stone-100"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-stone-200">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-stone-500 gap-2">
              <Loader2 className="size-5 animate-spin" /> Loading…
            </div>
          ) : visible.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-10">
              No results.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {visible.map((entity) => {
                const id = getId(entity);
                const display = getDisplay(type, entity);
                const isPicked = !!id && pickedIds.has(id);
                return (
                  <li key={id ?? Math.random()}>
                    <button
                      type="button"
                      onClick={() => togglePick(entity)}
                      className={cn(
                        "w-full text-left flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                        isPicked
                          ? "border-orange-300 bg-orange-50"
                          : "border-stone-200 hover:bg-stone-50"
                      )}
                    >
                      <input
                        type="checkbox"
                        readOnly
                        checked={isPicked}
                        className="mt-1 size-4 accent-orange-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-stone-900 truncate">
                          {display.title}
                        </p>
                        {display.subtitle && (
                          <p className="text-xs text-stone-500 truncate">
                            {display.subtitle}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-stone-200 bg-stone-50/50 rounded-b-2xl">
          <span className="text-xs text-stone-500">
            {picked.length} selected
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onApply(picked)}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
