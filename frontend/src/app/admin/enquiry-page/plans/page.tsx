"use client";

import { useSectionState } from "../EnquirySettingsContext";
import MediaField from "../components/MediaField";
import {
  FieldGroup,
  ItemListField,
  SectionHeader,
  TextAreaField,
  TextField,
} from "@/app/admin/settings/home-page/components/fields";
import type {
  EnquiryPerk,
  EnquiryPerkGroup,
  EnquiryPerkState,
  EnquiryPlan,
  EnquiryPlanId,
} from "@/types/enquiry-page-settings";

const PLAN_IDS: EnquiryPlanId[] = [1, 2, 3];
const KINDS: EnquiryPerkState["kind"][] = ["included", "addon", "excluded"];

/** One perk's state for one plan. Three of these make a matrix row. */
function PerkCell({
  planId,
  value,
  onChange,
}: {
  planId: EnquiryPlanId;
  value: EnquiryPerkState;
  onChange: (next: EnquiryPerkState) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-gray-200 p-2.5">
      <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
        Plan 0{planId}
      </span>
      <select
        value={value.kind ?? "excluded"}
        onChange={(e) =>
          onChange({ ...value, kind: e.target.value as EnquiryPerkState["kind"] })
        }
        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-orange-500"
      >
        {KINDS.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>
      {value.kind !== "excluded" && (
        <input
          value={value.note ?? ""}
          onChange={(e) => onChange({ ...value, note: e.target.value })}
          placeholder="Note, e.g. 6 projects"
          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-orange-500"
        />
      )}
    </div>
  );
}

export default function PlansSectionPage() {
  const { state, setState } = useSectionState("plans", (s) => ({
    eyebrow: s?.plans?.eyebrow ?? "",
    heading: s?.plans?.heading ?? "",
    headingHighlight: s?.plans?.headingHighlight ?? "",
    lead: s?.plans?.lead ?? "",
    summaryHeader: s?.plans?.summaryHeader ?? "",
    mncAddonPrice: s?.plans?.mncAddonPrice ?? 0,
    plans: s?.plans?.plans ?? [],
    perkGroups: s?.plans?.perkGroups ?? [],
    promoImage: s?.plans?.promoImage ?? {},
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <SectionHeader
        title="Plans and perks"
        description="Three plans, fixed. Copy, prices and perks are editable here; adding a fourth plan or a fourth perk group needs a code change, because the lead form and the matrix are built around three."
      />

      <FieldGroup>
        <TextField
          label="Eyebrow"
          value={state.eyebrow}
          onChange={(v) => setState((p) => ({ ...p, eyebrow: v }))}
          placeholder="Compare the plans"
        />
        <TextField
          label="Heading"
          value={state.heading}
          onChange={(v) => setState((p) => ({ ...p, heading: v }))}
        />
        <TextField
          label="Heading highlight"
          value={state.headingHighlight}
          onChange={(v) => setState((p) => ({ ...p, headingHighlight: v }))}
        />
        <TextAreaField
          label="Lead"
          value={state.lead}
          onChange={(v) => setState((p) => ({ ...p, lead: v }))}
        />
        <TextAreaField
          label="Availability summary header"
          value={state.summaryHeader}
          onChange={(v) => setState((p) => ({ ...p, summaryHeader: v }))}
          helperText="The line above the three availability columns, which lists what each plan includes."
        />
        <TextField
          label="MNC certification add-on price"
          type="number"
          min={0}
          value={String(state.mncAddonPrice || "")}
          onChange={(v) =>
            setState((p) => ({ ...p, mncAddonPrice: Number(v) }))
          }
          helperText="Used by the matrix, the form total and the certificates summary."
        />
      </FieldGroup>

      <FieldGroup>
        <MediaField
          title="Filler image"
          description="Optional. Sits with the perk cards, in the gap the two columns leave at their foot. The box is a fixed 394 × 264, so upload at that ratio (3:2, e.g. 1200 × 800); anything else is centre-cropped to fit. Leave empty to show nothing."
          value={{
            src: state.promoImage.src,
            source: state.promoImage.source,
            s3Key: state.promoImage.s3Key,
          }}
          onChange={(next) =>
            setState((p) => ({
              ...p,
              promoImage: { ...p.promoImage, ...next },
            }))
          }
        />
        <TextField
          label="Filler image alt text"
          value={state.promoImage.alt ?? ""}
          onChange={(v) =>
            setState((p) => ({ ...p, promoImage: { ...p.promoImage, alt: v } }))
          }
          helperText="What the image says, for screen readers. Leave blank if it is purely decorative."
        />
      </FieldGroup>

      <ItemListField<EnquiryPlan>
        label="Plans"
        description="Exactly three, in this order. Edit the copy and the price; the ids are fixed because the lead form and the perk matrix key off them."
        items={state.plans}
        onChange={(plans) => setState((p) => ({ ...p, plans }))}
        itemTitle={(item) => item.name || `Plan 0${item.id ?? 1}`}
        fixed
        renderItem={(item, update) => (
          <div className="flex flex-col gap-3">
            <TextField
              label="Name"
              value={item.name ?? ""}
              onChange={(v) => update({ ...item, name: v })}
              placeholder="Mentor-to-Placement"
            />
            <TextField
              label="Price"
              type="number"
              min={0}
              value={String(item.price ?? 0)}
              onChange={(v) => update({ ...item, price: Number(v) })}
            />
            <TextAreaField
              label="Tagline"
              value={item.tagline ?? ""}
              onChange={(v) => update({ ...item, tagline: v })}
            />
            <TextField
              label="Best for"
              value={item.bestFor ?? ""}
              onChange={(v) => update({ ...item, bestFor: v })}
              placeholder="Best for guided learners"
            />
            <TextField
              label="Badge"
              value={item.badge ?? ""}
              onChange={(v) => update({ ...item, badge: v })}
              helperText="Blank for no badge. Only one plan should carry one."
            />
          </div>
        )}
      />

      <ItemListField<EnquiryPerkGroup>
        label="Perk groups"
        description="The groups themselves are fixed. Rename one, or edit the perks inside it."
        items={state.perkGroups}
        onChange={(perkGroups) => setState((p) => ({ ...p, perkGroups }))}
        itemTitle={(item, i) => item.title || `Group ${i + 1}`}
        fixed
        renderItem={(group, updateGroup) => (
          <div className="flex flex-col gap-3">
            <TextField
              label="Group title"
              value={group.title ?? ""}
              onChange={(v) => updateGroup({ ...group, title: v })}
              placeholder="Placement assistance"
            />
            <ItemListField<EnquiryPerk>
              label="Perks"
              items={group.perks ?? []}
              onChange={(perks) => updateGroup({ ...group, perks })}
              newItem={() => ({ label: "", by: {} })}
              addLabel="Add perk"
              itemTitle={(perk, i) => perk.label || `Perk ${i + 1}`}
              renderItem={(perk, updatePerk) => (
                <div className="flex flex-col gap-3">
                  <TextField
                    label="Label"
                    value={perk.label ?? ""}
                    onChange={(v) => updatePerk({ ...perk, label: v })}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    {PLAN_IDS.map((id) => (
                      <PerkCell
                        key={id}
                        planId={id}
                        value={perk.by?.[String(id) as "1" | "2" | "3"] ?? {}}
                        onChange={(next) =>
                          updatePerk({
                            ...perk,
                            by: { ...(perk.by ?? {}), [String(id)]: next },
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            />
          </div>
        )}
      />
    </div>
  );
}
