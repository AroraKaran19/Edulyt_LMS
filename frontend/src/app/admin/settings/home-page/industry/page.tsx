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
import type { HomeIndustrySectionSettings } from "@/types/home-page-settings";

const idx = findSectionIndex("industry");
const meta = HOME_PAGE_SECTIONS[idx];

const empty: HomeIndustrySectionSettings = {
  headingPrimary: "",
  headingSecondary: "",
  helpIntroText: "",
  expertHelpBullets: [],
  bookConsultationLabel: "",
  bookConsultationHref: "",
  imageSrc: "",
  imageAlt: "",
};

export default function IndustrySectionPage() {
  const { state, setState } = useSectionState("industry", (s) => ({
    ...empty,
    ...(s?.industry ?? {}),
  }));

  const update = (patch: Partial<HomeIndustrySectionSettings>) =>
    setState((prev) => ({ ...prev, ...patch }));

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">
      <SectionHeader
        title={meta.title}
        description={meta.description}
        index={idx}
        total={HOME_PAGE_SECTIONS.length}
      />

      <FieldGroup title="Heading">
        <TextField
          label="Primary heading"
          value={state.headingPrimary ?? ""}
          onChange={(headingPrimary) => update({ headingPrimary })}
          placeholder="Get Industry-Standard"
        />
        <TextField
          label="Secondary heading"
          value={state.headingSecondary ?? ""}
          onChange={(headingSecondary) => update({ headingSecondary })}
          placeholder="Career Help"
        />
        <TextField
          label="Help intro text"
          value={state.helpIntroText ?? ""}
          onChange={(helpIntroText) => update({ helpIntroText })}
          placeholder="Our experts can help you with:"
        />
      </FieldGroup>

      <FieldGroup
        title="Expert help bullets"
        description="Short bullet items shown next to the side image."
      >
        <StringListField
          items={state.expertHelpBullets}
          onChange={(expertHelpBullets) => update({ expertHelpBullets })}
          placeholder="Resume review by industry mentors"
          addLabel="Add bullet"
        />
      </FieldGroup>

      <FieldGroup title="Book consultation CTA">
        <div className="grid sm:grid-cols-2 gap-3">
          <TextField
            label="Button label"
            value={state.bookConsultationLabel ?? ""}
            onChange={(bookConsultationLabel) =>
              update({ bookConsultationLabel })
            }
            placeholder="Book a free consultation"
          />
          <TextField
            label="Button link"
            value={state.bookConsultationHref ?? ""}
            onChange={(bookConsultationHref) =>
              update({ bookConsultationHref })
            }
            placeholder="/contact"
          />
        </div>
      </FieldGroup>

      <FieldGroup title="Side image">
        <ImageField
          title="Industry section image"
          imageSrc={state.imageSrc}
          imageAlt={state.imageAlt}
          onChange={({ imageSrc, imageAlt }) =>
            update({ imageSrc, imageAlt })
          }
          folderName="home-page/industry"
        />
      </FieldGroup>
    </div>
  );
}
