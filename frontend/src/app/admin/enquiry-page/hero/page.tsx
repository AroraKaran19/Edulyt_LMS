"use client";

import { useSectionState } from "../EnquirySettingsContext";
import {
  FieldGroup,
  ItemListField,
  SectionHeader,
  StringListField,
  TextField,
} from "@/app/admin/settings/home-page/components/fields";
import Editor from "@/components/shared/Editor/Editor";
import MediaField from "../components/MediaField";
import type {
  EnquiryCta,
  EnquiryPartnerLogo,
} from "@/types/enquiry-page-settings";

function CtaFields({
  title,
  value,
  onChange,
}: {
  title: string;
  value: EnquiryCta;
  onChange: (next: EnquiryCta) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-black">{title}</h3>
      <TextField
        label="Button text"
        value={value.label ?? ""}
        onChange={(v) => onChange({ ...value, label: v })}
        placeholder="Download the brochure"
      />
      <MediaField
        title="Where it opens"
        description="Upload a document, or switch to Add URL to point anywhere."
        type="document"
        value={{ src: value.href, source: value.source, s3Key: value.s3Key }}
        onChange={(m) =>
          onChange({ ...value, href: m.src, source: m.source, s3Key: m.s3Key })
        }
        folderName="enquiry-page/cta"
      />
      <p className="text-xs text-stone-500">
        With nothing set the button still shows but does nothing, so it cannot
        send anyone to a dead link.
      </p>
    </div>
  );
}

export default function HeroSectionPage() {
  const { state, setState, isLoading } = useSectionState("hero", (s) => ({
    eyebrow: s?.hero?.eyebrow ?? "",
    headingLine1: s?.hero?.headingLine1 ?? "",
    headingLine2: s?.hero?.headingLine2 ?? "",
    introHtml: s?.hero?.introHtml ?? "",
    primaryCta: s?.hero?.primaryCta ?? {},
    secondaryCta: s?.hero?.secondaryCta ?? {},
    ratingScore: s?.hero?.ratingScore ?? 0,
    ratingCount: s?.hero?.ratingCount ?? 0,
    ratingSource: s?.hero?.ratingSource ?? "",
    ratingLabel: s?.hero?.ratingLabel ?? "",
    ratingHref: s?.hero?.ratingHref ?? "",
    partnersHeading: s?.hero?.partnersHeading ?? "",
    partners: s?.hero?.partners ?? [],
    marquee: s?.hero?.marquee ?? [],
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <SectionHeader
        title="Hero"
        description="Everything above the fold, plus the scrolling strip under it."
      />

      <FieldGroup>
        <TextField
          label="Eyebrow"
          value={state.eyebrow}
          onChange={(v) => setState((p) => ({ ...p, eyebrow: v }))}
          placeholder="Career Acceleration Program"
        />
        <TextField
          label="Heading line 1"
          value={state.headingLine1}
          onChange={(v) => setState((p) => ({ ...p, headingLine1: v }))}
          placeholder="Don't just learn."
        />
        <TextField
          label="Heading line 2"
          value={state.headingLine2}
          onChange={(v) => setState((p) => ({ ...p, headingLine2: v }))}
          helperText="Rendered in orange on its own line."
        />
      </FieldGroup>

      <div className="flex w-full flex-col gap-1.5">
        <label className="text-sm font-medium text-black">
          Intro paragraph
        </label>
        <Editor
          /* Uncontrolled: it seeds from `initialHtml` once, so it has to be
             remounted when the saved settings finish loading. */
          key={isLoading ? "loading" : "ready"}
          initialHtml={state.introHtml}
          onChange={(html) => setState((p) => ({ ...p, introHtml: html }))}
        />
        <p className="text-xs text-stone-500">
          Bold the partner names. Leave empty to keep the shipped paragraph.
        </p>
      </div>

      <CtaFields
        title="Primary button"
        value={state.primaryCta}
        onChange={(v) => setState((p) => ({ ...p, primaryCta: v }))}
      />
      <CtaFields
        title="Secondary button"
        value={state.secondaryCta}
        onChange={(v) => setState((p) => ({ ...p, secondaryCta: v }))}
      />

      <FieldGroup>
        <TextField
          label="Rating label"
          value={state.ratingLabel}
          onChange={(v) => setState((p) => ({ ...p, ratingLabel: v }))}
          placeholder="Trusted learners"
        />
        <TextField
          label="Rating score"
          type="number"
          step="0.1"
          min={0}
          value={String(state.ratingScore || "")}
          onChange={(v) => setState((p) => ({ ...p, ratingScore: Number(v) }))}
          helperText="Only publish the score your Google listing actually shows."
        />
        <TextField
          label="Review count"
          type="number"
          min={0}
          value={String(state.ratingCount || "")}
          onChange={(v) => setState((p) => ({ ...p, ratingCount: Number(v) }))}
        />
        <TextField
          label="Rating source"
          value={state.ratingSource}
          onChange={(v) => setState((p) => ({ ...p, ratingSource: v }))}
          placeholder="Google reviews"
          helperText="Read out to screen readers, not shown."
        />
        <TextField
          label="Rating link"
          value={state.ratingHref}
          onChange={(v) => setState((p) => ({ ...p, ratingHref: v }))}
          placeholder="https://share.google/..."
          helperText="Where the badge opens so a student can check the score."
        />
      </FieldGroup>

      <FieldGroup>
        <TextField
          label="Partners heading"
          value={state.partnersHeading}
          onChange={(v) => setState((p) => ({ ...p, partnersHeading: v }))}
          placeholder="Certification partners (CATC)"
        />
      </FieldGroup>

      <ItemListField<EnquiryPartnerLogo>
        label="Partner logos"
        description="Four fit the row. Height tunes each mark so they carry equal weight."
        items={state.partners}
        onChange={(partners) => setState((p) => ({ ...p, partners }))}
        newItem={() => ({ name: "", src: "", height: 24, ratio: 1 })}
        addLabel="Add partner"
        itemTitle={(item, i) => item.name || `Partner ${i + 1}`}
        renderItem={(item, update) => (
          <div className="flex flex-col gap-3">
            <TextField
              label="Name"
              value={item.name ?? ""}
              onChange={(v) => update({ ...item, name: v })}
              placeholder="Microsoft"
            />
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Height (px)"
                type="number"
                min={8}
                value={String(item.height ?? 24)}
                onChange={(v) => update({ ...item, height: Number(v) })}
              />
              <TextField
                label="Width / height ratio"
                type="number"
                step="0.01"
                min={0.1}
                value={String(item.ratio ?? 1)}
                onChange={(v) => update({ ...item, ratio: Number(v) })}
                helperText="A 256x171 logo is 1.5."
              />
            </div>
            <MediaField
              title="Logo"
              value={{ src: item.src }}
              onChange={(m) => update({ ...item, src: m.src })}
              folderName="enquiry-page/partners"
            />
          </div>
        )}
      />

      <StringListField
        label="Scrolling strip"
        description="The marquee under the hero. Keep each item short."
        items={state.marquee}
        onChange={(marquee) => setState((p) => ({ ...p, marquee }))}
        placeholder="15+ hrs live mentorship"
      />
    </div>
  );
}
