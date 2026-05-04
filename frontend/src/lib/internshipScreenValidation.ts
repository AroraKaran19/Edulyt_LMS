import type { InternshipFormData } from "@/types/internshipForm";

/** Plain text length after stripping HTML (for rich text fields). */
export function stripHtmlForValidation(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** URL check for optional absolute links (media, brochure, etc.). */
export function isValidHttpUrl(value: string): boolean {
  const s = value.trim();
  if (!s) return false;
  try {
    const u = new URL(s.includes("://") ? s : `https://${s}`);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * RHF field names to validate when leaving wizard screens 1–11.
 * Screen 2: batches array + per-batch `plan.*` paths so errors attach to inputs.
 */
export function getInternshipScreenTriggerFields(
  screen: number,
  context?: {
    batches?: InternshipFormData["batches"];
    discount?: InternshipFormData["discount"];
    headerList?: InternshipFormData["headerList"];
  },
): string[] {
  switch (screen) {
    case 1: {
      const names: string[] = [
        "title",
        "slug",
        "mode",
        "audience",
        "description",
        "thumbnail",
        "brochure",
        "jobDescription",
        "whatsappGroupLink",
        "certificationThreshold",
        "documentationStartAt",
        "documentationEndAt",
      ];
      const hl = context?.headerList ?? [];
      hl.forEach((_, i) => {
        names.push(`headerList.${i}`);
      });
      return names;
    }
    case 2: {
      const batches = context?.batches ?? [];
      const names: string[] = ["batches"];
      batches.forEach((_, bi) => {
        names.push(`batches.${bi}.plan.price`, `batches.${bi}.applicationLastDate`);
      });

      // Add discount validation if discount is active
      const discount = context?.discount;
      if (discount?.isActive) {
        names.push(
          "discount.discount",
          "discount.value",
          "discount.startTime",
          "discount.endTime",
        );
      }

      return names;
    }
    case 3:
      return ["perks"];
    case 4:
      return ["features"];
    case 5:
      return ["whyJoin"];
    case 6:
      return ["preRequisites", "whoCanJoin"];
    case 7:
      return ["internshipJourney"];
    case 8:
      return ["media"];
    case 9:
      return ["partnerColleges"];
    case 10:
      return ["slug", "metaTitle", "metaDescription", "keywords"];
    case 11:
      return ["testimonials"];
    case 12:
      return ["mentors"];
    case 13:
    case 14:
      return [];
    default:
      return [];
  }
}

export function validatePerksField(
  v: InternshipFormData["perks"],
): true | string {
  if (!v?.length) return "Add at least one perk";
  for (let i = 0; i < v.length; i++) {
    const p = v[i];
    if (!p?.title?.trim()) return `Perk ${i + 1}: title is required`;
    if (!p?.description?.trim())
      return `Perk ${i + 1}: description is required`;
    if (!p?.icon?.trim()) return `Perk ${i + 1}: icon is required`;
  }
  return true;
}

export function validateFeaturesField(
  v: InternshipFormData["features"],
): true | string {
  if (!v?.length) return "Add at least one feature";
  for (let i = 0; i < v.length; i++) {
    const f = v[i];
    if (!f?.title?.trim()) return `Feature ${i + 1}: title is required`;
    if (!f?.description?.trim())
      return `Feature ${i + 1}: description is required`;
    if (!f?.icon?.trim()) return `Feature ${i + 1}: icon is required`;
  }
  return true;
}

export function validateWhyJoinField(
  v: InternshipFormData["whyJoin"],
): true | string {
  if (!v?.length) return "Add at least one reason";
  for (let i = 0; i < v.length; i++) {
    const r = v[i];
    if (!r?.title?.trim()) return `Reason ${i + 1}: title is required`;
    if (!r?.description?.trim())
      return `Reason ${i + 1}: description is required`;
    if (!r?.icon?.trim()) return `Reason ${i + 1}: icon is required`;
  }
  return true;
}

export function validatePreRequisitesField(
  v: InternshipFormData["preRequisites"],
): true | string {
  if (!v?.length) return "Add at least one prerequisite";
  for (let i = 0; i < v.length; i++) {
    const p = v[i];
    if (!p?.title?.trim()) return `Prerequisite ${i + 1}: title is required`;
    if (!p?.icon?.trim()) return `Prerequisite ${i + 1}: icon is required`;
  }
  return true;
}

export function validateWhoCanJoinField(
  v: InternshipFormData["whoCanJoin"],
): true | string {
  if (!v?.length) return "Add at least one candidate type";
  for (let i = 0; i < v.length; i++) {
    const w = v[i];
    if (!w?.title?.trim()) return `Candidate type ${i + 1}: title is required`;
    if (!w?.icon?.trim()) return `Candidate type ${i + 1}: icon is required`;
  }
  return true;
}

export function validateInternshipJourneyField(
  v: InternshipFormData["internshipJourney"],
): true | string {
  if (!v?.length) return "Add at least one journey section";
  for (let i = 0; i < v.length; i++) {
    const s = v[i];
    if (!s?.title?.trim()) return `Section ${i + 1}: title is required`;
    if (!s?.items?.length) {
      return `Section ${i + 1}: add at least one journey item`;
    }
    const emptyAt = s.items.findIndex((item) => !String(item ?? "").trim());
    if (emptyAt !== -1) {
      return `Section ${i + 1}: journey item ${emptyAt + 1} cannot be empty`;
    }
  }
  return true;
}

export function validateMediaField(
  v: InternshipFormData["media"],
): true | string {
  if (!v?.length) return "Add at least one media item";
  for (let i = 0; i < v.length; i++) {
    const m = v[i];
    if (!m?.title?.trim()) return `Media ${i + 1}: title is required`;
    if (!m?.icon?.trim()) return `Media ${i + 1}: icon is required`;
    if (!m?.content?.trim()) return `Media ${i + 1}: upload a file`;
  }
  return true;
}

export function validatePartnerCollegesField(
  v: InternshipFormData["partnerColleges"],
): true | string {
  if (!v?.length) return true;

  // Check max limit
  if (v.length > 6) {
    return "Maximum 6 partner colleges are allowed";
  }

  return true;
}
