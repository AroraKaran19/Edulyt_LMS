import type { HomePageSettings } from "@/types/home-page-settings";

/** Order matches the public homepage rendering order in `Homepage.tsx`. */
export const HOME_PAGE_SECTIONS: ReadonlyArray<{
  slug: string;
  key: keyof HomePageSettings;
  title: string;
  description: string;
}> = [
  {
    slug: "hero",
    key: "hero",
    title: "Hero",
    description: "Top cards, comparison table, explore CTA.",
  },
  {
    slug: "student",
    key: "student",
    title: "Student Section",
    description: "Confusion prompts and help CTA for college students.",
  },
  {
    slug: "industry",
    key: "industry",
    title: "Industry Section",
    description: "Expert help bullets, image, book consultation CTA.",
  },
  {
    slug: "course-path-students",
    key: "coursePathStudents",
    title: "Course Path (Students)",
    description: "Two-paths title and course audience for college students.",
  },
  {
    slug: "testimonial",
    key: "testimonial",
    title: "Testimonials",
    description: "Heading and selected testimonials for the home reel.",
  },
  {
    slug: "institutions",
    key: "institutions",
    title: "Institutions",
    description: "Trusted colleges/partners with student counts.",
  },
  {
    slug: "training",
    key: "training",
    title: "Training Section",
    description: "Heading, side image and pillar cards.",
  },
  {
    slug: "support",
    key: "support",
    title: "Support Section",
    description: "Eyebrow and support highlight cards.",
  },
  {
    slug: "prepare",
    key: "prepare",
    title: "Prepare Section",
    description: "Eyebrow, heading and prepare-step icon cards.",
  },
  {
    slug: "future-managers",
    key: "futureManagers",
    title: "Future Managers",
    description: "Heading and instructors featured on the home page.",
  },
  {
    slug: "dream-job",
    key: "dreamJob",
    title: "Dream Job Section",
    description: "Bullets, image and Get Started CTA.",
  },
  {
    slug: "faq",
    key: "faq",
    title: "FAQ",
    description: "Title, description and selected FAQs.",
  },
];

export function findSectionIndex(slug: string): number {
  return HOME_PAGE_SECTIONS.findIndex((s) => s.slug === slug);
}
