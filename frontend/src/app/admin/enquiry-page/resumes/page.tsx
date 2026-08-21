"use client";

import { useSectionState } from "../EnquirySettingsContext";
import {
  FieldGroup,
  ItemListField,
  SectionHeader,
  TextAreaField,
  TextField,
} from "@/app/admin/settings/home-page/components/fields";
import MediaField from "../components/MediaField";
import type { EnquiryResume } from "@/types/enquiry-page-settings";

export default function ResumesSectionPage() {
  const { state, setState } = useSectionState("resumes", (s) => ({
    eyebrow: s?.resumes?.eyebrow ?? "",
    heading: s?.resumes?.heading ?? "",
    headingHighlight: s?.resumes?.headingHighlight ?? "",
    lead: s?.resumes?.lead ?? "",
    items: s?.resumes?.items ?? [],
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <SectionHeader
        title="CV samples"
        description="Leave the list empty to keep the four samples shipped with the page."
      />

      <FieldGroup>
        <TextField
          label="Eyebrow"
          value={state.eyebrow}
          onChange={(v) => setState((p) => ({ ...p, eyebrow: v }))}
          placeholder="On your CV"
        />
        <TextField
          label="Heading"
          value={state.heading}
          onChange={(v) => setState((p) => ({ ...p, heading: v }))}
          placeholder="This is how you"
        />
        <TextField
          label="Heading highlight"
          value={state.headingHighlight}
          onChange={(v) => setState((p) => ({ ...p, headingHighlight: v }))}
          placeholder="carry them"
        />
        <TextAreaField
          label="Lead"
          value={state.lead}
          onChange={(v) => setState((p) => ({ ...p, lead: v }))}
        />
      </FieldGroup>

      <ItemListField<EnquiryResume>
        label="Samples"
        description="Use mock details. These render on a public page."
        items={state.items}
        onChange={(items) => setState((p) => ({ ...p, items }))}
        newItem={() => ({ partner: "", credential: "", src: "" })}
        addLabel="Add sample"
        itemTitle={(item, i) => item.partner || `Sample ${i + 1}`}
        renderItem={(item, update) => (
          <div className="flex flex-col gap-3">
            <TextField
              label="Partner"
              value={item.partner ?? ""}
              onChange={(v) => update({ ...item, partner: v })}
              placeholder="Meta"
            />
            <TextField
              label="Credential"
              value={item.credential ?? ""}
              onChange={(v) => update({ ...item, credential: v })}
              placeholder="Digital Marketing Associate"
            />
            <MediaField
              title="CV image"
              description="Around 1000px wide. Cropped to the top of the page."
              value={{ src: item.src }}
              onChange={(m) => update({ ...item, src: m.src })}
              folderName="enquiry-page/resumes"
            />
          </div>
        )}
      />
    </div>
  );
}
