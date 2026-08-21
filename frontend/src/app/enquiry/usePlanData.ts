"use client";

import { useMemo } from "react";
import {
  MNC_ADDON_PRICE,
  PERK_GROUPS,
  PLANS,
  type Perk,
  type PerkGroup,
  type PerkState,
  type Plan,
  type PlanId,
} from "./plans";
import { useSection } from "./settings";
import type {
  EnquiryPerk,
  EnquiryPerkGroup,
  EnquiryPlan,
} from "@/types/enquiry-page-settings";

/**
 * The plan tiles, the matrix, the form total and the certificates summary all
 * quote the same numbers. Resolving them in one place is what stops the page
 * contradicting itself when only some of them are wired to the CMS.
 */

/**
 * Overlays CMS entries onto the shipped plans by id rather than replacing the
 * array, so the result is always the three ids the lead proxy validates against
 * even if the CMS document is half filled in.
 */
const mergePlans = (cms?: EnquiryPlan[]): Plan[] =>
  PLANS.map((shipped) => {
    const edit = cms?.find((p) => p.id === shipped.id);
    if (!edit) return shipped;
    return {
      ...shipped,
      no: edit.no || shipped.no,
      name: edit.name || shipped.name,
      price: typeof edit.price === "number" ? edit.price : shipped.price,
      tagline: edit.tagline || shipped.tagline,
      bestFor: edit.bestFor || shipped.bestFor,
      badge: edit.badge ?? shipped.badge,
    };
  });

const toPerkState = (raw?: {
  kind?: string;
  note?: string;
  price?: number;
}): PerkState => {
  if (raw?.kind === "included") {
    return raw.note ? { kind: "included", note: raw.note } : { kind: "included" };
  }
  if (raw?.kind === "addon") {
    return {
      kind: "addon",
      price: raw.price ?? MNC_ADDON_PRICE,
      ...(raw.note ? { note: raw.note } : {}),
    };
  }
  return { kind: "excluded" };
};

const toPerk = (raw: EnquiryPerk): Perk => ({
  label: raw.label ?? "",
  ...(raw.id === "mnc" ? { id: "mnc" as const } : {}),
  by: {
    1: toPerkState(raw.by?.["1"]),
    2: toPerkState(raw.by?.["2"]),
    3: toPerkState(raw.by?.["3"]),
  },
});

/**
 * Taken wholesale rather than merged row by row: the admin owns the structure,
 * and merging by index would resurrect a row they deleted.
 */
const mergePerkGroups = (cms?: EnquiryPerkGroup[]): PerkGroup[] => {
  const usable = cms?.filter((g) => g.perks && g.perks.length > 0);
  if (!usable || usable.length === 0) return PERK_GROUPS;
  return usable.map((g) => ({
    title: g.title ?? "",
    perks: (g.perks ?? []).map(toPerk),
  }));
};

export interface PlanData {
  plans: Plan[];
  perkGroups: PerkGroup[];
  mncAddonPrice: number;
  allPerks: Perk[];
  planById: (id: PlanId) => Plan;
  countIncluded: (id: PlanId) => number;
}

export function usePlanData(): PlanData {
  const cms = useSection("plans");

  return useMemo(() => {
    const plans = mergePlans(cms.plans);
    const perkGroups = mergePerkGroups(cms.perkGroups);
    const allPerks = perkGroups.flatMap((g) => g.perks);

    return {
      plans,
      perkGroups,
      mncAddonPrice: cms.mncAddonPrice || MNC_ADDON_PRICE,
      allPerks,
      planById: (id) => plans.find((p) => p.id === id) ?? plans[0],
      countIncluded: (id) =>
        allPerks.filter((perk) => perk.by[id].kind === "included").length,
    };
  }, [cms]);
}
