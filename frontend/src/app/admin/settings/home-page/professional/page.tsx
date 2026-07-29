"use client";

import { useSectionState } from "../HomePageSettingsContext";
import {
  FieldGroup,
  SectionHeader,
  StringListField,
  TextField,
} from "../components/fields";
import ImageField from "../components/ImageField";
import { findSectionIndex, HOME_PAGE_SECTIONS } from "../sections";
import type { HomeProfessionalSectionSettings } from "@/types/home-page-settings";

const idx = findSectionIndex("professional");
const meta = HOME_PAGE_SECTIONS[idx];

const empty: HomeProfessionalSectionSettings = {
  eyebrow: "",
  headingLine1: "",
  headingHighlightStudent: "",
  headingLine2: "",
  headingHighlightWorking: "",
  promptBullets: [],
  helpCtaText: "",
  imageSrc: "",
  imageAlt: "",
};

export default function ProfessionalSectionPage() {
  const { state, setState } = useSectionState("professional", (s) => ({
    ...empty,
    ...(s?.professional ?? {}),
  }));

  const update = (patch: Partial<HomeProfessionalSectionSettings>) =>
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
          placeholder="For working professionals"
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <TextField
            label="Heading line 1"
            value={state.headingLine1 ?? ""}
            onChange={(headingLine1) => update({ headingLine1 })}
            placeholder="From"
          />
          <TextField
            label="Highlight — Student"
            value={state.headingHighlightStudent ?? ""}
            onChange={(headingHighlightStudent) =>
              update({ headingHighlightStudent })
            }
            placeholder="Student"
          />
          <TextField
            label="Heading line 2"
            value={state.headingLine2 ?? ""}
            onChange={(headingLine2) => update({ headingLine2 })}
            placeholder="to"
          />
          <TextField
            label="Highlight — Working"
            value={state.headingHighlightWorking ?? ""}
            onChange={(headingHighlightWorking) =>
              update({ headingHighlightWorking })
            }
            placeholder="Working Professional"
          />
        </div>
      </FieldGroup>

      <FieldGroup
        title="Prompt bullets"
        description="Quick prompts shown to working professionals."
      >
        <StringListField
          items={state.promptBullets}
          onChange={(promptBullets) => update({ promptBullets })}
          placeholder="Stuck in a non-tech role?"
          addLabel="Add prompt"
        />
      </FieldGroup>

      <FieldGroup title="Help CTA">
        <TextField
          label="Help CTA text"
          value={state.helpCtaText ?? ""}
          onChange={(helpCtaText) => update({ helpCtaText })}
          placeholder="Talk to a mentor"
        />
      </FieldGroup>

      <FieldGroup title="Side image">
        <ImageField
          title="Professional section image"
          description="Shown to the right of the prompt bullets."
          imageSrc={state.imageSrc}
          imageAlt={state.imageAlt}
          onChange={({ imageSrc, imageAlt }) => update({ imageSrc, imageAlt })}
          folderName="home-page/professional"
        />
      </FieldGroup>
    </div>
  );
}
