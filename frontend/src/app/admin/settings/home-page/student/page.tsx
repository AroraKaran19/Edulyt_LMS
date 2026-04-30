"use client";

import { useSectionState } from "../HomePageSettingsContext";
import {
  FieldGroup,
  SectionHeader,
  StringListField,
  TextField,
} from "../components/fields";
import { findSectionIndex, HOME_PAGE_SECTIONS } from "../sections";
import type { HomeStudentSectionSettings } from "@/types/home-page-settings";

const idx = findSectionIndex("student");
const meta = HOME_PAGE_SECTIONS[idx];

const empty: HomeStudentSectionSettings = {
  badgeLabel: "",
  headingPrefix: "",
  headingHighlightCareer: "",
  confusionPrompts: [],
  helpCtaText: "",
};

export default function StudentSectionPage() {
  const { state, setState } = useSectionState("student", (s) => ({
    ...empty,
    ...(s?.student ?? {}),
  }));

  const update = (patch: Partial<HomeStudentSectionSettings>) =>
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
          label="Badge label"
          value={state.badgeLabel ?? ""}
          onChange={(badgeLabel) => update({ badgeLabel })}
          placeholder="Built for College Students"
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <TextField
            label="Heading prefix"
            value={state.headingPrefix ?? ""}
            onChange={(headingPrefix) => update({ headingPrefix })}
            placeholder="Confused About Your"
          />
          <TextField
            label="Heading highlight (Career)"
            value={state.headingHighlightCareer ?? ""}
            onChange={(headingHighlightCareer) =>
              update({ headingHighlightCareer })
            }
            placeholder="Career?"
          />
        </div>
      </FieldGroup>

      <FieldGroup
        title="Confusion prompts"
        description="Quick prompts shown to college students."
      >
        <StringListField
          items={state.confusionPrompts}
          onChange={(confusionPrompts) => update({ confusionPrompts })}
          placeholder="Don't know which course to pick?"
          addLabel="Add prompt"
        />
      </FieldGroup>

      <FieldGroup title="Help CTA">
        <TextField
          label="Help CTA text"
          value={state.helpCtaText ?? ""}
          onChange={(helpCtaText) => update({ helpCtaText })}
          placeholder="We can help you decide"
        />
      </FieldGroup>
    </div>
  );
}
