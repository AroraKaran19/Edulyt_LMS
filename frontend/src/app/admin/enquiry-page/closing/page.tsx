"use client";

import { useSectionState } from "../EnquirySettingsContext";
import {
  FieldGroup,
  SectionHeader,
  TextAreaField,
  TextField,
} from "@/app/admin/settings/home-page/components/fields";
export default function ClosingSectionPage() {
  const { state, setState } = useSectionState("closing", (s) => ({
    heading: s?.closing?.heading ?? "",
    body: s?.closing?.body ?? "",
    ctaLabel: s?.closing?.ctaLabel ?? "",
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <SectionHeader
        title="Closing CTA"
        description="The orange panel above the footer."
      />
      <FieldGroup>
        <TextField
          label="Heading"
          value={state.heading}
          onChange={(v) => setState((p) => ({ ...p, heading: v }))}
          placeholder="Three plans. One short form."
        />
        <TextAreaField
          label="Body"
          value={state.body}
          onChange={(v) => setState((p) => ({ ...p, body: v }))}
        />
        <TextField
          label="Button label"
          value={state.ctaLabel}
          onChange={(v) => setState((p) => ({ ...p, ctaLabel: v }))}
          helperText="Blank uses the selected plan name, e.g. 'Get Blended details'."
        />
      </FieldGroup>
    </div>
  );
}
