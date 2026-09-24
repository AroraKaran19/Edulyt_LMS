"use client";

import { useSectionState } from "../CaSettingsContext";
import {
  FieldGroup,
  SectionHeader,
  StringListField,
  TextAreaField,
  TextField,
} from "@/app/admin/settings/home-page/components/fields";
import MediaField from "@/app/admin/enquiry-page/components/MediaField";
import { DEFAULT_SEO } from "@/app/digital-marketing-internship/content";

const count = (value: string, ideal: number) => `${value.length}/${ideal} characters. Leave empty to keep the default.`;

export default function SeoSectionPage() {
  const { state, setState } = useSectionState("seo", (s) => ({
    title: s?.seo?.title ?? "",
    description: s?.seo?.description ?? "",
    keywords: s?.seo?.keywords ?? [],
    ogTitle: s?.seo?.ogTitle ?? "",
    ogDescription: s?.seo?.ogDescription ?? "",
    ogImage: s?.seo?.ogImage ?? "",
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <SectionHeader
        title="SEO"
        description="Search title, description, keywords and the link preview when the page is shared."
      />

      <FieldGroup title="Search results">
        <TextField
          label="Meta title"
          value={state.title}
          onChange={(v) => setState((p) => ({ ...p, title: v }))}
          placeholder={DEFAULT_SEO.title}
          helperText={count(state.title, 60)}
        />
        <TextAreaField
          label="Meta description"
          value={state.description}
          onChange={(v) => setState((p) => ({ ...p, description: v }))}
          placeholder={DEFAULT_SEO.description}
          helperText={count(state.description, 160)}
        />
        <StringListField
          label="Keywords"
          items={state.keywords}
          onChange={(keywords) => setState((p) => ({ ...p, keywords }))}
          placeholder="digital marketing internship"
          addLabel="Add keyword"
        />
      </FieldGroup>

      <FieldGroup
        title="Link preview"
        description="Shown on WhatsApp, LinkedIn and other apps. Empty fields reuse the meta title and description."
      >
        <TextField
          label="Share title"
          value={state.ogTitle}
          onChange={(v) => setState((p) => ({ ...p, ogTitle: v }))}
          placeholder={state.title || DEFAULT_SEO.ogTitle}
        />
        <TextAreaField
          label="Share description"
          value={state.ogDescription}
          onChange={(v) => setState((p) => ({ ...p, ogDescription: v }))}
          placeholder={state.description || DEFAULT_SEO.ogDescription}
        />
        <MediaField
          title="Share image"
          description="1200 × 630 works best."
          value={{ src: state.ogImage }}
          onChange={(m) => setState((p) => ({ ...p, ogImage: m.src ?? "" }))}
          folderName="ca-page/seo"
        />
      </FieldGroup>
    </div>
  );
}
