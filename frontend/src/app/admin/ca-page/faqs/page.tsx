"use client";

import { useSectionState } from "../CaSettingsContext";
import {
  ItemListField,
  SectionHeader,
  TextAreaField,
  TextField,
} from "@/app/admin/settings/home-page/components/fields";
import type { CaFaq } from "@/types/ca-page-settings";

export default function FaqsSectionPage() {
  const { state, setState } = useSectionState("faqs", (s) => ({
    items: s?.faqs?.items ?? [],
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <SectionHeader
        title="FAQs"
        description="Questions and answers. Leave the list empty to keep the shipped FAQs."
      />

      <ItemListField<CaFaq>
        label="Questions"
        items={state.items}
        onChange={(items) => setState((p) => ({ ...p, items }))}
        newItem={() => ({ question: "", answer: "" })}
        addLabel="Add question"
        itemTitle={(item, i) => item.question || `Question ${i + 1}`}
        renderItem={(item, update) => (
          <div className="flex flex-col gap-3">
            <TextField
              label="Question"
              value={item.question}
              onChange={(v) => update({ ...item, question: v })}
            />
            <TextAreaField
              label="Answer"
              value={item.answer}
              onChange={(v) => update({ ...item, answer: v })}
            />
          </div>
        )}
      />
    </div>
  );
}
