import mongoose from "mongoose";
import {
  CouponModel,
  ScholarshipAttemptModel,
  ScholarshipCouponEntitlementModel,
  ScholarshipTestModel,
  UserModel,
} from "../models";
import { InternshipQuestionModel } from "../models/internshipQuestion.schema";
import { AppError } from "../middlewares/error.middleware";
import { scoreAttempt } from "../lib/scholarshipScoring";
import { bumpDailyStat } from "./scholarshipOtp.services";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface PublicQuestion {
  questionId: string;
  questionText: string;
  options: { optionId: string; text: string }[];
}

export interface AttemptView {
  attemptId: string;
  attemptNumber: number;
  attemptsAllowed: number;
  expiresAt: Date;
  questions: PublicQuestion[];
  answers: { questionId: string; selectedOptionIds: string[] }[];
}

export interface ResultView {
  correctCount: number;
  totalQuestions: number;
  couponCode: string;
  couponExpiresAt: Date;
  discountPercent: number;
  expired: boolean;
}

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (error as { code?: number }).code === 11000;

const loadCampaign = async (testId: string) => {
  const campaign = await ScholarshipTestModel.findById(testId).lean();
  if (!campaign) throw new AppError("Campaign not found", 404);
  return campaign;
};

const assertOpen = (campaign: { isActive: boolean }) => {
  if (!campaign.isActive) {
    throw new AppError("This campaign is no longer accepting attempts", 400);
  }
};

type BankQuestion = {
  _id: unknown;
  questionText?: string;
  options?: { _id: unknown; text?: string; isCorrect?: boolean }[];
};

/**
 * Strips every question down to what a candidate may see.
 *
 * `isCorrect` never crosses this boundary. The bank is shared with live
 * internship exams, so one careless serialisation turns the public API into an
 * answer key.
 */
const toPublicQuestions = (
  order: unknown[],
  bank: BankQuestion[],
): PublicQuestion[] => {
  const byId = new Map(bank.map((q) => [String(q._id), q]));
  return order
    .map((id) => byId.get(String(id)))
    .filter((q): q is BankQuestion => Boolean(q))
    .map((q) => ({
      questionId: String(q._id),
      questionText: q.questionText ?? "",
      options: (q.options ?? []).map((o) => ({
        optionId: String(o._id),
        text: o.text ?? "",
      })),
    }));
};

type AttemptDoc = {
  _id: unknown;
  status: string;
  attemptNumber: number;
  questionOrder: unknown[];
  expiresAt: Date;
  totalQuestions?: number;
  correctCount?: number;
  answers?: { questionId: unknown; selectedOptionIds: string[] }[];
};

const attemptView = async (
  attempt: AttemptDoc,
  attemptsAllowed: number,
): Promise<AttemptView> => {
  const bank = await InternshipQuestionModel.find({
    _id: { $in: attempt.questionOrder },
  })
    .select("questionText options")
    .lean();

  return {
    attemptId: String(attempt._id),
    attemptNumber: attempt.attemptNumber,
    attemptsAllowed,
    expiresAt: attempt.expiresAt,
    questions: toPublicQuestions(attempt.questionOrder, bank as BankQuestion[]),
    answers: (attempt.answers ?? []).map((a) => ({
      questionId: String(a.questionId),
      selectedOptionIds: a.selectedOptionIds ?? [],
    })),
  };
};

/** Marks a lapsed in-progress attempt expired rather than returning a dead clock. */
const reapIfLapsed = async (attempt: AttemptDoc): Promise<boolean> => {
  if (attempt.status !== "in_progress") return false;
  if (new Date(attempt.expiresAt).getTime() >= Date.now()) return false;
  await ScholarshipAttemptModel.updateOne(
    { _id: attempt._id, status: "in_progress" },
    { $set: { status: "expired" } },
  );
  return true;
};

export const resumeAttempt = async (
  testId: string,
  email: string,
): Promise<AttemptView | null> => {
  const campaign = await loadCampaign(testId);
  const live = await ScholarshipAttemptModel.findOne({
    testId,
    email,
    status: "in_progress",
  }).lean();
  if (!live) return null;

  const doc = live as unknown as AttemptDoc;
  if (await reapIfLapsed(doc)) return null;
  return attemptView(doc, campaign.attemptsAllowed);
};

export const startAttempt = async (
  testId: string,
  email: string,
): Promise<AttemptView> => {
  const campaign = await loadCampaign(testId);
  assertOpen(campaign as never);

  const existing = await resumeAttempt(testId, email);
  if (existing) return existing;

  const finished = await ScholarshipAttemptModel.findOne({
    testId,
    email,
    status: "submitted",
  })
    .select("_id")
    .lean();
  if (finished) {
    throw new AppError("You have already finished this test", 409);
  }

  // Every prior attempt counts, expired ones included. A timeout has to burn an
  // attempt: with must-finish semantics, not burning it would make retries
  // infinite and the clock meaningless.
  const used = await ScholarshipAttemptModel.countDocuments({ testId, email });
  if (used >= campaign.attemptsAllowed) {
    throw new AppError("You have no attempts left for this test", 409);
  }

  const creator = await UserModel.findById(campaign.createdBy)
    .select("firstName lastName")
    .lean();

  const order = [...(campaign.questions as unknown[])];
  const now = new Date();

  let created;
  try {
    created = await ScholarshipAttemptModel.create({
      testId: campaign._id,
      testSnapshot: {
        title: campaign.title,
        slug: campaign.slug,
        discountPercent: campaign.discountPercent,
        totalQuestions: order.length,
        marketerName:
          [creator?.firstName, creator?.lastName].filter(Boolean).join(" ") ||
          "",
      },
      email,
      attemptNumber: used + 1,
      status: "in_progress",
      questionOrder: order,
      startedAt: now,
      // Server-side authority. Nothing client-supplied touches the clock.
      expiresAt: new Date(now.getTime() + campaign.durationMinutes * 60 * 1000),
      totalQuestions: order.length,
    });
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    // Two tabs raced the same start. The unique index picked a winner; hand
    // this caller the attempt that won rather than a 500.
    const resumed = await resumeAttempt(testId, email);
    if (resumed) return resumed;
    throw error;
  }

  await bumpDailyStat(campaign._id, "started");
  return attemptView(
    created.toObject() as unknown as AttemptDoc,
    campaign.attemptsAllowed,
  );
};

export const saveAnswer = async (
  testId: string,
  email: string,
  questionId: string,
  selectedOptionIds: string[],
): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    throw new AppError("That question is not on this test", 400);
  }

  const live = await ScholarshipAttemptModel.findOne({
    testId,
    email,
    status: "in_progress",
  }).lean();
  if (!live) throw new AppError("No attempt in progress", 409);

  const attempt = live as unknown as AttemptDoc;
  if (await reapIfLapsed(attempt)) {
    throw new AppError("Your time ran out", 410);
  }

  const onPaper = attempt.questionOrder.some(
    (id) => String(id) === String(questionId),
  );
  if (!onPaper) {
    throw new AppError("That question is not on this test", 400);
  }

  const clean = [...new Set((selectedOptionIds ?? []).map(String))];
  const qid = new mongoose.Types.ObjectId(questionId);

  // Replace rather than append: answering twice must leave one answer, not two.
  await ScholarshipAttemptModel.updateOne(
    { _id: attempt._id, status: "in_progress" },
    { $pull: { answers: { questionId: qid } } },
  );
  await ScholarshipAttemptModel.updateOne(
    { _id: attempt._id, status: "in_progress" },
    { $push: { answers: { questionId: qid, selectedOptionIds: clean } } },
  );
};

/**
 * Issues the campaign coupon to this email, once.
 *
 * The unique index on (couponId, email) is the idempotency guarantee: a
 * duplicate key means the entitlement already exists, which is success, not an
 * error.
 */
export const issueEntitlement = async (
  campaign: { _id: unknown; couponId: unknown; couponValidForDays: number },
  attemptId: unknown,
  email: string,
): Promise<{ expiresAt: Date }> => {
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + campaign.couponValidForDays * DAY_MS,
  );
  try {
    await ScholarshipCouponEntitlementModel.create({
      couponId: campaign.couponId,
      testId: campaign._id,
      email,
      attemptId,
      issuedAt: now,
      // Stamped, never derived: editing the campaign later must not shorten a
      // deadline this person has already been shown.
      expiresAt,
    });
    return { expiresAt };
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    const existing = await ScholarshipCouponEntitlementModel.findOne({
      couponId: campaign.couponId,
      email,
    }).lean();
    return { expiresAt: (existing?.expiresAt as Date) ?? expiresAt };
  }
};

const buildResult = async (
  campaign: { couponId: unknown; discountPercent: number },
  correctCount: number,
  totalQuestions: number,
  entitlementExpiresAt: Date,
): Promise<ResultView> => {
  const coupon = await CouponModel.findById(campaign.couponId)
    .select("code")
    .lean();
  return {
    correctCount,
    totalQuestions,
    couponCode: coupon?.code ?? "",
    couponExpiresAt: entitlementExpiresAt,
    discountPercent: campaign.discountPercent,
    expired: new Date(entitlementExpiresAt).getTime() < Date.now(),
  };
};

export const submitAttempt = async (
  testId: string,
  email: string,
): Promise<ResultView> => {
  const campaign = await loadCampaign(testId);

  const live = await ScholarshipAttemptModel.findOne({
    testId,
    email,
    status: "in_progress",
  }).lean();
  if (!live) throw new AppError("No attempt in progress", 409);

  const attempt = live as unknown as AttemptDoc;

  // Must-finish: a lapsed attempt earns nothing. The client clock is never
  // trusted, so this re-checks server-side before anything is issued.
  if (await reapIfLapsed(attempt)) {
    throw new AppError(
      "Your time ran out before you finished, so no coupon was issued",
      410,
    );
  }

  const bank = (await InternshipQuestionModel.find({
    _id: { $in: attempt.questionOrder },
  })
    .select("options")
    .lean()) as BankQuestion[];

  const correctCount = scoreAttempt(
    bank.map((q) => ({
      _id: String(q._id),
      options: (q.options ?? []).map((o) => ({
        _id: String(o._id),
        isCorrect: o.isCorrect,
      })),
    })),
    (attempt.answers ?? []).map((a) => ({
      questionId: String(a.questionId),
      selectedOptionIds: a.selectedOptionIds ?? [],
    })),
  );

  const claimed = await ScholarshipAttemptModel.updateOne(
    { _id: attempt._id, status: "in_progress" },
    {
      $set: { status: "submitted", submittedAt: new Date(), correctCount },
    },
  );
  if (claimed.modifiedCount === 0) {
    throw new AppError("This attempt was already submitted", 409);
  }

  // Scoring never gates the reward: an all-wrong paper earns the same coupon.
  const { expiresAt } = await issueEntitlement(
    campaign as never,
    attempt._id,
    email,
  );

  await bumpDailyStat(campaign._id, "submitted");

  return buildResult(
    campaign as never,
    correctCount,
    attempt.totalQuestions ?? attempt.questionOrder.length,
    expiresAt,
  );
};

/**
 * The recovery path. Nothing emails the coupon, so this is the only way back to
 * it for anyone who closed the tab.
 */
export const getResultForEmail = async (
  testId: string,
  email: string,
): Promise<ResultView | null> => {
  const entitlement = await ScholarshipCouponEntitlementModel.findOne({
    testId,
    email,
    revokedAt: null,
  }).lean();
  if (!entitlement) return null;

  const campaign = await loadCampaign(testId);
  const attempt = await ScholarshipAttemptModel.findOne({
    testId,
    email,
    status: "submitted",
  })
    .select("correctCount totalQuestions")
    .lean();

  return buildResult(
    campaign as never,
    attempt?.correctCount ?? 0,
    attempt?.totalQuestions ?? 0,
    entitlement.expiresAt as Date,
  );
};
