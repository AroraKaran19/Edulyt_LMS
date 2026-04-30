"use client";

import { useSectionState } from "../HomePageSettingsContext";
import {
  FieldGroup,
  SectionHeader,
  StringListField,
  TextField,
} from "../components/fields";
import ImageField from "../components/ImageField";
import { findSectionIndex, HOME_PAGE_SECTIONS } from "../sections";
import type { HomeDreamJobSectionSettings } from "@/types/home-page-settings";

const idx = findSectionIndex("dream-job");
const meta = HOME_PAGE_SECTIONS[idx];

const empty: HomeDreamJobSectionSettings = {
  eyebrow: "",
  headingLine1: "",
  headingHighlightLearn: "",
  headingHighlightPlacement: "",
  bullets: [],
  getStartedLabel: "",
  getStartedHref: "",
  imageSrc: "",
  imageAlt: "",
};

export default function DreamJobSectionPage() {
  const { state, setState } = useSectionState("dreamJob", (s) => ({
    ...empty,
    ...(s?.dreamJob ?? {}),
  }));

  const update = (patch: Partial<HomeDreamJobSectionSettings>) =>
    setState((prev) => ({ ...prev, ...patch }));

  return (
    <div className="w-full mx-auto flex flex-col gap-5">
      <SectionHeader
        title={meta.title}
        description={meta.description}
        index={idx}
        total={HOME_PAGE_SECTIONS.length}
      />

      <FieldGroup title="Heading">
        <TextField
          label="Eyebrow"
          value={state.eyebrow ?? ""}
          onChange={(eyebrow) => update({ eyebrow })}
          placeholder="Land your dream job"
        />
        <TextField
          label="Heading line 1"
          value={state.headingLine1 ?? ""}
          onChange={(headingLine1) => update({ headingLine1 })}
          placeholder="From"
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <TextField
            label="Highlight — Learn"
            value={state.headingHighlightLearn ?? ""}
            onChange={(headingHighlightLearn) =>
              update({ headingHighlightLearn })
            }
            placeholder="learning"
          />
          <TextField
            label="Highlight — Placement"
            value={state.headingHighlightPlacement ?? ""}
            onChange={(headingHighlightPlacement) =>
              update({ headingHighlightPlacement })
            }
            placeholder="placement"
          />
        </div>
      </FieldGroup>

      <FieldGroup title="Bullets">
        <StringListField
          items={state.bullets}
          onChange={(bullets) => update({ bullets })}
          placeholder="Resume reviews by hiring managers"
          addLabel="Add bullet"
        />
      </FieldGroup>

      <FieldGroup title="Get started CTA">
        <div className="grid sm:grid-cols-2 gap-3">
          <TextField
            label="Button label"
            value={state.getStartedLabel ?? ""}
            onChange={(getStartedLabel) => update({ getStartedLabel })}
            placeholder="Get Started"
          />
          <TextField
            label="Button link"
            value={state.getStartedHref ?? ""}
            onChange={(getStartedHref) => update({ getStartedHref })}
            placeholder="/auth/register"
          />
        </div>
      </FieldGroup>

      <FieldGroup title="Side image">
        <ImageField
          title="Dream job image"
          imageSrc={state.imageSrc}
          imageAlt={state.imageAlt}
          onChange={({ imageSrc, imageAlt }) =>
            update({ imageSrc, imageAlt })
          }
          folderName="home-page/dream-job"
        />
      </FieldGroup>
    </div>
  );
}
