import type { CaPageAdminSectionKey } from "@/types/ca-page-admin-settings";

/** Order matches the public page top to bottom. */
export const CA_SECTIONS: ReadonlyArray<{
  slug: string;
  key: CaPageAdminSectionKey;
  title: string;
  description: string;
}> = [
  {
    slug: "enrollment",
    key: "enrollment",
    title: "Enrollment",
    description: "Whether applications are open, the durations offered, and the points minimum for completion documents.",
  },
  {
    slug: "form",
    key: "form",
    title: "Form fields",
    description:
      "Which fields show, which are required, languages and the WhatsApp link.",
  },
  {
    slug: "documents",
    key: "documents",
    title: "Offer letter",
    description: "The designation printed on each kind's offer letter.",
  },
  {
    slug: "money",
    key: "money",
    title: "Amounts",
    description:
      "Stipend, incentives, bonus, kit, LMS and PPO figures used across the page.",
  },
  {
    slug: "statement",
    key: "statement",
    title: "Statement",
    description: "The rows of the Campus Ambassador statement table.",
  },
  {
    slug: "hero",
    key: "hero",
    title: "Hero",
    description: "Headline, intro and the job description file.",
  },
  {
    slug: "kit",
    key: "kit",
    title: "Joining kit",
    description: "Kit photo and items.",
  },
  {
    slug: "videos",
    key: "videos",
    title: "Videos",
    description: "Intern videos. The section hides when there are none.",
  },
  {
    slug: "faqs",
    key: "faqs",
    title: "FAQs",
    description: "Questions and answers. Empty keeps the shipped list.",
  },
  {
    slug: "samples",
    key: "samples",
    title: "Sample documents",
    description: "The four letter images in the documents viewer.",
  },
  {
    slug: "seo",
    key: "seo",
    title: "SEO",
    description: "Search title, description, keywords and the link preview when the page is shared.",
  },
];

export const findSectionIndex = (slug: string) =>
  CA_SECTIONS.findIndex((s) => s.slug === slug);
