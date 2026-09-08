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
import { rollDiscountPercent } from "../lib/scholarshipDiscountRoll";
import { generateScholarshipCouponCode } from "../lib/scholarshipTestValidation";
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
        minDiscountPercent: campaign.minDiscountPercent,
        maxDiscountPercent: campaign.maxDiscountPercent,
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

export interface IssuedReward {
  expiresAt: Date;
  awardedPercent: number;
  couponCode: string;
}

/**
 * Rolls this person's discount and mints the single-use coupon carrying it.
 *
 * Idempotent on (testId, email), which is the unique index: a retried submit
 * re-reads the original roll rather than awarding a second, better one.
 *
 * Rolled here rather than at attempt start so that abandoning a test consumes
 * no percentage, and because the attempt snapshot freezes before a roll could
 * exist.
 */
export const issueEntitlement = async (
  campaign: {
    _id: unknown;
    title: string;
    slug: string;
    createdByName?: string;
    minDiscountPercent: number;
    maxDiscountPercent: number;
    couponValidForDays: number;
    createdBy: unknown;
  },
  attemptId: unknown,
  email: string,
): Promise<IssuedReward> => {
  const existing = await ScholarshipCouponEntitlementModel.findOne({
    testId: campaign._id,
    email,
  }).lean();
  if (existing) {
    return {
      expiresAt: existing.expiresAt as Date,
      awardedPercent: existing.awardedPercent as number,
      couponCode: existing.couponCode as string,
    };
  }

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + campaign.couponValidForDays * DAY_MS,
  );
  const awardedPercent = rollDiscountPercent(
    campaign.minDiscountPercent,
    campaign.maxDiscountPercent,
  );
  const couponCode = generateScholarshipCouponCode();

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await CouponModel.create(
        [
          {
            code: couponCode,
            description: `Scholarship reward: ${awardedPercent}% off`,
            discountType: "percentage",
            discountValue: awardedPercent,
            // Not course-scoped: a winner spends it on whatever they like.
            applicableType: "all",
            usageLimit: 1,
            userUsageLimit: 1,
            validFrom: now,
            // The winner's real deadline, so the generic validator enforces it
            // and no scholarship-specific expiry check is needed anywhere.
            validUntil: expiresAt,
            isActive: true,
            createdBy: campaign.createdBy,
            sourceScholarshipTestId: campaign._id,
          },
        ],
        { session, ordered: true },
      );

      // No couponId: the coupon is deleted once spent or first found expired,
      // so a pointer guaranteed to dangle is worse than the code snapshot.
      await ScholarshipCouponEntitlementModel.create(
        [
          {
            testId: campaign._id,
            email,
            attemptId,
            awardedPercent,
            couponCode,
            // Frozen here because the campaign is hard-deleted by an admin and
            // a redeemed entitlement outlives it. Without this, a spent reward
            // could not say which campaign paid for the discount.
            campaignSnapshot: {
              title: campaign.title,
              slug: campaign.slug,
              ownerName: campaign.createdByName ?? "",
            },
            issuedAt: now,
            // Stamped, never derived: editing the campaign later must not
            // shorten a deadline this person has already been shown.
            expiresAt,
          },
        ],
        { session, ordered: true },
      );
    });
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    // Two submits raced. The unique index picked a winner, so adopt whatever it
    // awarded rather than handing this caller a second roll.
    const winner = await ScholarshipCouponEntitlementModel.findOne({
      testId: campaign._id,
      email,
    }).lean();
    if (!winner) throw error;
    return {
      expiresAt: winner.expiresAt as Date,
      awardedPercent: winner.awardedPercent as number,
      couponCode: winner.couponCode as string,
    };
  } finally {
    await session.endSession();
  }

  return { expiresAt, awardedPercent, couponCode };
};

/**
 * Built entirely from the entitlement, never from the coupon: the coupon is
 * deleted when spent or first found expired, and this screen still has to
 * name the code and explain the deadline afterwards.
 */
const buildResult = (
  reward: { awardedPercent: number; couponCode: string; expiresAt: Date },
  correctCount: number,
  totalQuestions: number,
): ResultView => ({
  correctCount,
  totalQuestions,
  couponCode: reward.couponCode,
  couponExpiresAt: reward.expiresAt,
  discountPercent: reward.awardedPercent,
  expired: new Date(reward.expiresAt).getTime() < Date.now(),
});

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

  // Scoring never gates the reward: an all-wrong paper earns the same roll.
  const reward = await issueEntitlement(campaign as never, attempt._id, email);

  await bumpDailyStat(campaign._id, "submitted");

  return buildResult(
    reward,
    correctCount,
    attempt.totalQuestions ?? attempt.questionOrder.length,
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

  const attempt = await ScholarshipAttemptModel.findOne({
    testId,
    email,
    status: "submitted",
  })
    .select("correctCount totalQuestions")
    .lean();

  return buildResult(
    {
      awardedPercent: entitlement.awardedPercent as number,
      couponCode: entitlement.couponCode as string,
      expiresAt: entitlement.expiresAt as Date,
    },
    attempt?.correctCount ?? 0,
    attempt?.totalQuestions ?? 0,
  );
};
