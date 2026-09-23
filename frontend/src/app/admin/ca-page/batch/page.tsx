"use client";

import { useSectionState } from "../CaSettingsContext";
import { FieldGroup, SectionHeader, TextField } from "@/app/admin/settings/home-page/components/fields";
import Select from "@/components/ui/inputs/Select";
import { formatIstDate, istDateOnlyToUtcIso } from "@/lib/ist";

const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6].map((n) => ({
  value: String(n),
  label: `${n} month${n > 1 ? "s" : ""}`,
}));

/**
 * Mirrors `tenureEndDate` in backend/src/lib/caApplication.ts: the day before
 * the same date `months` later, or the target month's last day when it is too
 * short. Pure calendar math on the "YYYY-MM-DD" the input gives, no timezone
 * conversion needed since that string already is the IST calendar date.
 */
function tenureEndDateYmd(joiningYmd: string, months: number): string | null {
  const m = joiningYmd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const monthIndex = mo - 1 + months;
  const ty = y + Math.floor(monthIndex / 12);
  const tm = (monthIndex % 12) + 1;
  const lastDay = new Date(Date.UTC(ty, tm, 0)).getUTCDate();
  const end =
    d > lastDay
      ? new Date(Date.UTC(ty, tm - 1, lastDay))
      : new Date(Date.UTC(ty, tm - 1, d - 1));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${end.getUTCFullYear()}-${p(end.getUTCMonth() + 1)}-${p(end.getUTCDate())}`;
}

export default function BatchSectionPage() {
  const { state, setState } = useSectionState("batch", (s) => ({
    joiningDate: s?.batch?.joiningDate ?? "",
    durationMonths: s?.batch?.durationMonths ?? 3,
  }));

  const endYmd = state.joiningDate
    ? tenureEndDateYmd(state.joiningDate, state.durationMonths)
    : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <SectionHeader
        title="Batch"
        description="Joining date and duration for new applicants."
      />

      <FieldGroup>
        <TextField
          label="Joining date"
          type="date"
          value={state.joiningDate}
          onChange={(v) => setState((p) => ({ ...p, joiningDate: v }))}
          helperText="Clearing this closes the public form to new applications."
        />
        <div className="w-full flex flex-col gap-1.5">
          <Select
            label="Duration"
            options={DURATION_OPTIONS}
            value={String(state.durationMonths)}
            onChange={(v) =>
              setState((p) => ({ ...p, durationMonths: Number(v) }))
            }
          />
        </div>
        {endYmd && (
          <p className="text-sm text-gray-700">
            Ends {formatIstDate(istDateOnlyToUtcIso(endYmd))}
          </p>
        )}
        <p className="text-xs text-stone-500">
          Changes apply to new applicants only. Existing applications keep
          the batch they applied for.
        </p>
      </FieldGroup>
    </div>
  );
}
