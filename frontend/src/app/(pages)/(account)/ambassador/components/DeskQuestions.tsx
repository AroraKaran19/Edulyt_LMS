"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { cn } from "@/lib/utils";
import ExtraQuestionsEditor, { MAX_EXTRA_QUESTIONS } from "@/components/admin/crm/ExtraQuestionsEditor";
import type { QuestionDraft } from "@/components/admin/crm/ExtraQuestionsEditor";
import s from "../desk.module.css";

interface Props {
  drafts: QuestionDraft[];
  onChange: (next: QuestionDraft[]) => void;
  onSave: () => void;
  saving: boolean;
}

export default function DeskQuestions({ drafts, onChange, onSave, saving }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const count = drafts.length;

  return (
    <section className={s.section}>
      <div className={cn(s.card, s.questions)}>
        <h2>
          <button
            type="button"
            className={s.questionsToggle}
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((v) => !v)}
          >
            <span>
              <span className={s.questionsTitle}>Your enquiry form questions</span>
              <span className={s.questionsMeta}>
                {count === 0
                  ? "No questions of your own"
                  : `${count} of ${MAX_EXTRA_QUESTIONS} questions`}
              </span>
            </span>
            <span className={cn(s.chevron, open && s.chevronOpen)} aria-hidden="true">
              <ChevronDown />
            </span>
          </button>
        </h2>
        <div id={panelId} className={s.questionsBody} hidden={!open}>
          <p>Your team leader has let you ask your own. Leave this empty and your form asks theirs instead.</p>
          <ExtraQuestionsEditor questions={drafts} onChange={onChange} max={MAX_EXTRA_QUESTIONS} disabled={saving} />
          <div className={s.questionsSave}>
            <OrangeButton onClick={onSave} disabled={saving} className={cn(s.btn, s.btnOrange)}>
              Save
            </OrangeButton>
          </div>
        </div>
      </div>
    </section>
  );
}
