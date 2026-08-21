"use client";

import { useSectionState } from "../EnquirySettingsContext";
import {
  FieldGroup,
  ItemListField,
  SectionHeader,
  TextAreaField,
  TextField,
} from "@/app/admin/settings/home-page/components/fields";
import type { EnquiryLanguage } from "@/types/enquiry-page-settings";

export default function LanguagesSectionPage() {
  const { state, setState } = useSectionState("languages", (s) => ({
    heading: s?.languages?.heading ?? "",
    headingHighlight: s?.languages?.headingHighlight ?? "",
    lead: s?.languages?.lead ?? "",
    items: s?.languages?.items ?? [],
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <SectionHeader
        title="Languages"
        description="Only claim languages courses are actually delivered in."
      />

      <FieldGroup>
        <TextField
          label="Heading"
          value={state.heading}
          onChange={(v) => setState((p) => ({ ...p, heading: v }))}
          placeholder="Learn in the language"
        />
        <TextField
          label="Heading highlight"
          value={state.headingHighlight}
          onChange={(v) => setState((p) => ({ ...p, headingHighlight: v }))}
          placeholder="you think in"
        />
        <TextAreaField
          label="Lead"
          value={state.lead}
          onChange={(v) => setState((p) => ({ ...p, lead: v }))}
        />
      </FieldGroup>

      <ItemListField<EnquiryLanguage>
        label="Languages"
        description="The native script is what shows; the label and code are not rendered."
        items={state.items}
        onChange={(items) => setState((p) => ({ ...p, items }))}
        newItem={() => ({ label: "", native: "", code: "" })}
        addLabel="Add language"
        itemTitle={(item, i) => item.label || `Language ${i + 1}`}
        renderItem={(item, update) => (
          <div className="flex flex-col gap-3">
            <TextField
              label="English name"
              value={item.label ?? ""}
              onChange={(v) => update({ ...item, label: v })}
              placeholder="Tamil"
            />
            <TextField
              label="Native script"
              value={item.native ?? ""}
              onChange={(v) => update({ ...item, native: v })}
              placeholder="&#2980;&#2990;&#3007;&#2996;&#3021;"
              helperText="Shown at display size on the page."
            />
            <TextField
              label="Language code"
              value={item.code ?? ""}
              onChange={(v) => update({ ...item, code: v })}
              placeholder="ta"
              helperText="BCP-47, e.g. ta, mr, te, kn. Screen readers use it to pronounce the script."
            />
          </div>
        )}
      />
    </div>
  );
}
