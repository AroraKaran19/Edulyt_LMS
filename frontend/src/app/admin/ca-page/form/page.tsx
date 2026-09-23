"use client";

import { useSectionState } from "../CaSettingsContext";
import {
  FieldGroup,
  SectionHeader,
  StringListField,
  TextField,
} from "@/app/admin/settings/home-page/components/fields";
import { cn } from "@/lib/utils";
import type { CaFieldConfig, CaOptionalField } from "@/types/ca-page-settings";

const FIELD_ROWS: ReadonlyArray<{
  key: CaOptionalField;
  title: string;
  placeholder: string;
}> = [
  { key: "college", title: "College", placeholder: "College" },
  { key: "collegeEmail", title: "College email", placeholder: "College email" },
  { key: "course", title: "Course", placeholder: "Course" },
  { key: "careerStage", title: "Career stage", placeholder: "Career stage" },
  { key: "languages", title: "Languages", placeholder: "Languages you speak" },
  { key: "payout", title: "UPI ID / payout", placeholder: "UPI ID" },
  { key: "address", title: "Address", placeholder: "Address" },
  { key: "whatsapp", title: "WhatsApp group", placeholder: "WhatsApp group" },
];

const EMPTY_FIELD: CaFieldConfig = {
  enabled: true,
  required: true,
  label: "",
  help: "",
};

function FieldRow({
  title,
  placeholder,
  field,
  onChange,
}: {
  title: string;
  placeholder: string;
  field: CaFieldConfig;
  onChange: (next: CaFieldConfig) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-black">{title}</h3>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
            <input
              type="checkbox"
              checked={field.enabled}
              onChange={(e) => onChange({ ...field, enabled: e.target.checked })}
              className="size-4 accent-orange-500"
            />
            Show
          </label>
          <label
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium",
              field.enabled ? "text-gray-700" : "text-gray-400",
            )}
          >
            <input
              type="checkbox"
              checked={field.required}
              disabled={!field.enabled}
              onChange={(e) => onChange({ ...field, required: e.target.checked })}
              className="size-4 accent-orange-500 disabled:opacity-40"
            />
            Required
          </label>
        </div>
      </div>
      <TextField
        label="Label"
        value={field.label}
        onChange={(v) => onChange({ ...field, label: v })}
        placeholder={placeholder}
      />
      <TextField
        label="Help text"
        value={field.help}
        onChange={(v) => onChange({ ...field, help: v })}
      />
    </div>
  );
}

export default function FormSectionPage() {
  const { state, setState } = useSectionState("form", (s) => ({
    fields: FIELD_ROWS.reduce(
      (acc, row) => {
        const f = s?.form?.fields?.[row.key];
        acc[row.key] = f ? { ...f } : { ...EMPTY_FIELD };
        return acc;
      },
      {} as Record<CaOptionalField, CaFieldConfig>,
    ),
    languages: s?.form?.languages ?? [],
    whatsappLink: s?.form?.whatsappLink ?? "",
  }));

  const updateField = (key: CaOptionalField, next: CaFieldConfig) =>
    setState((p) => ({ ...p, fields: { ...p.fields, [key]: next } }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <SectionHeader
        title="Form fields"
        description="Which fields show, which are required, languages and the WhatsApp link."
      />

      <FieldGroup
        title="Always collected"
        description="Name, email and mobile number cannot be turned off."
      >
        <div className="flex flex-col gap-2">
          {["Name", "Email", "Mobile number"].map((label) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
            >
              <span className="font-medium text-gray-700">{label}</span>
              <span className="text-xs font-semibold text-gray-400">
                Shown &amp; required
              </span>
            </div>
          ))}
        </div>
      </FieldGroup>

      <div className="flex flex-col gap-3">
        {FIELD_ROWS.map((row) => (
          <FieldRow
            key={row.key}
            title={row.title}
            placeholder={row.placeholder}
            field={state.fields[row.key]}
            onChange={(next) => updateField(row.key, next)}
          />
        ))}
      </div>

      <FieldGroup>
        <StringListField
          label="Languages offered"
          items={state.languages}
          onChange={(languages) => setState((p) => ({ ...p, languages }))}
          placeholder="Hindi"
          addLabel="Add language"
        />
        <TextField
          label="WhatsApp group invite link"
          value={state.whatsappLink}
          onChange={(v) => setState((p) => ({ ...p, whatsappLink: v }))}
          placeholder="https://chat.whatsapp.com/..."
          helperText="Paste the invite link without anything after the code (drop any ?mode=... suffix)."
        />
      </FieldGroup>
    </div>
  );
}
