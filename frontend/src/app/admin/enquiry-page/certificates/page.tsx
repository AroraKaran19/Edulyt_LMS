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
import type {
  EnquiryAvailability,
  EnquiryCertificate,
} from "@/types/enquiry-page-settings";

/** The summary above the list groups by these exact values, so it is a select. */
const AVAILABILITY: EnquiryAvailability[] = [
  "Every plan, on completion",
  "Plan 03, on completion",
  "Free on Plan 03, add-on elsewhere",
];

export default function CertificatesSectionPage() {
  const { state, setState } = useSectionState("certificates", (s) => ({
    eyebrow: s?.certificates?.eyebrow ?? "",
    heading: s?.certificates?.heading ?? "",
    headingHighlight: s?.certificates?.headingHighlight ?? "",
    lead: s?.certificates?.lead ?? "",
    items: s?.certificates?.items ?? [],
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <SectionHeader
        title="Certificates"
        description="Leave the list empty to keep the eight shipped with the page."
      />

      <FieldGroup>
        <TextField
          label="Eyebrow"
          value={state.eyebrow}
          onChange={(v) => setState((p) => ({ ...p, eyebrow: v }))}
          placeholder="Certificates"
        />
        <TextField
          label="Heading"
          value={state.heading}
          onChange={(v) => setState((p) => ({ ...p, heading: v }))}
          placeholder="The certificates and letters"
        />
        <TextField
          label="Heading highlight"
          value={state.headingHighlight}
          onChange={(v) => setState((p) => ({ ...p, headingHighlight: v }))}
          placeholder="you walk away with"
        />
        <TextAreaField
          label="Lead"
          value={state.lead}
          onChange={(v) => setState((p) => ({ ...p, lead: v }))}
        />
      </FieldGroup>

      <ItemListField<EnquiryCertificate>
        label="Certificates"
        description="Availability drives the three-column summary above the list, so pick it carefully."
        items={state.items}
        onChange={(items) => setState((p) => ({ ...p, items }))}
        newItem={() => ({
          title: "",
          issuer: "",
          blurb: "",
          src: "",
          availability: AVAILABILITY[0],
        })}
        addLabel="Add certificate"
        itemTitle={(item, i) => item.title || `Certificate ${i + 1}`}
        renderItem={(item, update) => (
          <div className="flex flex-col gap-3">
            <TextField
              label="Title"
              value={item.title ?? ""}
              onChange={(v) => update({ ...item, title: v })}
              placeholder="Internship offer letter"
            />
            <TextField
              label="Issuer"
              value={item.issuer ?? ""}
              onChange={(v) => update({ ...item, issuer: v })}
              placeholder="Airkrit India"
            />
            <TextAreaField
              label="Blurb"
              value={item.blurb ?? ""}
              onChange={(v) => update({ ...item, blurb: v })}
            />

            <div className="flex w-full flex-col gap-1.5">
              <label className="text-sm font-medium text-black">
                Availability
              </label>
              <select
                value={item.availability ?? AVAILABILITY[0]}
                onChange={(e) =>
                  update({
                    ...item,
                    availability: e.target.value as EnquiryAvailability,
                  })
                }
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              >
                {AVAILABILITY.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <MediaField
              title="Certificate image"
              value={{ src: item.src }}
              onChange={(m) => update({ ...item, src: m.src })}
              folderName="enquiry-page/certificates"
            />
          </div>
        )}
      />
    </div>
  );
}
