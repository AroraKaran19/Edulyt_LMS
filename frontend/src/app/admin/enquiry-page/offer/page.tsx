"use client";

import { useSectionState } from "../EnquirySettingsContext";
import {
  FieldGroup,
  SectionHeader,
  TextAreaField,
  TextField,
} from "@/app/admin/settings/home-page/components/fields";
import type { EnquiryOfferSettings } from "@/types/enquiry-page-settings";

export default function OfferSectionPage() {
  const { state, setState } = useSectionState("offer", (s) => ({
    enabled: s?.offer?.enabled ?? true,
    label: s?.offer?.label ?? "",
    headline: s?.offer?.headline ?? "",
    body: s?.offer?.body ?? "",
  }));

  const update = (patch: Partial<EnquiryOfferSettings>) =>
    setState((prev) => ({ ...prev, ...patch }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <SectionHeader
        title="Offer strip"
        description="The orange bar above the hero. Leave a field blank to keep the shipped wording."
      />

      <FieldGroup>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <input
            type="checkbox"
            checked={state.enabled}
            onChange={(e) => update({ enabled: e.target.checked })}
            className="size-4 accent-orange-500"
          />
          Show the strip
        </label>
        <TextField
          label="Label"
          value={state.label}
          onChange={(v) => update({ label: v })}
          placeholder="Admissions open"
        />
        <TextField
          label="Headline"
          value={state.headline}
          onChange={(v) => update({ headline: v })}
          helperText="Only claim a deadline that is real."
        />
        <TextAreaField
          label="Supporting line"
          value={state.body}
          onChange={(v) => update({ body: v })}
          helperText="Hidden below the md breakpoint to keep the bar one line."
        />
      </FieldGroup>
    </div>
  );
}
