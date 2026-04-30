"use client";

import { useSectionState } from "../HomePageSettingsContext";
import EntityMultiSelect from "../components/EntityMultiSelect";
import {
  FieldGroup,
  SectionHeader,
  TextAreaField,
  TextField,
} from "../components/fields";
import { findSectionIndex, HOME_PAGE_SECTIONS } from "../sections";
import type { HomeFaqSectionSettings } from "@/types/home-page-settings";
import type { FAQ } from "@/types/faq";

const idx = findSectionIndex("faq");
const meta = HOME_PAGE_SECTIONS[idx];

const empty: HomeFaqSectionSettings = {
  title: "",
  description: "",
  faqs: [],
};

export default function FaqSectionPage() {
  const { state, setState } = useSectionState("faq", (s) => ({
    ...empty,
    ...(s?.faq ?? {}),
  }));

  const update = (patch: Partial<HomeFaqSectionSettings>) =>
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
          label="Title"
          value={state.title ?? ""}
          onChange={(title) => update({ title })}
          placeholder="Frequently Asked Questions"
        />
        <TextAreaField
          label="Description"
          value={state.description ?? ""}
          onChange={(description) => update({ description })}
          placeholder="Short paragraph below the title."
          rows={3}
        />
      </FieldGroup>

      <FieldGroup
        title="Featured FAQs"
        description="Pick from existing FAQs. Order here is the display order."
      >
        <EntityMultiSelect
          type="faq"
          value={state.faqs as FAQ[]}
          onChange={(faqs) => update({ faqs: faqs as FAQ[] })}
          emptyText="No FAQs selected yet."
        />
      </FieldGroup>
    </div>
  );
}
