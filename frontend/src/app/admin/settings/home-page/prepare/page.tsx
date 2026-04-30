"use client";

import { useSectionState } from "../HomePageSettingsContext";
import {
  FieldGroup,
  ItemListField,
  SectionHeader,
  TextField,
} from "../components/fields";
import IconCardEditor from "../components/IconCardEditor";
import { findSectionIndex, HOME_PAGE_SECTIONS } from "../sections";
import { PREPARE_ITEM_ICONS } from "@/constants/homePageIcons";
import type {
  HomeIconTitleCard,
  HomePrepareSectionSettings,
} from "@/types/home-page-settings";

const idx = findSectionIndex("prepare");
const meta = HOME_PAGE_SECTIONS[idx];

const empty: HomePrepareSectionSettings = {
  eyebrow: "",
  headingPrefix: "",
  headingHighlight: "",
  items: [],
};

export default function PrepareSectionPage() {
  const { state, setState } = useSectionState("prepare", (s) => ({
    ...empty,
    ...(s?.prepare ?? {}),
  }));

  const update = (patch: Partial<HomePrepareSectionSettings>) =>
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
          placeholder="Get prepared"
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <TextField
            label="Heading prefix"
            value={state.headingPrefix ?? ""}
            onChange={(headingPrefix) => update({ headingPrefix })}
            placeholder="Everything you need to"
          />
          <TextField
            label="Heading highlight"
            value={state.headingHighlight ?? ""}
            onChange={(headingHighlight) => update({ headingHighlight })}
            placeholder="land your first job"
          />
        </div>
      </FieldGroup>

      <FieldGroup
        title="Prepare steps"
        description="Icon cards explaining each prep step."
      >
        <ItemListField<HomeIconTitleCard>
          items={state.items}
          onChange={(items) => update({ items })}
          newItem={() => ({
            title: "",
            description: "",
            icon: PREPARE_ITEM_ICONS[0].name,
          })}
          itemTitle={(it, i) => it.title || `Step ${i + 1}`}
          addLabel="Add step"
          renderItem={(item, set) => (
            <IconCardEditor
              card={item}
              onChange={set}
              icons={PREPARE_ITEM_ICONS}
            />
          )}
        />
      </FieldGroup>
    </div>
  );
}
