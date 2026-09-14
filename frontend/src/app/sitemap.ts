import type { MetadataRoute } from "next";
import { API_BASE_URL } from "@/constants/endpoints";

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://www.airkrit.com").replace(
  /\/+$/,
  "",
);

const STATIC_PATHS = [
  "",
  "/programs",
  "/community",
  "/about",
  "/contact",
  "/faq",
  "/privacy-policy",
  "/terms-of-use",
  "/security-policy",
  "/cancellation-refund-policy",
];

/**
 * One page, sized well above the catalogue: the public list sorts randomly for
 * discovery, so paging through it could skip or repeat courses.
 */
const COURSE_LIMIT = 1000;

export const revalidate = 3600;

async function listCourseSlugs(): Promise<string[]> {
  if (!API_BASE_URL) return [];
  try {
    const res = await fetch(`${API_BASE_URL}/courses?page=1&limit=${COURSE_LIMIT}`, {
      next: { revalidate },
    });
    if (!res.ok) return [];
    const data = (await res.json())?.data;
    const courses: unknown[] = Array.isArray(data?.courses) ? data.courses : [];
    return courses
      .map((course) => (course as { slug?: unknown }).slug)
      .filter((slug): slug is string => typeof slug === "string" && slug.length > 0);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await listCourseSlugs();
  return [
    ...STATIC_PATHS.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...slugs.map((slug) => ({ url: `${SITE_URL}/programs/${slug}` })),
  ];
}
