import type { EnquirySectionKey } from "@/types/enquiry-page-settings";

/** Order matches the public page top to bottom. */
export const ENQUIRY_SECTIONS: ReadonlyArray<{
  slug: string;
  key: EnquirySectionKey;
  title: string;
  description: string;
}> = [
  {
    slug: "offer",
    key: "offer",
    title: "Offer strip",
    description: "The orange bar above the hero. Can be switched off.",
  },
  {
    slug: "scholarship",
    key: "scholarship",
    title: "Scholarship",
    description:
      "The scholarship line in the lead form, under the plan tiles. Main page only.",
  },
  {
    slug: "hero",
    key: "hero",
    title: "Hero",
    description: "Headline, intro, the two buttons, rating, partner logos.",
  },
  {
    slug: "certificates",
    key: "certificates",
    title: "Certificates",
    description: "The certificate list and the summary above it.",
  },
  {
    slug: "badges",
    key: "badges",
    title: "Badges",
    description: "Exam badges shown as a row of cards.",
  },
  {
    slug: "resumes",
    key: "resumes",
    title: "CV samples",
    description: "Sample CVs showing where each badge lands.",
  },
  {
    slug: "languages",
    key: "languages",
    title: "Languages",
    description: "The language panel below the CV samples.",
  },
  {
    slug: "plans",
    key: "plans",
    title: "Plans and perks",
    description: "Plan names, prices and the full comparison matrix.",
  },
  {
    slug: "how-it-runs",
    key: "howItRuns",
    title: "How it runs",
    description: "The three numbered steps.",
  },
  {
    slug: "track-record",
    key: "trackRecord",
    title: "Track record",
    description: "The centred 'Ten years' statement.",
  },
  {
    slug: "closing",
    key: "closing",
    title: "Closing CTA",
    description: "The orange panel above the footer.",
  },
];

export const findSectionIndex = (slug: string) =>
  ENQUIRY_SECTIONS.findIndex((s) => s.slug === slug);
