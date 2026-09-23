"use client";

import { useSectionState } from "../CaSettingsContext";
import {
  FieldGroup,
  SectionHeader,
  TextAreaField,
  TextField,
} from "@/app/admin/settings/home-page/components/fields";
import MediaField from "@/app/admin/enquiry-page/components/MediaField";

export default function HeroSectionPage() {
  const { state, setState } = useSectionState("hero", (s) => ({
    headline: s?.hero?.headline ?? "",
    lede: s?.hero?.lede ?? "",
    jdUrl: s?.hero?.jdUrl ?? "",
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <SectionHeader
        title="Hero"
        description="Headline, intro and the job description file."
      />

      <FieldGroup>
        <TextField
          label="Headline"
          value={state.headline}
          onChange={(v) => setState((p) => ({ ...p, headline: v }))}
          helperText="Leave empty to keep the shipped headline."
        />
        <TextAreaField
          label="Intro"
          value={state.lede}
          onChange={(v) => setState((p) => ({ ...p, lede: v }))}
        />
      </FieldGroup>

      <FieldGroup>
        <MediaField
          title="Job description"
          description="Upload a document, or switch to Add URL to point anywhere."
          type="document"
          value={{ src: state.jdUrl }}
          onChange={(m) => setState((p) => ({ ...p, jdUrl: m.src ?? "" }))}
          folderName="ca-page/jd"
        />
      </FieldGroup>
    </div>
  );
}
