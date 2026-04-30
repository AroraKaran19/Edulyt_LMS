"use client";

import { useSectionState } from "../HomePageSettingsContext";
import {
  FieldGroup,
  ItemListField,
  SectionHeader,
  TextAreaField,
  TextField,
} from "../components/fields";
import { findSectionIndex, HOME_PAGE_SECTIONS } from "../sections";
import type {
  HomeHeroComparisonRow,
  HomeHeroSettings,
  HomeHeroTopCard,
} from "@/types/home-page-settings";

const idx = findSectionIndex("hero");
const meta = HOME_PAGE_SECTIONS[idx];

const emptyHero: HomeHeroSettings = {
  topCards: [],
  comparisonHeadingHtml: "",
  comparisonRows: [],
  exploreOfferingsLabel: "",
  exploreOfferingsHref: "",
};

export default function HeroSectionPage() {
  const { state, setState } = useSectionState("hero", (s) => ({
    ...emptyHero,
    ...(s?.hero ?? {}),
  }));

  const update = (patch: Partial<HomeHeroSettings>) =>
    setState((prev) => ({ ...prev, ...patch }));

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">
      <SectionHeader
        title={meta.title}
        description={meta.description}
        index={idx}
        total={HOME_PAGE_SECTIONS.length}
      />

      <FieldGroup
        title="Top cards"
        description='The four "Who we are / What we do / …" cards above the comparison table.'
      >
        <ItemListField<HomeHeroTopCard>
          items={state.topCards}
          onChange={(topCards) => update({ topCards })}
          newItem={() => ({ title: "", description: "" })}
          itemTitle={(item, i) => item.title || `Card ${i + 1}`}
          addLabel="Add card"
          renderItem={(item, set) => (
            <>
              <TextField
                label="Title"
                value={item.title}
                onChange={(title) => set({ ...item, title })}
                placeholder="Who we are ?"
                required
              />
              <TextField
                label="Description"
                value={item.description}
                onChange={(description) => set({ ...item, description })}
                placeholder="Education to Employment Experts"
                required
              />
            </>
          )}
        />
      </FieldGroup>

      <FieldGroup
        title="Comparison table"
        description="Body rows of the Airkrit vs YouTube vs Others table. Header columns are fixed."
      >
        <TextAreaField
          label="Heading (HTML allowed)"
          value={state.comparisonHeadingHtml ?? ""}
          onChange={(comparisonHeadingHtml) =>
            update({ comparisonHeadingHtml })
          }
          placeholder='The <span class="text-orange-500">Difference</span> That Gets You Hired!'
          rows={3}
          helperText="Plain text or simple inline HTML for color highlights."
        />
        <ItemListField<HomeHeroComparisonRow>
          label="Rows"
          items={state.comparisonRows}
          onChange={(comparisonRows) => update({ comparisonRows })}
          newItem={() => ({
            feature: "",
            airkrit: "",
            youtube: "",
            others: "",
          })}
          itemTitle={(item, i) => item.feature || `Row ${i + 1}`}
          addLabel="Add row"
          renderItem={(item, set) => (
            <>
              <TextField
                label="Feature"
                value={item.feature}
                onChange={(v) => set({ ...item, feature: v })}
                placeholder="Project-based learning"
                required
              />
              <div className="grid sm:grid-cols-3 gap-3">
                <TextField
                  label="Airkrit cell"
                  value={item.airkrit}
                  onChange={(v) => set({ ...item, airkrit: v })}
                  placeholder='"check", "x" or text'
                  helperText='Use "check" for green tick, "x" for red cross, or any text.'
                />
                <TextField
                  label="YouTube cell"
                  value={item.youtube}
                  onChange={(v) => set({ ...item, youtube: v })}
                  placeholder="Mostly Theory"
                />
                <TextField
                  label="Others cell"
                  value={item.others}
                  onChange={(v) => set({ ...item, others: v })}
                  placeholder="Limited"
                />
              </div>
            </>
          )}
        />
      </FieldGroup>

      <FieldGroup title="Explore offerings CTA">
        <div className="grid sm:grid-cols-2 gap-3">
          <TextField
            label="Button label"
            value={state.exploreOfferingsLabel ?? ""}
            onChange={(exploreOfferingsLabel) =>
              update({ exploreOfferingsLabel })
            }
            placeholder="Explore Offerings"
          />
          <TextField
            label="Button link"
            value={state.exploreOfferingsHref ?? ""}
            onChange={(exploreOfferingsHref) =>
              update({ exploreOfferingsHref })
            }
            placeholder="/courses"
          />
        </div>
      </FieldGroup>
    </div>
  );
}
