"use client";

import type { CaStatementGet, CaStatementRow } from "@/types/ca-page-settings";
import { useSectionState } from "../CaSettingsContext";
import {
  FieldGroup,
  ItemListField,
  SectionHeader,
  TextAreaField,
  TextField,
} from "@/app/admin/settings/home-page/components/fields";
import IconPicker from "./IconPicker";
import {
  DEFAULT_STATEMENT_FOOTER_AMOUNT,
  DEFAULT_STATEMENT_FOOTER_LABEL,
  DEFAULT_STATEMENT_ROWS,
} from "@/app/digital-marketing-internship/content";

type StatementRowState = Omit<CaStatementRow, "credit"> & {
  credit: { amount: string; prefix: string };
};

const withEditableCredit = (row: CaStatementRow): StatementRowState => ({
  ...row,
  credit: row.credit ?? { amount: "", prefix: "" },
});

const PLACEHOLDERS: ReadonlyArray<{ token: string; meaning: string }> = [
  { token: "{stipend}", meaning: "the monthly stipend amount" },
  { token: "{incentiveCap}", meaning: "the incentive cap amount" },
  { token: "{joiningBonus}", meaning: "the joining bonus amount" },
  { token: "{kitValue}", meaning: "the joining kit value" },
  { token: "{lmsValue}", meaning: "the LMS access value" },
  { token: "{ppoPackageLpa}", meaning: "the PPO package, in LPA" },
  { token: "{topMonth}", meaning: "stipend plus the full incentive cap" },
  { token: "{kitItems}", meaning: "the kit items, as a sentence" },
];

export default function StatementSectionPage() {
  const { state, setState } = useSectionState("statement", (s) => ({
    rows: (s?.statement?.rows ?? []).map(withEditableCredit),
    footerLabel: s?.statement?.footerLabel ?? "",
    footerAmount: s?.statement?.footerAmount ?? "",
  }));

  const loadDefaults = () =>
    setState({
      rows: DEFAULT_STATEMENT_ROWS.map(withEditableCredit),
      footerLabel: DEFAULT_STATEMENT_FOOTER_LABEL,
      footerAmount: DEFAULT_STATEMENT_FOOTER_AMOUNT,
    });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <SectionHeader
        title="Statement"
        description="The rows of the Campus Ambassador statement table."
      />

      <div className="flex items-start justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
        <div className="text-sm text-stone-700">
          <p className="font-semibold text-stone-900">Placeholders</p>
          <p className="mt-1 text-xs text-stone-600">
            Any When, What happens, You get, or Credit field may use these. They stay in sync
            with the Amounts and Joining kit settings, and are resolved when the page renders.
            An unknown placeholder is shown as typed.
          </p>
          <ul className="mt-2 grid grid-cols-1 gap-1 text-xs text-stone-600 sm:grid-cols-2">
            {PLACEHOLDERS.map((p) => (
              <li key={p.token}>
                <code className="rounded bg-white px-1 py-0.5 font-mono text-orange-700">
                  {p.token}
                </code>{" "}
                {p.meaning}
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={loadDefaults}
          className="flex-none rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 hover:border-orange-300 hover:bg-orange-50"
        >
          Load the default rows
        </button>
      </div>

      <ItemListField<StatementRowState>
        label="Rows"
        items={state.rows}
        onChange={(rows) => setState((p) => ({ ...p, rows }))}
        newItem={() => ({ when: "", what: "", gets: [], credit: { amount: "", prefix: "" } })}
        addLabel="Add row"
        itemTitle={(item, i) => item.when || `Row ${i + 1}`}
        renderItem={(item, update) => (
          <div className="flex flex-col gap-3">
            <TextField
              label="When"
              value={item.when}
              onChange={(v) => update({ ...item, when: v })}
              placeholder="Month 1"
            />
            <TextAreaField
              label="What happens"
              value={item.what}
              onChange={(v) => update({ ...item, what: v })}
              rows={2}
            />

            <ItemListField<CaStatementGet>
              label="You get"
              items={item.gets}
              onChange={(gets) => update({ ...item, gets })}
              newItem={() => ({ icon: "doc", title: "", note: "" })}
              addLabel="Add item"
              itemTitle={(g, gi) => g.title || `Item ${gi + 1}`}
              renderItem={(g, updateGet) => (
                <div className="flex flex-col gap-3">
                  <IconPicker value={g.icon} onChange={(icon) => updateGet({ ...g, icon })} />
                  <TextField
                    label="Title"
                    value={g.title}
                    onChange={(v) => updateGet({ ...g, title: v })}
                  />
                  <TextField
                    label="Note"
                    value={g.note}
                    onChange={(v) => updateGet({ ...g, note: v })}
                  />
                </div>
              )}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField
                label="Credit amount"
                value={item.credit.amount}
                onChange={(v) => update({ ...item, credit: { ...item.credit, amount: v } })}
                placeholder="+ {stipend}"
                helperText="Leave empty for no credit column on this row"
              />
              <TextField
                label="Credit prefix"
                value={item.credit.prefix}
                onChange={(v) => update({ ...item, credit: { ...item.credit, prefix: v } })}
                placeholder="up to"
              />
            </div>
          </div>
        )}
      />

      <FieldGroup title="Footer">
        <TextField
          label="Footer label"
          value={state.footerLabel}
          onChange={(v) => setState((p) => ({ ...p, footerLabel: v }))}
          placeholder={DEFAULT_STATEMENT_FOOTER_LABEL}
          helperText={`Leave empty for the default "${DEFAULT_STATEMENT_FOOTER_LABEL}"`}
        />
        <TextField
          label="Footer amount"
          value={state.footerAmount}
          onChange={(v) => setState((p) => ({ ...p, footerAmount: v }))}
          placeholder={DEFAULT_STATEMENT_FOOTER_AMOUNT}
          helperText="Leave empty for the default of the stipend plus the full incentive cap"
        />
      </FieldGroup>
    </div>
  );
}
