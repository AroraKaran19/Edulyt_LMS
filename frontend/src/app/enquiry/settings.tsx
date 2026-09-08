"use client";

import { createContext, useContext } from "react";
import type {
  EnquiryPageSettings,
  EnquirySectionKey,
} from "@/types/enquiry-page-settings";

const SettingsContext = createContext<EnquiryPageSettings>({});

/**
 * Plan prices for this visit, fetched per request rather than shipped.
 *
 * Deliberately separate from the settings context: settings are cached and
 * shared, while whether prices may be shown depends on the referral link, so
 * they cannot travel together. An empty `plans` list means prices are withheld,
 * and there is then no number anywhere on the page or in its payload.
 */
export type EnquiryPricing = {
  plans: { id: number; price: number }[];
  mncAddonPrice: number | null;
};

const PricingContext = createContext<EnquiryPricing>({
  plans: [],
  mncAddonPrice: null,
});

export function EnquiryPricingProvider({
  value,
  children,
}: {
  value: EnquiryPricing;
  children: React.ReactNode;
}) {
  return (
    <PricingContext.Provider value={value}>{children}</PricingContext.Provider>
  );
}

export function usePricing(): EnquiryPricing {
  return useContext(PricingContext);
}

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
