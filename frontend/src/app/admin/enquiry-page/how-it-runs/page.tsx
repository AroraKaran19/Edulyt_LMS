"use client";

import { useSectionState } from "../EnquirySettingsContext";
import {
  FieldGroup,
  ItemListField,
  SectionHeader,
  TextAreaField,
  TextField,
} from "@/app/admin/settings/home-page/components/fields";
import type { EnquiryStep } from "@/types/enquiry-page-settings";

export default function HowItRunsSectionPage() {
  const { state, setState } = useSectionState("howItRuns", (s) => ({
    eyebrow: s?.howItRuns?.eyebrow ?? "",
    heading: s?.howItRuns?.heading ?? "",
    headingHighlight: s?.howItRuns?.headingHighlight ?? "",
    lead: s?.howItRuns?.lead ?? "",
    steps: s?.howItRuns?.steps ?? [],
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <SectionHeader
        title="How it runs"
        description="Three cards. More than three will wrap onto a second row."
      />

      <FieldGroup>
        <TextField
          label="Eyebrow"
          value={state.eyebrow}
          onChange={(v) => setState((p) => ({ ...p, eyebrow: v }))}
          placeholder="How it runs"
        />
        <TextField
          label="Heading"
          value={state.heading}
          onChange={(v) => setState((p) => ({ ...p, heading: v }))}
          placeholder="Learn, get mentored,"
        />
        <TextField
          label="Heading highlight"
          value={state.headingHighlight}
          onChange={(v) => setState((p) => ({ ...p, headingHighlight: v }))}
          placeholder="get placed"
        />
        <TextAreaField
          label="Lead"
          value={state.lead}
          onChange={(v) => setState((p) => ({ ...p, lead: v }))}
        />
      </FieldGroup>

      <ItemListField<EnquiryStep>
        label="Steps"
        items={state.steps}
        onChange={(steps) => setState((p) => ({ ...p, steps }))}
        newItem={() => ({ no: "", title: "", body: "" })}
        addLabel="Add step"
        itemTitle={(item, i) => item.title || `Step ${i + 1}`}
        renderItem={(item, update) => (
          <div className="flex flex-col gap-3">
            <TextField
              label="Number"
              value={item.no ?? ""}
              onChange={(v) => update({ ...item, no: v })}
              placeholder="01"
            />
            <TextField
              label="Title"
              value={item.title ?? ""}
              onChange={(v) => update({ ...item, title: v })}
              placeholder="Learn"
            />
            <TextAreaField
              label="Body"
              value={item.body ?? ""}
              onChange={(v) => update({ ...item, body: v })}
            />
          </div>
        )}
      />
    </div>
  );
}
