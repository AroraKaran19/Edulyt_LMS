"use client";

import { useSectionState } from "../HomePageSettingsContext";
import {
  FieldGroup,
  ItemListField,
  SectionHeader,
  TextAreaField,
  TextField,
} from "../components/fields";
import ImageField from "../components/ImageField";
import { findSectionIndex, HOME_PAGE_SECTIONS } from "../sections";
import type {
  HomeInstitutionSectionSettings,
  HomePageInstitute,
} from "@/types/home-page-settings";

const idx = findSectionIndex("institutions");
const meta = HOME_PAGE_SECTIONS[idx];

const empty: HomeInstitutionSectionSettings = {
  eyebrow: "",
  headingHighlight: "",
  headingRest: "",
  body: "",
  institutes: [],
};

const newInstitute = (): HomePageInstitute => ({
  image: "",
  name: "",
  line1: "Internship students",
  internship_student_count: 0,
  line2: "Course students",
  course_student_count: 0,
});

export default function InstitutionsSectionPage() {
  const { state, setState } = useSectionState("institutions", (s) => ({
    ...empty,
    ...(s?.institutions ?? {}),
  }));

  const update = (patch: Partial<HomeInstitutionSectionSettings>) =>
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
          placeholder="Trusted by Top Colleges"
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <TextField
            label="Heading highlight"
            value={state.headingHighlight ?? ""}
            onChange={(headingHighlight) => update({ headingHighlight })}
            placeholder="Powering Careers"
          />
          <TextField
            label="Heading rest"
            value={state.headingRest ?? ""}
            onChange={(headingRest) => update({ headingRest })}
            placeholder="across India"
          />
        </div>
        <TextAreaField
          label="Body"
          value={state.body ?? ""}
          onChange={(body) => update({ body })}
          placeholder="A short paragraph below the heading."
          rows={3}
        />
      </FieldGroup>

      <FieldGroup
        title="Partner institutes"
        description="Each tile shows a logo, name and two student-count rows."
      >
        <ItemListField<HomePageInstitute>
          items={state.institutes}
          onChange={(institutes) => update({ institutes })}
          newItem={newInstitute}
          itemTitle={(it, i) => it.name || `Institute ${i + 1}`}
          addLabel="Add institute"
          renderItem={(item, set) => (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <TextField
                  label="Name"
                  value={item.name}
                  onChange={(name) => set({ ...item, name })}
                  placeholder="IIT Delhi"
                  required
                />
              </div>
              <ImageField
                title="Logo"
                imageSrc={item.image}
                imageAlt={item.name}
                onChange={({ imageSrc }) =>
                  set({ ...item, image: imageSrc ?? "" })
                }
                folderName="home-page/institutes"
                showAltText={false}
              />
              <div className="grid sm:grid-cols-2 gap-3">
                <TextField
                  label="Line 1 label"
                  value={item.line1}
                  onChange={(line1) => set({ ...item, line1 })}
                  placeholder="Internship students"
                />
                <TextField
                  label="Line 1 count"
                  type="number"
                  min={0}
                  value={String(item.internship_student_count)}
                  onChange={(v) =>
                    set({
                      ...item,
                      internship_student_count: Number(v) || 0,
                    })
                  }
                  placeholder="0"
                />
                <TextField
                  label="Line 2 label"
                  value={item.line2}
                  onChange={(line2) => set({ ...item, line2 })}
                  placeholder="Course students"
                />
                <TextField
                  label="Line 2 count"
                  type="number"
                  min={0}
                  value={String(item.course_student_count)}
                  onChange={(v) =>
                    set({
                      ...item,
                      course_student_count: Number(v) || 0,
                    })
                  }
                  placeholder="0"
                />
              </div>
            </>
          )}
        />
      </FieldGroup>
    </div>
  );
}
