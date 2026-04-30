"use client";

import { useSectionState } from "../HomePageSettingsContext";
import {
  FieldGroup,
  ItemListField,
  SectionHeader,
  StringListField,
  TextAreaField,
  TextField,
} from "../components/fields";
import { findSectionIndex, HOME_PAGE_SECTIONS } from "../sections";
import type { HomePathSelectionSectionSettings } from "@/types/home-page-settings";

const idx = findSectionIndex("path-selection");
const meta = HOME_PAGE_SECTIONS[idx];

type ValueProp = { title: string; description: string };

const empty: HomePathSelectionSectionSettings = {
  eyebrow: "",
  headingHighlight: "",
  introParagraphs: [],
  valueProps: [],
};

export default function PathSelectionSectionPage() {
  const { state, setState } = useSectionState("pathSelection", (s) => ({
    ...empty,
    ...(s?.pathSelection ?? {}),
  }));

  const update = (patch: Partial<HomePathSelectionSectionSettings>) =>
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
          placeholder="Choose your path"
        />
        <TextField
          label="Heading highlight"
          value={state.headingHighlight ?? ""}
          onChange={(headingHighlight) => update({ headingHighlight })}
          placeholder="Why Airkrit?"
        />
      </FieldGroup>

      <FieldGroup
        title="Intro paragraphs"
        description="Each entry renders as its own paragraph block."
      >
        <StringListField
          items={state.introParagraphs}
          onChange={(introParagraphs) => update({ introParagraphs })}
          placeholder="A paragraph of intro copy."
          addLabel="Add paragraph"
          multiline
        />
      </FieldGroup>

      <FieldGroup title="Value props">
        <ItemListField<ValueProp>
          items={state.valueProps}
          onChange={(valueProps) => update({ valueProps })}
          newItem={() => ({ title: "", description: "" })}
          itemTitle={(it, i) => it.title || `Value prop ${i + 1}`}
          addLabel="Add value prop"
          renderItem={(item, set) => (
            <>
              <TextField
                label="Title"
                value={item.title}
                onChange={(title) => set({ ...item, title })}
                placeholder="Career-first design"
                required
              />
              <TextAreaField
                label="Description"
                value={item.description}
                onChange={(description) => set({ ...item, description })}
                placeholder="Short description"
                rows={3}
              />
            </>
          )}
        />
      </FieldGroup>
    </div>
  );
}
