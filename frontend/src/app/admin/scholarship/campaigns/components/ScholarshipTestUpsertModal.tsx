"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Check, ChevronLeft } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import TextArea from "@/components/ui/inputs/TextArea";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { PickerQuestion } from "@/components/admin/internships/QuestionPickerModal";
import type { ScholarshipTestDetail } from "@/types/scholarship";
import StepCampaign from "./StepCampaign";
import StepQuestions from "./StepQuestions";
import StepReward from "./StepReward";
import CampaignSummaryCard from "./CampaignSummaryCard";
import LockedField from "./LockedField";

const STEPS = ["Campaign", "Questions", "Reward"] as const;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "create" | "edit";
  testId?: string | null;
};

const errorMessage = (error: unknown, fallback: string): string => {
  const e = error as {
    response?: { data?: { error?: { message?: string }; message?: string } };
  };
  return (
    e?.response?.data?.error?.message || e?.response?.data?.message || fallback
  );
};

const isPositiveInt = (raw: string): boolean => {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1;
};

export default function ScholarshipTestUpsertModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  testId,
}: Props) {
  const [step, setStep] = useState(0);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<PickerQuestion[]>([]);
  const [discountPercent, setDiscountPercent] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("15");
  const [attemptsAllowed, setAttemptsAllowed] = useState("1");
  const [couponValidForDays, setCouponValidForDays] = useState("30");
  const [isActive, setIsActive] = useState(true);
  const [attemptCount, setAttemptCount] = useState(0);

  const isEdit = mode === "edit";
  const paperLocked = isEdit && attemptCount > 0;

  const reset = useCallback(() => {
    setStep(0);
    setTitle("");
    setDescription("");
    setSelected([]);
    setDiscountPercent("");
    setDurationMinutes("15");
    setAttemptsAllowed("1");
    setCouponValidForDays("30");
    setIsActive(true);
    setAttemptCount(0);
    setSubmitting(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === "create") {
      reset();
      return;
    }
    if (!testId) return;

    let cancelled = false;
    (async () => {
      setLoadingDetail(true);
      try {
        const res = await apiClient.get(
          ENDPOINTS.scholarshipTests.adminById(testId),
        );
        const d = res.data?.data as ScholarshipTestDetail | undefined;
        if (cancelled || !d) return;

        setStep(0);
        setTitle(d.title ?? "");
        setDescription(d.description ?? "");
        setDiscountPercent(String(d.discountPercent ?? ""));
        setDurationMinutes(String(d.durationMinutes ?? ""));
        setAttemptsAllowed(String(d.attemptsAllowed ?? 1));
        setCouponValidForDays(String(d.couponValidForDays ?? 30));
        setIsActive(d.isActive !== false);
        setAttemptCount(d.attemptCount ?? 0);
        // The detail payload carries ids only, so the picker list shows a
        // placeholder row per question until the admin reopens the picker.
        setSelected(
          (d.questions ?? []).map((id) => ({
            _id: String(id),
            questionText: "Question from the saved paper",
            type: "mcq",
            usageType: "exam",
            score: 0,
            category: null,
          })),
        );
      } catch (error) {
        if (!cancelled) {
          toast.error(errorMessage(error, "Could not load the campaign"));
          onClose();
        }
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, mode, testId, onClose, reset]);

  /** Blocks Next so nobody reaches step 3 to be told step 1 was wrong. */
  const validateStep = (index: number): string | null => {
    if (index === 0) {
      if (!isEdit && !title.trim()) return "Give the campaign a title";
      return null;
    }
    if (index === 1) {
      if (paperLocked) return null;
      if (selected.length === 0) return "Pick at least one question";
      return null;
    }
    return null;
  };

  const goNext = () => {
    const problem = validateStep(step);
    if (problem) {
      toast.error(problem);
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const submit = async () => {
    for (let i = 0; i < STEPS.length; i += 1) {
      const problem = validateStep(i);
      if (problem) {
        toast.error(problem);
        setStep(i);
        return;
      }
    }

    if (!isEdit) {
      if (!isPositiveInt(durationMinutes)) {
        toast.error("The attempt clock must be a whole number of minutes");
        setStep(2);
        return;
      }
      if (!isPositiveInt(attemptsAllowed)) {
        toast.error("Allow at least 1 attempt");
        setStep(2);
        return;
      }
      const discount = Number(discountPercent);
      if (!Number.isFinite(discount) || discount < 1 || discount > 100) {
        toast.error("The discount must be between 1 and 100 percent");
        setStep(2);
        return;
      }
    }

    if (!isPositiveInt(couponValidForDays)) {
      toast.error("The coupon must stay valid for at least 1 whole day");
      setStep(2);
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        if (!testId) throw new Error("missing id");
        const payload: Record<string, unknown> = {
          description: description.trim(),
          couponValidForDays: Number(couponValidForDays),
          isActive,
        };
        // Only send the paper while it is still changeable; the server refuses
        // it once anyone has attempted, and sending it would 409 a no-op edit.
        if (!paperLocked) {
          payload.questions = selected.map((q) => q._id);
        }
        await apiClient.patch(
          ENDPOINTS.scholarshipTests.adminById(testId),
          payload,
        );
        toast.success("Campaign updated");
      } else {
        await apiClient.post(ENDPOINTS.scholarshipTests.create, {
          title: title.trim(),
          description: description.trim(),
          questionIds: selected.map((q) => q._id),
          durationMinutes: Number(durationMinutes),
          attemptsAllowed: Number(attemptsAllowed),
          discountPercent: Number(discountPercent),
          couponValidForDays: Number(couponValidForDays),
          isActive,
        });
        toast.success("Campaign created");
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, "Could not save the campaign"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit campaign" : "New scholarship campaign"}
      className="max-w-2xl w-full mx-4 max-h-[90vh]"
    >
      {isEdit && loadingDetail ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          <p className="text-sm text-gray-500">Loading campaign…</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Stepper: backwards only, so a step is never skipped forward. */}
          <div className="flex items-center">
            {STEPS.map((label, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <React.Fragment key={label}>
                  <button
                    type="button"
                    onClick={() => done && setStep(i)}
                    disabled={!done}
                    title={done ? `Back to ${label}` : undefined}
                    className={`flex items-center gap-2 ${
                      done ? "cursor-pointer group" : "cursor-default"
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors ${
                        done
                          ? "bg-orange-500 text-white group-hover:bg-orange-600"
                          : active
                            ? "bg-orange-100 text-orange-600 ring-2 ring-orange-500"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {done ? <Check className="w-4 h-4" /> : i + 1}
                    </span>
                    <span
                      className={`text-sm font-medium hidden sm:inline ${
                        active
                          ? "text-gray-900"
                          : done
                            ? "text-gray-600 group-hover:text-orange-600"
                            : "text-gray-400"
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-3 ${
                        done ? "bg-orange-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="min-h-[280px]">
            {step === 0 &&
              (isEdit ? (
                <div className="flex flex-col gap-3">
                  {/* Title, course, and slug are immutable: the slug is a live
                      public URL and the course scopes an already-minted coupon. */}
                  <LockedField label="Campaign title" value={title} />
                  <TextArea
                    label="Public description"
                    placeholder="Shown to candidates on the campaign page (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              ) : (
                <StepCampaign
                  title={title}
                  setTitle={setTitle}
                  description={description}
                  setDescription={setDescription}
                />
              ))}

            {step === 1 && (
              <StepQuestions
                selected={selected}
                setSelected={setSelected}
                locked={paperLocked}
              />
            )}

            {step === 2 && (
              <StepReward
                discountPercent={discountPercent}
                setDiscountPercent={setDiscountPercent}
                durationMinutes={durationMinutes}
                setDurationMinutes={setDurationMinutes}
                attemptsAllowed={attemptsAllowed}
                setAttemptsAllowed={setAttemptsAllowed}
                couponValidForDays={couponValidForDays}
                setCouponValidForDays={setCouponValidForDays}
                isActive={isActive}
                setIsActive={setIsActive}
                frozen={isEdit}
              />
            )}
          </div>

          <CampaignSummaryCard
            questionCount={selected.length}
            durationMinutes={durationMinutes}
            attemptsAllowed={attemptsAllowed}
            discountPercent={discountPercent}
            couponValidForDays={couponValidForDays}
          />

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <WhiteButton
              type="button"
              glow={false}
              disabled={submitting}
              onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}
              className="inline-flex items-center gap-1.5"
            >
              {step === 0 ? (
                "Cancel"
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" /> Back
                </>
              )}
            </WhiteButton>

            {step < STEPS.length - 1 ? (
              <OrangeButton type="button" glow={false} onClick={goNext}>
                Next
              </OrangeButton>
            ) : (
              <OrangeButton
                type="button"
                glow={false}
                disabled={submitting}
                onClick={() => void submit()}
              >
                {submitting
                  ? "Saving…"
                  : isEdit
                    ? "Save changes"
                    : "Create campaign"}
              </OrangeButton>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
