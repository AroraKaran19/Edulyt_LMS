"use client";

import { useSectionState } from "../CaSettingsContext";
import { FieldGroup, SectionHeader, TextField } from "@/app/admin/settings/home-page/components/fields";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";

const ALL_DURATIONS = [1, 2, 3, 4, 5, 6];

export default function EnrollmentSectionPage() {
  const { state, setState } = useSectionState("enrollment", (s) => ({
    acceptingApplications: s?.enrollment?.acceptingApplications ?? false,
    durations: s?.enrollment?.durations ?? [],
    minSuccessPoints: s?.enrollment?.minSuccessPoints ?? 0,
  }));

  const toggleDuration = (months: number) => {
    setState((p) => ({
      ...p,
      durations: p.durations.includes(months)
        ? p.durations.filter((m: number) => m !== months)
        : [...p.durations, months].sort((a: number, b: number) => a - b),
    }));
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <SectionHeader
        title="Enrollment"
        description="Whether applications are open, the durations offered, and the points minimum for completion documents."
      />

      <FieldGroup>
        <CheckBoxContainer
          label="Accepting applications"
          checked={state.acceptingApplications}
          onChange={(v: boolean) => setState((p) => ({ ...p, acceptingApplications: v }))}
        />

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Durations offered</span>
          <div className="flex flex-wrap gap-2">
            {ALL_DURATIONS.map((months) => (
              <button
                key={months}
                type="button"
                onClick={() => toggleDuration(months)}
                className={`max-sm:text-base rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  state.durations.includes(months)
                    ? "border-orange-300 bg-orange-50 text-orange-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {months} month{months === 1 ? "" : "s"}
              </button>
            ))}
          </div>
        </div>

        <TextField
          label="Minimum points for completion documents"
          type="number"
          min={0}
          value={String(state.minSuccessPoints)}
          onChange={(v) => setState((p) => ({ ...p, minSuccessPoints: Number(v) || 0 }))}
          helperText="A CA below this many points at the end of their tenure gets the not-eligible email instead of the completion documents. 0 means everyone qualifies."
        />

        <p className="text-xs text-stone-500">
          Turning applications off, or leaving no duration selected, closes the public form.
        </p>
      </FieldGroup>
    </div>
  );
}
