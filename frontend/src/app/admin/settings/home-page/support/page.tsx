"use client";

import { useSectionState } from "../HomePageSettingsContext";
import {
  FieldGroup,
  ItemListField,
  SectionHeader,
  TextAreaField,
  TextField,
} from "../components/fields";
import { findSectionIndex, HOME_PAGE_SECTIONS } from "../sections";
import type { HomeSupportSectionSettings } from "@/types/home-page-settings";

const idx = findSectionIndex("support");
const meta = HOME_PAGE_SECTIONS[idx];

type Highlight = { title: string; description: string };

const empty: HomeSupportSectionSettings = {
  eyebrow: "",
  highlights: [],
};

export default function SupportSectionPage() {
  const { state, setState } = useSectionState("support", (s) => ({
    ...empty,
    ...(s?.support ?? {}),
  }));

  const update = (patch: Partial<HomeSupportSectionSettings>) =>
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
          label="Eyebrow"
          value={state.eyebrow ?? ""}
          onChange={(eyebrow) => update({ eyebrow })}
          placeholder="What we support you with"
        />
      </FieldGroup>

      <FieldGroup title="Support highlights">
        <ItemListField<Highlight>
          items={state.highlights}
          onChange={(highlights) => update({ highlights })}
          newItem={() => ({ title: "", description: "" })}
          itemTitle={(it, i) => it.title || `Highlight ${i + 1}`}
          addLabel="Add highlight"
          renderItem={(item, set) => (
            <>
              <TextField
                label="Title"
                value={item.title}
                onChange={(title) => set({ ...item, title })}
                placeholder="1:1 mentorship"
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
