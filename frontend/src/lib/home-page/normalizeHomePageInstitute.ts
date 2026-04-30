import type {
  HomeInstituteSpotlight,
  HomePageInstitute,
} from "@/types/home-page-settings";

type LegacyFields = {
  internship_spotlight_first_name?: string;
  internship_spotlight_last_name?: string;
  internship_spotlight_avatar?: string;
  course_spotlight_first_name?: string;
  course_spotlight_last_name?: string;
  course_spotlight_avatar?: string;
};

/**
 * Merges pre-array CMS fields into `*_spotlights` so older API payloads still render.
 */
export function normalizeHomePageInstitute(
  raw: HomePageInstitute & LegacyFields
): HomePageInstitute {
  let internship_spotlights = [...(raw.internship_spotlights ?? [])];
  let course_spotlights = [...(raw.course_spotlights ?? [])];

  if (
    internship_spotlights.length === 0 &&
    (raw.internship_spotlight_first_name?.trim() ||
      raw.internship_spotlight_last_name?.trim() ||
      raw.internship_spotlight_avatar?.trim())
  ) {
    internship_spotlights = [
      {
        first_name:
          raw.internship_spotlight_first_name?.trim() || "John",
        last_name:
          raw.internship_spotlight_last_name?.trim() || "Doe",
        avatar: raw.internship_spotlight_avatar?.trim() ?? "",
      },
    ];
  }

  if (
    course_spotlights.length === 0 &&
    (raw.course_spotlight_first_name?.trim() ||
      raw.course_spotlight_last_name?.trim() ||
      raw.course_spotlight_avatar?.trim())
  ) {
    course_spotlights = [
      {
        first_name: raw.course_spotlight_first_name?.trim() || "John",
        last_name: raw.course_spotlight_last_name?.trim() || "Doe",
        avatar: raw.course_spotlight_avatar?.trim() ?? "",
      },
    ];
  }

  return {
    ...raw,
    internship_spotlights,
    course_spotlights,
  };
}
