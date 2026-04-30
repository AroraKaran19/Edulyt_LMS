"use client";

import { useSectionState } from "../HomePageSettingsContext";
import CoursePathFormBody from "../components/CoursePathFormBody";
import { SectionHeader } from "../components/fields";
import { findSectionIndex, HOME_PAGE_SECTIONS } from "../sections";
import type { HomeCoursePathSettings } from "@/types/home-page-settings";

const idx = findSectionIndex("course-path-professionals");
const meta = HOME_PAGE_SECTIONS[idx];

const empty: HomeCoursePathSettings = {
  eyebrow: "",
  title: "",
  coursesHeadingPrefix: "",
  coursesHeadingHighlight: "",
  audience: "professionals",
};

export default function CoursePathProfessionalsPage() {
  const { state, setState } = useSectionState(
    "coursePathProfessionals",
    (s) => ({
      ...empty,
      ...(s?.coursePathProfessionals ?? {}),
    }),
  );

  const update = (patch: Partial<HomeCoursePathSettings>) =>
    setState((prev) => ({ ...prev, ...patch }));

  return (
    <div className="w-full mx-auto flex flex-col gap-5">
      <SectionHeader
        title={meta.title}
        description={meta.description}
        index={idx}
        total={HOME_PAGE_SECTIONS.length}
      />
      <CoursePathFormBody state={state} update={update} />
    </div>
  );
}
