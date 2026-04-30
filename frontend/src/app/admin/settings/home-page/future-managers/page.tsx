"use client";

import { useSectionState } from "../HomePageSettingsContext";
import EntityMultiSelect from "../components/EntityMultiSelect";
import { FieldGroup, SectionHeader, TextField } from "../components/fields";
import { findSectionIndex, HOME_PAGE_SECTIONS } from "../sections";
import type { HomeFutureManagerSectionSettings } from "@/types/home-page-settings";
import type { Instructor } from "@/types/user";

const idx = findSectionIndex("future-managers");
const meta = HOME_PAGE_SECTIONS[idx];

const empty: HomeFutureManagerSectionSettings = {
  eyebrow: "",
  headingLearn: "",
  headingHire: "",
  instructors: [],
};

export default function FutureManagersSectionPage() {
  const { state, setState } = useSectionState("futureManagers", (s) => ({
    ...empty,
    ...(s?.futureManagers ?? {}),
  }));

  const update = (patch: Partial<HomeFutureManagerSectionSettings>) =>
    setState((prev) => ({ ...prev, ...patch }));

  return (
    <div className="w-full mx-auto flex flex-col gap-5">
      <SectionHeader
        title={meta.title}
        description={meta.description}
        index={idx}
        total={HOME_PAGE_SECTIONS.length}
      />

      <FieldGroup title="Heading">
        <TextField
          label="Eyebrow"
          value={state.eyebrow ?? ""}
          onChange={(eyebrow) => update({ eyebrow })}
          placeholder="Meet your mentors"
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <TextField
            label="Heading — learn"
            value={state.headingLearn ?? ""}
            onChange={(headingLearn) => update({ headingLearn })}
            placeholder="Learn from"
          />
          <TextField
            label="Heading — hire"
            value={state.headingHire ?? ""}
            onChange={(headingHire) => update({ headingHire })}
            placeholder="who hire"
          />
        </div>
      </FieldGroup>

      <FieldGroup
        title="Featured instructors"
        description="Pick from existing instructors. Order here is the display order."
      >
        <EntityMultiSelect
          type="instructor"
          value={state.instructors as Instructor[]}
          onChange={(instructors) =>
            update({ instructors: instructors as Instructor[] })
          }
          emptyText="No instructors selected yet."
        />
      </FieldGroup>
    </div>
  );
}
