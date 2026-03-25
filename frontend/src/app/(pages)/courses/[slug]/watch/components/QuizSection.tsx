"use client";

import React, { useState, useCallback } from "react";
import SectionContainer from "./SectionContainer";
import { HelpCircle, Lock, CheckCircle2 } from "lucide-react";
import { QuizContent, QuizQuestion } from "@/types";
import useEnrollment from "@/hooks/useEnrollment";
import { useEnrollmentContext } from "@/components/EnrollmentGuard";
import { toast } from "react-toastify";
import OrangeButton from "@/components/ui/buttons/OrangeButton";

interface QuizSectionProps {
  quizContent: QuizContent;
  moduleId?: string;
  lessonId?: string;
  hasContentAccess: boolean;
  isAlreadyCompleted?: boolean;
  onQuizComplete?: () => void;
}

/**
 * Compares selected answers with correct answers (order-independent for multi-select).
 */
function areAnswersCorrect(
  selected: string[],
  correct: string[]
): boolean {
  if (selected.length !== correct.length) return false;
  const sortedSelected = [...selected].sort();
  const sortedCorrect = [...correct].sort();
  return sortedSelected.every((s, i) => s === sortedCorrect[i]);
}

export default function QuizSection({
  quizContent,
  moduleId,
  lessonId,
  hasContentAccess,
  isAlreadyCompleted = false,
  onQuizComplete,
}: QuizSectionProps) {
  const { updateEnrollmentProgress } = useEnrollment();
  const { enrollment, refreshEnrollment } = useEnrollmentContext() || {};
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = quizContent.questions || [];
  const passingScore = quizContent.passingScore ?? 70;
  const maxAttempts = quizContent.maxAttempts ?? Infinity;
  const isMultiSelect = (q: QuizQuestion) => (q.correctAnswer?.length ?? 0) > 1;

  const toggleOption = useCallback((questionIndex: number, option: string) => {
    const q = questions[questionIndex];
    if (!q) return;

    setAnswers((prev) => {
      const current = prev[questionIndex] ?? [];
      if (isMultiSelect(q)) {
        const has = current.includes(option);
        const next = has
          ? current.filter((o) => o !== option)
          : [...current, option];
        return { ...prev, [questionIndex]: next };
      }
      return { ...prev, [questionIndex]: [option] };
    });
  }, [questions]);

  const handleSubmit = useCallback(async () => {
    if (questions.length === 0) {
      toast.error("No questions in this quiz.");
      return;
    }

    let correctCount = 0;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const selected = answers[i] ?? [];
      if (q?.correctAnswer && areAnswersCorrect(selected, q.correctAnswer)) {
        correctCount++;
      }
    }

    const percentage = Math.round((correctCount / questions.length) * 100);
    setScore(percentage);
    setSubmitted(true);
    setIsSubmitting(true);

    try {
      if (percentage >= passingScore && enrollment?._id && quizContent._id && moduleId && lessonId) {
        await updateEnrollmentProgress(enrollment._id, {
          moduleId,
          lessonId,
          contentId: quizContent._id,
          contentType: "quiz",
          completed: true,
          timeSpent: 1,
        });

        refreshEnrollment?.();

        toast.success(`Quiz passed! Score: ${percentage}%`);
        if (onQuizComplete) {
          setTimeout(() => onQuizComplete(), 1500);
        }
      } else {
        toast.warning(
          `Score: ${percentage}%. You need ${passingScore}% to pass.`
        );
      }
    } catch (err) {
      console.error("Failed to update quiz progress:", err);
      toast.error("Failed to save quiz progress. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    questions,
    answers,
    passingScore,
    enrollment?._id,
    quizContent._id,
    moduleId,
    lessonId,
    updateEnrollmentProgress,
    refreshEnrollment,
    onQuizComplete,
  ]);

  const handleRetry = useCallback(() => {
    setAnswers({});
    setScore(null);
    setSubmitted(false);
    setAttempt((a) => a + 1);
  }, []);

  if (!hasContentAccess) {
    return (
      <SectionContainer
        id="quiz-section"
        className="w-full min-h-[300px] bg-gray-100 flex items-center justify-center"
      >
        <div className="text-center max-w-md mx-auto p-8">
          <Lock className="size-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Content Locked
          </h3>
          <p className="text-gray-600 mb-4">
            You don&apos;t have access to this quiz. Please contact your
            administrator to request access.
          </p>
          <p className="text-sm text-gray-500">Content: {quizContent.title}</p>
        </div>
      </SectionContainer>
    );
  }

  if (isAlreadyCompleted) {
    return (
      <SectionContainer
        id="quiz-section"
        className="w-full min-h-[300px] p-6 flex flex-col items-center justify-center"
      >
        <CheckCircle2 className="size-16 text-green-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Quiz Completed
        </h3>
        <p className="text-gray-600 mb-4">You&apos;ve already completed this quiz.</p>
        {onQuizComplete && (
          <OrangeButton onClick={onQuizComplete}>
            Continue to Next
          </OrangeButton>
        )}
      </SectionContainer>
    );
  }

  if (questions.length === 0) {
    return (
      <SectionContainer
        id="quiz-section"
        className="w-full min-h-[300px] bg-gray-100 flex items-center justify-center"
      >
        <div className="text-center">
          <HelpCircle className="size-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">This quiz has no questions.</p>
        </div>
      </SectionContainer>
    );
  }

  const canRetry = attempt < maxAttempts && submitted && (score ?? 0) < passingScore;

  return (
    <SectionContainer
      id="quiz-section"
      className="w-full min-h-[300px] p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="size-6 text-orange-500" />
        <h2 className="text-xl font-bold text-gray-900">{quizContent.title}</h2>
      </div>
      {quizContent.description && (
        <p className="text-gray-600 mb-6">{quizContent.description}</p>
      )}

      {!submitted ? (
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={idx} className="space-y-3">
              <p className="font-medium text-gray-900">
                {idx + 1}. {q.question}
              </p>
              <div className="space-y-2 pl-4">
                {(q.options || []).map((opt) => {
                  const isSelected = (answers[idx] ?? []).includes(opt);
                  return (
                    <label
                      key={opt}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                        ${isSelected ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}
                      `}
                    >
                      <input
                        type={isMultiSelect(q) ? "checkbox" : "radio"}
                        checked={isSelected}
                        onChange={() => toggleOption(idx, opt)}
                        className="w-4 h-4 text-orange-600"
                      />
                      <span className="text-gray-800">{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="pt-4">
            <OrangeButton
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                questions.some((_, i) => !(answers[i]?.length ?? 0))
              }
              className="px-6"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                "Submit Quiz"
              )}
            </OrangeButton>
          </div>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            {(score ?? 0) >= passingScore ? (
              <CheckCircle2 className="size-12 text-green-500" />
            ) : (
              <HelpCircle className="size-12 text-orange-500" />
            )}
            <span className="text-2xl font-bold">
              Score: {score}%
            </span>
          </div>
          {(score ?? 0) >= passingScore ? (
            <p className="text-green-700 font-medium">Congratulations! You passed.</p>
          ) : (
            <>
              <p className="text-gray-600">
                You need {passingScore}% to pass.{" "}
                {canRetry && `Attempt ${attempt} of ${maxAttempts}.`}
              </p>
              {canRetry && (
                <OrangeButton onClick={handleRetry} className="mt-4">
                  Try Again
                </OrangeButton>
              )}
            </>
          )}
        </div>
      )}
    </SectionContainer>
  );
}
