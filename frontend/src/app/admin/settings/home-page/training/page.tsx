"use client";

import { useSectionState } from "../HomePageSettingsContext";
import {
  FieldGroup,
  ItemListField,
  SectionHeader,
  TextField,
} from "../components/fields";
import IconCardEditor from "../components/IconCardEditor";
import ImageField from "../components/ImageField";
import { findSectionIndex, HOME_PAGE_SECTIONS } from "../sections";
import { TRAINING_PILLAR_ICONS } from "@/constants/homePageIcons";
import type {
  HomeIconTitleCard,
  HomeTrainingSectionSettings,
} from "@/types/home-page-settings";

const idx = findSectionIndex("training");
const meta = HOME_PAGE_SECTIONS[idx];

const empty: HomeTrainingSectionSettings = {
  eyebrow: "",
  headingLine1: "",
  headingHighlight1: "",
  headingLine2: "",
  headingHighlight2: "",
  pillars: [],
  imageSrc: "",
  imageAlt: "",
};

export default function TrainingSectionPage() {
  const { state, setState } = useSectionState("training", (s) => ({
    ...empty,
    ...(s?.training ?? {}),
  }));

  const update = (patch: Partial<HomeTrainingSectionSettings>) =>
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
          placeholder="How we train"
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <TextField
            label="Heading line 1"
            value={state.headingLine1 ?? ""}
            onChange={(headingLine1) => update({ headingLine1 })}
            placeholder="Learn the way"
          />
          <TextField
            label="Highlight 1"
            value={state.headingHighlight1 ?? ""}
            onChange={(headingHighlight1) => update({ headingHighlight1 })}
            placeholder="industries work"
          />
          <TextField
            label="Heading line 2"
            value={state.headingLine2 ?? ""}
            onChange={(headingLine2) => update({ headingLine2 })}
            placeholder="Built on"
          />
          <TextField
            label="Highlight 2"
            value={state.headingHighlight2 ?? ""}
            onChange={(headingHighlight2) => update({ headingHighlight2 })}
            placeholder="four pillars"
          />
        </div>
      </FieldGroup>

      <FieldGroup title="Side image">
        <ImageField
          title="Training section image"
          imageSrc={state.imageSrc}
          imageAlt={state.imageAlt}
          onChange={({ imageSrc, imageAlt }) =>
            update({ imageSrc, imageAlt })
          }
          folderName="home-page/training"
        />
      </FieldGroup>

      <FieldGroup
        title="Pillars"
        description="Icon cards. Pick from the curated icon set; add more in `homePageIcons.ts`."
      >
        <ItemListField<HomeIconTitleCard>
          items={state.pillars}
          onChange={(pillars) => update({ pillars })}
          newItem={() => ({
            title: "",
            description: "",
            icon: TRAINING_PILLAR_ICONS[0].name,
          })}
          itemTitle={(it, i) => it.title || `Pillar ${i + 1}`}
          addLabel="Add pillar"
          renderItem={(item, set) => (
            <IconCardEditor
              card={item}
              onChange={set}
              icons={TRAINING_PILLAR_ICONS}
            />
          )}
        />
      </FieldGroup>
    </div>
  );
}
