export interface ScorableQuestion {
  _id: string;
  options: { _id: string; isCorrect?: boolean }[];
}

export interface SubmittedAnswer {
  questionId: string;
  selectedOptionIds: string[];
}

const sameSet = (a: Set<string>, b: Set<string>): boolean =>
  a.size === b.size && [...a].every((x) => b.has(x));

/**
 * Analytics only. Finishing the test earns the coupon, so nothing downstream
 * may gate on this number.
 *
 * A question counts only on an exact set match: partial overlap and supersets
 * both score zero, and a question with no correct option can never be scored.
 */
export const scoreAttempt = (
  questions: ScorableQuestion[],
  answers: SubmittedAnswer[],
): number => {
  const byQuestion = new Map(
    answers.map((a) => [String(a.questionId), new Set(a.selectedOptionIds.map(String))]),
  );

  let correct = 0;
  for (const question of questions) {
    const expected = new Set(
      question.options.filter((o) => o.isCorrect).map((o) => String(o._id)),
    );
    if (expected.size === 0) continue;

    const given = byQuestion.get(String(question._id));
    if (given && sameSet(expected, given)) correct += 1;
  }
  return correct;
};
