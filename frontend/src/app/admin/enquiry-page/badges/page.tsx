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
import type { EnquiryBadge } from "@/types/enquiry-page-settings";

export default function BadgesSectionPage() {
  const { state, setState } = useSectionState("badges", (s) => ({
    eyebrow: s?.badges?.eyebrow ?? "",
    heading: s?.badges?.heading ?? "",
    headingHighlight: s?.badges?.headingHighlight ?? "",
    lead: s?.badges?.lead ?? "",
    items: s?.badges?.items ?? [],
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <SectionHeader
        title="Badges"
        description="Leave the list empty to keep the six badges shipped with the page."
      />

      <FieldGroup>
        <TextField
          label="Eyebrow"
          value={state.eyebrow}
          onChange={(v) => setState((p) => ({ ...p, eyebrow: v }))}
          placeholder="Badges"
        />
        <TextField
          label="Heading"
          value={state.heading}
          onChange={(v) => setState((p) => ({ ...p, heading: v }))}
          placeholder="The badges you"
        />
        <TextField
          label="Heading highlight"
          value={state.headingHighlight}
          onChange={(v) => setState((p) => ({ ...p, headingHighlight: v }))}
          placeholder="sit the exam for"
        />
        <TextAreaField
          label="Lead"
          value={state.lead}
          onChange={(v) => setState((p) => ({ ...p, lead: v }))}
        />
      </FieldGroup>

      <ItemListField<EnquiryBadge>
        label="Badges"
        description="Shown in one row on desktop. Six fits; more will wrap."
        items={state.items}
        onChange={(items) => setState((p) => ({ ...p, items }))}
        newItem={() => ({ name: "", issuer: "", level: "", src: "" })}
        addLabel="Add badge"
        itemTitle={(item, i) => item.name || `Badge ${i + 1}`}
        renderItem={(item, update) => (
          <div className="flex flex-col gap-3">
            <TextField
              label="Name"
              value={item.name ?? ""}
              onChange={(v) => update({ ...item, name: v })}
              placeholder="Excel"
            />
            <TextField
              label="Issuer"
              value={item.issuer ?? ""}
              onChange={(v) => update({ ...item, issuer: v })}
              placeholder="Microsoft"
            />
            <TextField
              label="Level"
              value={item.level ?? ""}
              onChange={(v) => update({ ...item, level: v })}
              helperText="Associate or Expert. Blank for badges with no tier."
            />
            <MediaField
              title="Badge artwork"
              description="Square art, around 208px. Upload or paste a URL."
              value={{ src: item.src }}
              onChange={(m) => update({ ...item, src: m.src })}
              folderName="enquiry-page/badges"
            />
          </div>
        )}
      />
    </div>
  );
}
