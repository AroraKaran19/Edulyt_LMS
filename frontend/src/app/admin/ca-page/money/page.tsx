"use client";

import { useSectionState } from "../CaSettingsContext";
import {
  FieldGroup,
  SectionHeader,
  TextField,
} from "@/app/admin/settings/home-page/components/fields";
import { DEFAULT_MONEY, inr } from "@/app/digital-marketing-internship/content";
import type { CaMoney } from "@/types/ca-page-settings";

const MONEY_ROWS: ReadonlyArray<{
  key: keyof CaMoney;
  label: string;
  step?: string;
  helperText: string;
}> = [
  { key: "stipend", label: "Monthly stipend", helperText: `Leave empty for the default of ${inr(DEFAULT_MONEY.stipend)}` },
  { key: "incentiveCap", label: "Incentive cap", helperText: `Leave empty for the default of ${inr(DEFAULT_MONEY.incentiveCap)}` },
  { key: "joiningBonus", label: "Joining bonus", helperText: `Leave empty for the default of ${inr(DEFAULT_MONEY.joiningBonus)}` },
  { key: "kitValue", label: "Kit value", helperText: `Leave empty for the default of ${inr(DEFAULT_MONEY.kitValue)}` },
  { key: "lmsValue", label: "LMS access value", helperText: `Leave empty for the default of ${inr(DEFAULT_MONEY.lmsValue)}` },
  {
    key: "ppoPackageLpa",
    label: "PPO package (LPA)",
    step: "0.1",
    helperText: `Leave empty for the default of ${DEFAULT_MONEY.ppoPackageLpa} LPA`,
  },
];

export default function MoneySectionPage() {
  const { state, setState } = useSectionState("money", (s) => ({
    stipend: s?.money?.stipend ?? null,
    incentiveCap: s?.money?.incentiveCap ?? null,
    joiningBonus: s?.money?.joiningBonus ?? null,
    kitValue: s?.money?.kitValue ?? null,
    lmsValue: s?.money?.lmsValue ?? null,
    ppoPackageLpa: s?.money?.ppoPackageLpa ?? null,
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <SectionHeader
        title="Amounts"
        description="Stipend, incentives, bonus, kit, LMS and PPO figures used across the page."
      />

      <FieldGroup>
        {MONEY_ROWS.map((row) => (
          <TextField
            key={row.key}
            label={row.label}
            type="number"
            min={0}
            step={row.step}
            value={state[row.key] == null ? "" : String(state[row.key])}
            onChange={(v) =>
              setState((p) => ({
                ...p,
                [row.key]: v === "" ? null : Number(v),
              }))
            }
            helperText={row.helperText}
          />
        ))}
      </FieldGroup>
    </div>
  );
}
