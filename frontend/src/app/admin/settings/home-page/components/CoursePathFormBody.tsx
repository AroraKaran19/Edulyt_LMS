"use client";

import { FieldGroup, TextField } from "./fields";
import type { HomeCoursePathSettings } from "@/types/home-page-settings";

export default function CoursePathFormBody({
  state,
  update,
}: {
  state: HomeCoursePathSettings;
  update: (patch: Partial<HomeCoursePathSettings>) => void;
}) {
  return (
    <>
      <FieldGroup title="Heading">
        <TextField
          label="Eyebrow"
          value={state.eyebrow ?? ""}
          onChange={(eyebrow) => update({ eyebrow })}
          placeholder="Pick Your Path"
        />
        <TextField
          label="Title"
          required
          value={state.title}
          onChange={(title) => update({ title })}
          placeholder="We Have Two Powerful Paths for You"
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <TextField
            label="Courses heading prefix"
            value={state.coursesHeadingPrefix ?? ""}
            onChange={(coursesHeadingPrefix) =>
              update({ coursesHeadingPrefix })
            }
            placeholder="Industry-Driven"
          />
          <TextField
            label="Courses heading highlight"
            value={state.coursesHeadingHighlight ?? ""}
            onChange={(coursesHeadingHighlight) =>
              update({ coursesHeadingHighlight })
            }
            placeholder="Programs"
          />
        </div>
      </FieldGroup>

      <FieldGroup
        title="Audience"
        description="Which audience's courses are pulled into this path block."
      >
        <div className="flex gap-2">
          {(["college-students", "professionals"] as const).map((opt) => (
            <label
              key={opt}
              className={`flex-1 cursor-pointer rounded-lg border px-4 py-3 text-sm font-medium ${
                state.audience === opt
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              <input
                type="radio"
                className="sr-only"
                checked={state.audience === opt}
                onChange={() => update({ audience: opt })}
              />
              {opt === "college-students" ? "College students" : "Professionals"}
            </label>
          ))}
        </div>
      </FieldGroup>
    </>
  );
}
