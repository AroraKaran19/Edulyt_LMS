"use client";

import { useSectionState } from "../CaSettingsContext";
import {
  FieldGroup,
  SectionHeader,
  TextField,
} from "@/app/admin/settings/home-page/components/fields";

export default function DocumentsSectionPage() {
  const { state, setState } = useSectionState("documents", (s) => ({
    designations: {
      marketing: s?.documents?.designations?.marketing ?? "",
      "social-media": s?.documents?.designations?.["social-media"] ?? "",
    },
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <SectionHeader
        title="Offer letter"
        description="The designation printed on each kind's offer letter."
      />

      <FieldGroup>
        <TextField
          label="Marketing intern designation"
          value={state.designations.marketing}
          onChange={(v) =>
            setState((p) => ({
              ...p,
              designations: { ...p.designations, marketing: v },
            }))
          }
          helperText="Printed on the offer letter. Leave empty to use Campus Ambassador (Marketing Intern) / (Social Media Marketing Intern)."
        />
        <TextField
          label="Social media marketing intern designation"
          value={state.designations["social-media"]}
          onChange={(v) =>
            setState((p) => ({
              ...p,
              designations: { ...p.designations, "social-media": v },
            }))
          }
        />
      </FieldGroup>
    </div>
  );
}
