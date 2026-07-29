"use client";
import Container from "@/app/admin/components/ui/Container";
import { EditorHandle } from "@/components/shared/Editor/Editor";
import DropDown from "@/components/ui/dropdown/DropDown";
import TagInput from "@/components/ui/inputs/TagInput";
import Input from "@/components/ui/inputs/Input";
import Modal from "@/components/ui/Modal";
import { useFormContext } from "react-hook-form";
import { Controller } from "react-hook-form";
import { CourseFormData } from "@/types/courseForm";
import { getTextFromHtml } from "@/lib/courseFormUtils";
import dynamic from "next/dynamic";
import { ChangeEvent, useRef, useEffect, useState } from "react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";

/** Durations a learner can pick at checkout. */
const INTERNSHIP_DURATION_OPTIONS = [1, 2, 3, 6];

const RichTextEditor = dynamic(
  () => import("@/components/shared/Editor/Editor"),
  { ssr: false }
);

const Screen2 = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [showSuccessPointsRulesModal, setShowSuccessPointsRulesModal] =
    useState(false);
  const [internshipPrograms, setInternshipPrograms] = useState<
    { _id: string; title: string }[]
  >([]);
  const whatYouWillLearnEditorRef = useRef<EditorHandle | null>(null);
  const whoShouldJoinEditorRef = useRef<EditorHandle | null>(null);

  const {
    control,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<CourseFormData>();
  // Ensure component is mounted on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Programs available to offer with this course. Only active ones are sellable.
  useEffect(() => {
    apiClient
      .get(ENDPOINTS.courseInternships.all, {
        params: { page: 1, limit: 100, status: "active" },
      })
      .then((res) => {
        setInternshipPrograms(res.data?.data?.programs ?? []);
      })
      .catch(() => setInternshipPrograms([]));
  }, []);

  // Watch form values
  const whatYouWillLearnValue = watch("whatYouWillLearn");
  const whoShouldJoinValue = watch("whoShouldJoin");

  // Sync editor content with form values
  useEffect(() => {
    if (whatYouWillLearnEditorRef.current && whatYouWillLearnValue) {
      whatYouWillLearnEditorRef.current.setHTML(whatYouWillLearnValue);
    }
  }, [whatYouWillLearnValue]);

  useEffect(() => {
    if (whoShouldJoinEditorRef.current && whoShouldJoinValue) {
      whoShouldJoinEditorRef.current.setHTML(whoShouldJoinValue);
    }
  }, [whoShouldJoinValue]);

  // Handle editor content changes
  const handleWhatYouWillLearnChange = (html: string) => {
    setValue("whatYouWillLearn", html);
  };

  const handleWhoShouldJoinChange = (html: string) => {
    setValue("whoShouldJoin", html);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return (
      <Container
        title="Learning Information (Screen 2)"
        description="Define what students will learn and course requirements"
        className="h-full w-full"
        classNameBody="flex flex-col gap-4"
      >
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </Container>
    );
  }

  return (
    <Container
      title="Learning Information (Screen 2)"
      description="Define what students will learn and course requirements"
      className="h-full w-full"
      classNameBody="flex flex-col gap-4"
    >
      <Container
        description="Define what students will achieve after completing this course"
        className="w-full shadow-none border-none pb-0"
        classNameBody="flex flex-col gap-4 overflow-y-visible"
      >
        <div>
          <RichTextEditor
            title="What You Will Learn"
            required
            ref={whatYouWillLearnEditorRef}
            rows={4}
            minLength={25}
            maxLength={1000}
            showWordCount={true}
            className="w-full max-w-full"
            initialHtml={whatYouWillLearnValue || ""}
            error={errors.whatYouWillLearn?.message}
            onChange={handleWhatYouWillLearnChange}
          />
          <input
            type="hidden"
            {...control.register("whatYouWillLearn", {
              required: "What you will learn is required",
              validate: (value) => {
                if (!value) return "What you will learn is required";
                const textContent = getTextFromHtml(value);

                if (textContent.length < 25) {
                  return "What you will learn must be at least 25 characters";
                }
                if (textContent.length > 1000) {
                  return "What you will learn must be less than 1000 characters";
                }
                return true;
              },
            })}
          />
        </div>
        <Controller
          name="skills"
          control={control}
          rules={{ required: "At least one skill is required" }}
          render={({ field }) => (
            <TagInput
              label="Skills Students Will Acquire"
              placeholder="Enter skills students will acquire after completing this course"
              tags={field.value || []}
              onChange={field.onChange}
              countLabel="skills"
              required={true}
              error={errors.skills?.message}
            />
          )}
        />
        <Controller
          name="careerPaths"
          control={control}
          rules={{ required: "At least one career path is required" }}
          render={({ field }) => (
            <TagInput
              label="Career Paths"
              placeholder="Add career opportunities (e.g., Frontend Developer, Full Stack Developer, Software Engineer)"
              tags={field.value || []}
              onChange={field.onChange}
              maxTags={5}
              countLabel="career paths"
              required={true}
              error={errors.careerPaths?.message}
            />
          )}
        />
        <div className="flex gap-4">
          <Controller
            name="skillLevel"
            control={control}
            rules={{ required: "Skill level is required" }}
            render={({ field }) => (
              <DropDown
                {...field}
                label="Skill Level"
                options={["Beginner", "Intermediate", "Advanced"]}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  field.onChange(e.target.value)
                }
                error={errors.skillLevel?.message}
                required={true}
              />
            )}
          />
          <Controller
            name="duration"
            control={control}
            rules={{ required: "Course duration is required" }}
            render={({ field }) => (
              <DropDown
                {...field}
                label="Course Duration"
                options={[
                  "1 Month",
                  "2 Months",
                  "3 Months",
                  "4 Months",
                  "5 Months",
                  "6 Months",
                  "7 Months",
                  "8 Months",
                  "9 Months",
                  "10 Months",
                  "11 Months",
                  "12 Months",
                ]}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  field.onChange(e.target.value)
                }
                error={errors.duration?.message}
                required={true}
              />
            )}
          />
        </div>
        <div className="w-full max-w-md">
          <Controller
            name="completionSuccessPoints"
            control={control}
            rules={{
              required: "Success points is required",
              min: { value: 0, message: "Minimum is 0" },
              max: { value: 1_000_000, message: "Maximum is 1,000,000" },
              validate: (v) => {
                const n = Number(v);
                if (!Number.isFinite(n) || !Number.isInteger(n)) {
                  return "Enter a whole number";
                }
                return true;
              },
            }}
            render={({ field }) => (
              <Input
                type="number"
                label="Success points (on certificate generation)"
                required
                min={0}
                max={1_000_000}
                step={1}
                value={
                  field.value === undefined || field.value === null
                    ? 0
                    : field.value
                }
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    field.onChange(undefined);
                    return;
                  }
                  const n = Number(raw);
                  if (Number.isFinite(n)) {
                    field.onChange(Math.trunc(n));
                  }
                }}
                error={errors.completionSuccessPoints?.message as string}
              />
            )}
          />
          <p className="text-xs text-gray-500 mt-1.5 pl-0.5">
            Awarded when the student&apos;s certificate is generated (
            <button
              type="button"
              onClick={() => setShowSuccessPointsRulesModal(true)}
              className="text-orange-600 font-medium hover:underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-orange-400/50 rounded"
            >
              eligibility rules apply
            </button>
            ). Set to 0 to disable.
          </p>
          <Modal
            isOpen={showSuccessPointsRulesModal}
            onClose={() => setShowSuccessPointsRulesModal(false)}
            title="Success points eligibility"
            className="max-w-lg"
          >
            <ul className="list-disc pl-4 space-y-3 text-sm text-gray-700">
              <li>
                <span className="font-medium text-gray-900">Purchased course.</span>{" "}
                Students earn the success points you set here when their
                certificate is generated for a course they bought through a
                successful payment.
              </li>
              <li>
                <span className="font-medium text-gray-900">With a coupon.</span>{" "}
                Points are awarded only if the amount paid is{" "}
                <span className="whitespace-nowrap">more than 50%</span> of the
                effective plan price:{" "}
                <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                  plan price − plan discount − course discount
                </span>{" "}
                (as applied at checkout for that plan).
              </li>
            </ul>
            <p className="text-xs text-gray-500 mt-4">
              This field only sets how many points to award for this course when
              the student&apos;s certificate is generated and the rules above are
              met.
            </p>
          </Modal>
        </div>
        <div className="w-full max-w-md">
          <Controller
            name="staticReviewCount"
            control={control}
            rules={{
              min: { value: 0, message: "Minimum is 0" },
              validate: (v) => {
                if (v === undefined || v === null) return true;
                const n = Number(v);
                if (!Number.isFinite(n) || !Number.isInteger(n)) {
                  return "Enter a whole number";
                }
                return true;
              },
            }}
            render={({ field }) => (
              <Input
                type="number"
                label="Review count (displayed)"
                min={0}
                step={1}
                value={
                  field.value === undefined || field.value === null
                    ? 0
                    : field.value
                }
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    field.onChange(undefined);
                    return;
                  }
                  const n = Number(raw);
                  if (Number.isFinite(n)) {
                    field.onChange(Math.trunc(n));
                  }
                }}
                error={errors.staticReviewCount?.message as string}
              />
            )}
          />
          <p className="text-xs text-gray-500 mt-1.5 pl-0.5">
            Shown on the course page. Not derived from real reviews.
          </p>
        </div>
        <div className="w-full max-w-md">
          <Controller
            name="staticRating"
            control={control}
            rules={{
              min: { value: 0, message: "Minimum is 0" },
              max: { value: 5, message: "Maximum is 5" },
              validate: (v) => {
                if (v === undefined || v === null) return true;
                const n = Number(v);
                if (!Number.isFinite(n)) return "Enter a number";
                return true;
              },
            }}
            render={({ field }) => (
              <Input
                type="number"
                label="Rating (displayed, 0-5)"
                min={0}
                max={5}
                step={0.1}
                value={
                  field.value === undefined || field.value === null
                    ? 0
                    : field.value
                }
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    field.onChange(undefined);
                    return;
                  }
                  const n = Number(raw);
                  if (Number.isFinite(n)) {
                    field.onChange(n);
                  }
                }}
                error={errors.staticRating?.message as string}
              />
            )}
          />
          <p className="text-xs text-gray-500 mt-1.5 pl-0.5">
            Shown on the course page. Not derived from real ratings.
          </p>
        </div>
        <div className="w-full max-w-md">
          <Controller
            name="internshipOffer"
            control={control}
            render={({ field }) => {
              const offer = field.value;
              const programId = offer?.programId ?? "";
              const price = offer?.price ?? 0;
              const durations = offer?.durations ?? [];

              const patch = (
                next: Partial<{
                  programId: string;
                  price: number;
                  durations: number[];
                }>
              ) =>
                field.onChange({
                  programId,
                  price,
                  durations,
                  ...next,
                });

              const toggleDuration = (months: number) =>
                patch({
                  durations: durations.includes(months)
                    ? durations.filter((m) => m !== months)
                    : [...durations, months].sort((a, b) => a - b),
                });

              return (
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="font-medium text-black mb-1">
                    Internship offer
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    Sold as an add-on at checkout. One price — the duration a
                    learner picks sets their certificate period, not what they
                    pay.
                  </p>

                  <label className="font-medium text-black mb-2 block text-sm">
                    Program
                  </label>
                  <select
                    value={programId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      // Clearing sends an explicit null: JSON.stringify drops
                      // undefined keys, so the server would never see the
                      // field and the old offer would survive the save.
                      if (!nextId) {
                        field.onChange(null);
                        return;
                      }
                      patch({ programId: nextId });
                    }}
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">None — no internship offered</option>
                    {internshipPrograms.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.title}
                      </option>
                    ))}
                  </select>

                  {programId ? (
                    <>
                      <div className="mt-3">
                        <Input
                          type="number"
                          label="Price (₹)"
                          min={0}
                          step={1}
                          value={price}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            patch({ price: Number.isFinite(n) ? n : 0 });
                          }}
                        />
                      </div>

                      <p className="font-medium text-black mt-3 mb-2 block text-sm">
                        Durations offered
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {INTERNSHIP_DURATION_OPTIONS.map((months) => (
                          <label
                            key={months}
                            className="inline-flex items-center gap-2 text-sm cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              className="size-4 accent-orange-500"
                              checked={durations.includes(months)}
                              onChange={() => toggleDuration(months)}
                            />
                            {months} month{months === 1 ? "" : "s"}
                          </label>
                        ))}
                      </div>
                      {durations.length === 0 && (
                        <p className="text-xs text-red-500 mt-2">
                          Select at least one duration.
                        </p>
                      )}
                    </>
                  ) : null}
                </div>
              );
            }}
          />
        </div>
        <div>
          <RichTextEditor
            title="Who Should Join This Course"
            required
            ref={whoShouldJoinEditorRef}
            rows={3}
            minLength={25}
            maxLength={500}
            showWordCount={true}
            className="w-full max-w-full"
            initialHtml={whoShouldJoinValue || ""}
            error={errors.whoShouldJoin?.message}
            onChange={handleWhoShouldJoinChange}
          />
          <input
            type="hidden"
            {...control.register("whoShouldJoin", {
              required: "Who should join this course is required",
              validate: (value) => {
                if (!value) return "Who should join this course is required";
                const textContent = getTextFromHtml(value);

                if (textContent.length < 25) {
                  return "Who should join this course must be at least 25 characters";
                }
                if (textContent.length > 500) {
                  return "Who should join this course must be less than 500 characters";
                }
                return true;
              },
            })}
          />
        </div>
        <Controller
          name="prerequisites"
          control={control}
          render={({ field }) => (
            <TagInput
              label="Prerequisites (Optional)"
              placeholder="Enter prerequisites for this course"
              tags={field.value || []}
              onChange={field.onChange}
              countLabel="prerequisites"
              required={false}
              error={errors.prerequisites?.message}
            />
          )}
        />
        <Controller
          name="tags"
          control={control}
          render={({ field }) => (
            <TagInput
              label="Course Tags (Optional)"
              placeholder="Enter course tags"
              tags={field.value || []}
              onChange={field.onChange}
              countLabel="course tags"
              required={false}
              error={errors.tags?.message}
            />
          )}
        />
      </Container>
    </Container>
  );
};

export default Screen2;
