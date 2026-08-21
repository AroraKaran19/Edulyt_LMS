"use client";

import { createContext, useContext } from "react";
import type {
  EnquiryPageSettings,
  EnquirySectionKey,
} from "@/types/enquiry-page-settings";

const SettingsContext = createContext<EnquiryPageSettings>({});

export function EnquirySettingsProvider({
  value,
  children,
}: {
  value: EnquiryPageSettings;
  children: React.ReactNode;
}) {
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

/** Returns `{}` for a section the CMS has not filled in, so callers can `||`. */
export function useSection<K extends EnquirySectionKey>(
  key: K,
): NonNullable<EnquiryPageSettings[K]> {
  const settings = useContext(SettingsContext);
  return (settings[key] ?? {}) as NonNullable<EnquiryPageSettings[K]>;
}

/** Prefers a CMS list, but only when it actually has entries. */
export function listOr<T>(cms: T[] | undefined, fallback: T[]): T[] {
  return cms && cms.length > 0 ? cms : fallback;
}

/** Drops entries the CMS left without an image; they have nothing to render. */
export function withSrc<T extends { src?: string }>(
  items: T[],
): (T & { src: string })[] {
  return items.filter((i): i is T & { src: string } => Boolean(i.src));
}
