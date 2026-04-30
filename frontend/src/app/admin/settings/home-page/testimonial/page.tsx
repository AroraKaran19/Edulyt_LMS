"use client";

import { useSectionState } from "../HomePageSettingsContext";
import EntityMultiSelect from "../components/EntityMultiSelect";
import { FieldGroup, SectionHeader, TextField } from "../components/fields";
import { findSectionIndex, HOME_PAGE_SECTIONS } from "../sections";
import type {
  HomeTestimonialSectionSettings,
} from "@/types/home-page-settings";
import type { Testimonial } from "@/types/course";

const idx = findSectionIndex("testimonial");
const meta = HOME_PAGE_SECTIONS[idx];

const empty: HomeTestimonialSectionSettings = {
  eyebrow: "",
  headingLine1: "",
  headingHighlight1: "",
  headingLine2: "",
  headingHighlight2: "",
  testimonials: [],
};

export default function TestimonialSectionPage() {
  const { state, setState } = useSectionState("testimonial", (s) => ({
    ...empty,
    ...(s?.testimonial ?? {}),
  }));

  const update = (patch: Partial<HomeTestimonialSectionSettings>) =>
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
          label="Eyebrow"
          value={state.eyebrow ?? ""}
          onChange={(eyebrow) => update({ eyebrow })}
          placeholder="What our students say"
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <TextField
            label="Heading line 1"
            value={state.headingLine1 ?? ""}
            onChange={(headingLine1) => update({ headingLine1 })}
            placeholder="Real Stories From"
          />
          <TextField
            label="Highlight 1"
            value={state.headingHighlight1 ?? ""}
            onChange={(headingHighlight1) => update({ headingHighlight1 })}
            placeholder="Real Learners"
          />
          <TextField
            label="Heading line 2"
            value={state.headingLine2 ?? ""}
            onChange={(headingLine2) => update({ headingLine2 })}
            placeholder="Who landed jobs at"
          />
          <TextField
            label="Highlight 2"
            value={state.headingHighlight2 ?? ""}
            onChange={(headingHighlight2) => update({ headingHighlight2 })}
            placeholder="Top Companies"
          />
        </div>
      </FieldGroup>

      <FieldGroup
        title="Featured testimonials"
        description="Pick from existing testimonials. Order here is the display order."
      >
        <EntityMultiSelect
          type="testimonial"
          value={state.testimonials as Testimonial[]}
          onChange={(testimonials) =>
            update({ testimonials: testimonials as Testimonial[] })
          }
          emptyText="No testimonials selected yet."
        />
      </FieldGroup>
    </div>
  );
}
