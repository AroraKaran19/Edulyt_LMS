"use client";

import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { HOME_PAGE_SECTIONS } from "./sections";

export default function HomePageSettingsIndexPage() {
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <header>
        <p className="text-xs uppercase tracking-wide text-orange-600 font-semibold mb-1">
          Home Page Settings
        </p>
        <h1 className="text-2xl font-semibold text-stone-900">
          Edit your home page
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Pick a section to edit. Sections are ordered as they appear on the
          public homepage.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {HOME_PAGE_SECTIONS.map((section, idx) => (
          <Link
            key={section.slug}
            href={`/admin/settings/home-page/${section.slug}`}
            className="group rounded-2xl border border-stone-200 bg-white p-4 hover:border-orange-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700 text-sm font-semibold">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-stone-900 group-hover:text-orange-700">
                  {section.title}
                </h3>
                <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                  {section.description}
                </p>
              </div>
              <ChevronRightIcon className="size-4 text-stone-400 mt-1 shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
