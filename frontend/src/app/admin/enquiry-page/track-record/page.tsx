"use client";

import { useSectionState } from "../EnquirySettingsContext";
import {
  FieldGroup,
  SectionHeader,
  TextAreaField,
  TextField,
} from "@/app/admin/settings/home-page/components/fields";
export default function TrackRecordSectionPage() {
  const { state, setState } = useSectionState("trackRecord", (s) => ({
    heading: s?.trackRecord?.heading ?? "",
    headingHighlight: s?.trackRecord?.headingHighlight ?? "",
    lead: s?.trackRecord?.lead ?? "",
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <SectionHeader
        title="Track record"
        description="The centred statement between How it runs and the closing CTA."
      />
      <FieldGroup>
        <TextField
          label="Heading"
          value={state.heading}
          onChange={(v) => setState((p) => ({ ...p, heading: v }))}
          placeholder="Ten years,"
        />
        <TextField
          label="Heading highlight"
          value={state.headingHighlight}
          onChange={(v) => setState((p) => ({ ...p, headingHighlight: v }))}
          placeholder="not ten months"
          helperText="Rendered in orange after the heading."
        />
        <TextAreaField
          label="Lead"
          value={state.lead}
          onChange={(v) => setState((p) => ({ ...p, lead: v }))}
        />
      </FieldGroup>
    </div>
  );
}
