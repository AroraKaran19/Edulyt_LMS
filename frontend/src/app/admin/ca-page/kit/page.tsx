"use client";

import { useSectionState } from "../CaSettingsContext";
import {
  FieldGroup,
  SectionHeader,
  StringListField,
} from "@/app/admin/settings/home-page/components/fields";
import MediaField from "@/app/admin/enquiry-page/components/MediaField";

export default function KitSectionPage() {
  const { state, setState } = useSectionState("kit", (s) => ({
    photoUrl: s?.kit?.photoUrl ?? "",
    items: s?.kit?.items ?? [],
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <SectionHeader title="Joining kit" description="Kit photo and items." />

      <FieldGroup>
        <MediaField
          title="Kit photo"
          value={{ src: state.photoUrl }}
          onChange={(m) => setState((p) => ({ ...p, photoUrl: m.src ?? "" }))}
          folderName="ca-page/kit"
        />
        <StringListField
          label="Items"
          items={state.items}
          onChange={(items) => setState((p) => ({ ...p, items }))}
          placeholder="Welcome kit T-shirt"
          addLabel="Add item"
        />
      </FieldGroup>
    </div>
  );
}
