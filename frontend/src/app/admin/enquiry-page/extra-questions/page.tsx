"use client";

import { useEnquirySettings, useSectionState } from "../EnquirySettingsContext";
import {
  FieldGroup,
  SectionHeader,
} from "@/app/admin/settings/home-page/components/fields";
import ExtraQuestionsEditor, {
  MAX_EXTRA_QUESTIONS,
  type QuestionDraft,
} from "@/components/admin/crm/ExtraQuestionsEditor";
import type { EnquiryExtraQuestion } from "@/types/enquiry-page-settings";

// Saved questions carry a list; the editor's own unsaved copy carries text.
const toDraft = (q: EnquiryExtraQuestion): QuestionDraft => ({
  label: q.label ?? "",
  type: q.type === "select" ? "select" : "text",
  options: Array.isArray(q.options) ? q.options.join("\n") : (q.options ?? ""),
  required: Boolean(q.required),
});

export default function ExtraQuestionsSectionPage() {
  const { state, setState } = useSectionState("questions", (s) => ({
    items: (s?.questions?.items ?? []).map(toDraft),
  }));
  const linkQuestionsOff =
    useEnquirySettings().settings?.controls?.linkQuestionsOff === true;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <SectionHeader
        title="Extra questions"
        description={
          linkQuestionsOff
            ? "Link questions are turned off, so every visitor gets these questions, whichever link brought them."
            : "Asked on the plain enquiry page. A visit through a marketer's or sales person's link asks that owner's questions instead, unless link questions are turned off at the top of this page."
        }
      />

      <FieldGroup>
        <ExtraQuestionsEditor
          questions={state.items}
          onChange={(items) => setState({ items })}
          max={MAX_EXTRA_QUESTIONS}
        />
      </FieldGroup>
    </div>
  );
}
