"use client";

import Container from "@/app/admin/components/ui/Container";
import Input from "@/components/ui/inputs/Input";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { Controller, useFormContext } from "react-hook-form";
import { CourseInternshipFormData } from "@/types/courseInternshipForm";
import { ClipboardListIcon, Plus, X } from "lucide-react";
import { useState } from "react";

/** Free-text list editor used for perks and "what you will do". */
function StringListField({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const value = draft.trim();
    if (!value) return;
    onChange([...values, value]);
    setDraft("");
  };

  return (
    <div>
      <label className="font-medium text-black mb-2 block">{label}</label>
      <div className="flex gap-2">
        <Input
          value={draft}
          setChange={setDraft}
          placeholder={placeholder}
          className="flex-1"
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <WhiteButton type="button" glow={false} onClick={add}>
          <Plus className="size-4" />
        </WhiteButton>
      </div>
      {values.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {values.map((value, index) => (
            <li
              key={`${value}-${index}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700"
            >
              {value}
              <button
                type="button"
                aria-label={`Remove ${value}`}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
                onClick={() => onChange(values.filter((_, i) => i !== index))}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const Screen2 = () => {
  const { control } = useFormContext<CourseInternshipFormData>();

  return (
    <Container
      title="Programme Details"
      description="Perks, work and the details printed on documents"
      icon={ClipboardListIcon}
      classNameBody="flex flex-col gap-6"
    >
      <Controller
        name="perks"
        control={control}
        render={({ field }) => (
          <StringListField
            label="Perks"
            values={field.value ?? []}
            onChange={field.onChange}
            placeholder="Certificate of completion"
          />
        )}
      />

      <Controller
        name="whatYouWillDo"
        control={control}
        render={({ field }) => (
          <StringListField
            label="What you will do"
            values={field.value ?? []}
            onChange={field.onChange}
            placeholder="Build a sales dashboard"
          />
        )}
      />

      <Controller
        name="offerLetterDesignation"
        control={control}
        render={({ field }) => (
          <div>
            <Input
              label="Offer Letter Designation"
              value={field.value}
              setChange={field.onChange}
              placeholder="Data Analyst Intern"
            />
            <p className="text-xs text-gray-500 mt-1.5 pl-0.5">
              Printed on the learner&apos;s offer letter and certificate.
            </p>
          </div>
        )}
      />

      <Controller
        name="whatsappGroupLink"
        control={control}
        render={({ field }) => (
          <Input
            label="WhatsApp Group Link"
            value={field.value}
            setChange={field.onChange}
            placeholder="https://chat.whatsapp.com/…"
          />
        )}
      />
    </Container>
  );
};

export default Screen2;
