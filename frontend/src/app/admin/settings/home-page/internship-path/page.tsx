"use client";

import { useSectionState } from "../HomePageSettingsContext";
import { FieldGroup, SectionHeader, TextField } from "../components/fields";
import { findSectionIndex, HOME_PAGE_SECTIONS } from "../sections";
import type { HomeInternshipPathSettings } from "@/types/home-page-settings";

const idx = findSectionIndex("internship-path");
const meta = HOME_PAGE_SECTIONS[idx];

const empty: HomeInternshipPathSettings = {
  titleHighlight: "",
  titleRest: "",
};

export default function InternshipPathPage() {
  const { state, setState } = useSectionState("internshipPath", (s) => ({
    ...empty,
    ...(s?.internshipPath ?? {}),
  }));

  const update = (patch: Partial<HomeInternshipPathSettings>) =>
    setState((prev) => ({ ...prev, ...patch }));

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">
      <SectionHeader
        title={meta.title}
        description={meta.description}
        index={idx}
        total={HOME_PAGE_SECTIONS.length}
      />

      <FieldGroup title="Heading">
        <TextField
          label="Title highlight"
          value={state.titleHighlight ?? ""}
          onChange={(titleHighlight) => update({ titleHighlight })}
          placeholder="Industry"
        />
        <TextField
          label="Title rest"
          value={state.titleRest ?? ""}
          onChange={(titleRest) => update({ titleRest })}
          placeholder="-Aligned Internships"
        />
      </FieldGroup>
    </div>
  );
}
