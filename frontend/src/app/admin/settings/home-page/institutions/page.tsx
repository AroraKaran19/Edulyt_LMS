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
import { normalizeHomePageInstitute } from "@/lib/home-page/normalizeHomePageInstitute";
import type {
  HomeInstituteSpotlight,
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

const newSpotlight = (): HomeInstituteSpotlight => ({
  first_name: "",
  last_name: "",
  avatar: "",
});

const newInstitute = (): HomePageInstitute => ({
  image: "",
  name: "",
  line1: "Internship students",
  internship_student_count: 0,
  internship_spotlights: [],
  line2: "Course students",
  course_student_count: 0,
  course_spotlights: [],
});

export default function InstitutionsSectionPage() {
  const { state, setState } = useSectionState("institutions", (s) => ({
    ...empty,
    ...(s?.institutions ?? {}),
    institutes: (s?.institutions?.institutes ?? []).map(normalizeHomePageInstitute),
  }));

  const update = (patch: Partial<HomeInstitutionSectionSettings>) =>
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
        description="Each tile shows a logo, name, two stat rows, and optional student spotlights under each row. The public site lists the first two people, then +n for the rest."
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
              </div>
              <ItemListField<HomeInstituteSpotlight>
                label="Internship row — student spotlights"
                description="Add as many as you like; only the first two appear as full chips on the site, then +n."
                items={item.internship_spotlights ?? []}
                onChange={(internship_spotlights) =>
                  set({ ...item, internship_spotlights })
                }
                newItem={newSpotlight}
                addLabel="Add person"
                itemTitle={(p, i) => {
                  const n =
                    [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ||
                    `Person ${i + 1}`;
                  return n;
                }}
                renderItem={(spot, setSpot) => (
                  <>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <TextField
                        label="First name"
                        value={spot.first_name}
                        onChange={(first_name) => setSpot({ ...spot, first_name })}
                        placeholder="John"
                      />
                      <TextField
                        label="Last name"
                        value={spot.last_name}
                        onChange={(last_name) => setSpot({ ...spot, last_name })}
                        placeholder="Doe"
                      />
                    </div>
                    <ImageField
                      title="Photo"
                      imageSrc={spot.avatar ?? ""}
                      imageAlt={`${spot.first_name} ${spot.last_name}`}
                      onChange={({ imageSrc }) =>
                        setSpot({ ...spot, avatar: imageSrc ?? "" })
                      }
                      folderName="home-page/institute-spotlights"
                      showAltText={false}
                    />
                  </>
                )}
              />
              <div className="grid sm:grid-cols-2 gap-3">
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
              <ItemListField<HomeInstituteSpotlight>
                label="Course row — student spotlights"
                description="Same display rule: first two chips, then +n."
                items={item.course_spotlights ?? []}
                onChange={(course_spotlights) =>
                  set({ ...item, course_spotlights })
                }
                newItem={newSpotlight}
                addLabel="Add person"
                itemTitle={(p, i) => {
                  const n =
                    [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ||
                    `Person ${i + 1}`;
                  return n;
                }}
                renderItem={(spot, setSpot) => (
                  <>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <TextField
                        label="First name"
                        value={spot.first_name}
                        onChange={(first_name) => setSpot({ ...spot, first_name })}
                        placeholder="John"
                      />
                      <TextField
                        label="Last name"
                        value={spot.last_name}
                        onChange={(last_name) => setSpot({ ...spot, last_name })}
                        placeholder="Doe"
                      />
                    </div>
                    <ImageField
                      title="Photo"
                      imageSrc={spot.avatar ?? ""}
                      imageAlt={`${spot.first_name} ${spot.last_name}`}
                      onChange={({ imageSrc }) =>
                        setSpot({ ...spot, avatar: imageSrc ?? "" })
                      }
                      folderName="home-page/institute-spotlights"
                      showAltText={false}
                    />
                  </>
                )}
              />
            </>
          )}
        />
      </FieldGroup>
    </div>
  );
}
