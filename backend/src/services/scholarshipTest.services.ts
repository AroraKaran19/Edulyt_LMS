import mongoose from "mongoose";
import crypto from "crypto";
import {
  CouponModel,
  OrderModel,
  ScholarshipAttemptModel,
  ScholarshipCouponEntitlementModel,
  ScholarshipTestDailyStatModel,
  ScholarshipTestModel,
} from "../models";
import { todayIst } from "../utils/ist";
import { AppError } from "../middlewares/error.middleware";
import {
  generateScholarshipCouponCode,
  slugifyCampaignTitle,
  validateCampaignConfig,
} from "../lib/scholarshipTestValidation";
import { ScholarshipTest } from "../types/scholarship";

export interface CreateCampaignInput {
  title: string;
  description?: string;
  questionIds: string[];
  durationMinutes: number;
  attemptsAllowed: number;
  discountPercent: number;
  couponValidForDays: number;
  isActive?: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Outer bound for the shared coupon document.
 *
 * A campaign has no end date: it runs from creation until someone pauses or
 * deletes it, so there is no last-possible-winner to compute from. The real
 * per-person deadline is `expiresAt` on the entitlement, and this exists only
 * because `Coupon.validUntil` is required and the coupons admin page has to
 * render something. Far enough out that it never becomes the binding limit.
 */
const couponEnvelopeUntil = (): Date =>
  new Date(Date.now() + 3650 * DAY_MS);

const toObjectIds = (ids: string[], label: string) => {
  const unique = new Set(ids);
  if (unique.size !== ids.length) {
    throw new AppError(`Duplicate ${label} in the selection`, 400);
  }
  return ids.map((id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(`Invalid ${label}: ${id}`, 400);
    }
    return new mongoose.Types.ObjectId(id);
  });
};

/** Appends a short random suffix until the slug is free. */
const resolveFreeSlug = async (base: string): Promise<string> => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate =
      attempt === 0 ? base : `${base}-${crypto.randomBytes(3).toString("hex")}`;
    const clash = await ScholarshipTestModel.find({ slug: candidate }).lean();
    if (!clash.length) return candidate;
  }
  throw new AppError("Could not derive a free campaign URL, retry", 500);
};

export const createScholarshipTest = async (
  input: CreateCampaignInput,
  actorId: string,
): Promise<ScholarshipTest> => {
  const title = (input.title ?? "").trim();
  if (!title) throw new AppError("Title is required", 400);

  const questionIds = toObjectIds(input.questionIds ?? [], "question id");

  const configError = validateCampaignConfig({
    questionCount: questionIds.length,
    discountPercent: input.discountPercent,
    durationMinutes: input.durationMinutes,
    attemptsAllowed: input.attemptsAllowed,
    couponValidForDays: input.couponValidForDays,
  });
  if (configError) throw new AppError(configError, 400);

  const slug = await resolveFreeSlug(slugifyCampaignTitle(title));
  const actor = new mongoose.Types.ObjectId(actorId);

  let created: ScholarshipTest | undefined;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // The coupon has no dependency on the campaign, so it is written first
      // and back-linked once the campaign has an id.
      const [coupon] = await CouponModel.create(
        [
          {
            code: generateScholarshipCouponCode(),
            description: `Scholarship campaign: ${title}`,
            discountType: "percentage",
            discountValue: input.discountPercent,
            // Not scoped to a course: a winner can spend it on anything.
            applicableType: "all",
            userUsageLimit: 1,
            validFrom: new Date(),
            validUntil: couponEnvelopeUntil(),
            isActive: true,
            createdBy: actor,
          },
        ],
        { session, ordered: true },
      );

      const [test] = await ScholarshipTestModel.create(
        [
          {
            title,
            slug,
            description: (input.description ?? "").trim(),
            questions: questionIds,
            durationMinutes: input.durationMinutes,
            attemptsAllowed: input.attemptsAllowed,
            discountPercent: input.discountPercent,
            couponValidForDays: input.couponValidForDays,
            couponId: coupon._id,
            isActive: input.isActive !== false,
            createdBy: actor,
          },
        ],
        { session, ordered: true },
      );

      await CouponModel.updateOne(
        { _id: coupon._id },
        { $set: { sourceScholarshipTestId: test._id } },
        { session },
      );

      created = test as unknown as ScholarshipTest;
    });
  } finally {
    await session.endSession();
  }

  if (!created) throw new AppError("Could not create the campaign", 500);
  return created;
};

export interface Actor {
  id: string;
  userType: string;
}

export interface ListFilters {
  status?: "live" | "paused";
  search?: string;
  mine?: boolean;
  page?: number;
  limit?: number;
}

export interface UpdateCampaignInput {
  description?: string;
  couponValidForDays?: number;
  isActive?: boolean;
  questions?: string[];
}

/** Marketers only ever see their own work; everyone else sees all of it. */
const isScopedToOwn = (actor: Actor): boolean => actor.userType === "marketer";

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildListFilter = (
  filters: ListFilters,
  actor: Actor,
): Record<string, unknown> => {
  const filter: Record<string, unknown> = {};

  if (isScopedToOwn(actor) || filters.mine) {
    filter.createdBy = new mongoose.Types.ObjectId(actor.id);
  }
  if (filters.status === "live") {
    filter.isActive = true;
  } else if (filters.status === "paused") {
    filter.isActive = false;
  }
  if (filters.search?.trim()) {
    filter.title = { $regex: escapeRegex(filters.search.trim()), $options: "i" };
  }
  return filter;
};

export const listScholarshipTests = async (
  filters: ListFilters,
  actor: Actor,
) => {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const filter = buildListFilter(filters, actor);

  const [items, total] = await Promise.all([
    ScholarshipTestModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ScholarshipTestModel.countDocuments(filter),
  ]);

  return { items, total, page, limit };
};

/**
 * Loads a campaign the actor is allowed to see. A marketer reaching for someone
 * else's campaign gets 404 rather than 403, so the response does not confirm
 * that it exists.
 */
const loadOwned = async (id: string, actor: Actor) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid campaign id", 400);
  }
  const test = await ScholarshipTestModel.findById(id).lean();
  if (!test) throw new AppError("Campaign not found", 404);
  if (isScopedToOwn(actor) && String(test.createdBy) !== String(actor.id)) {
    throw new AppError("Campaign not found", 404);
  }
  return test;
};

/**
 * Loads a campaign the actor is allowed to **delete**.
 *
 * Deletion is owner-only for everybody except a super-admin: an admin may read
 * and edit across the team, but destroying someone else's campaign, its coupon,
 * and its unclaimed entitlements is not something one admin should be able to
 * do to another's work.
 */
const loadDeletable = async (id: string, actor: Actor) => {
  const test = await loadOwned(id, actor);
  if (actor.userType === "super-admin") return test;
  if (String(test.createdBy) !== String(actor.id)) {
    throw new AppError(
      "Only the person who created this campaign, or a super-admin, can delete it",
      403,
    );
  }
  return test;
};

export const getScholarshipTestById = async (id: string, actor: Actor) => {
  const test = await loadOwned(id, actor);
  // The code, not the id, is what the detail view shows and what support quotes
  // to a candidate, so it is resolved here rather than by a second round trip.
  const [attemptCount, coupon] = await Promise.all([
    ScholarshipAttemptModel.countDocuments({ testId: test._id }),
    CouponModel.findById(test.couponId).select("code").lean(),
  ]);
  return { ...test, attemptCount, couponCode: coupon?.code ?? "" };
};

export const updateScholarshipTest = async (
  id: string,
  patch: UpdateCampaignInput,
  actor: Actor,
) => {
  const test = await loadOwned(id, actor);

  const attemptCount = await ScholarshipAttemptModel.countDocuments({
    testId: test._id,
  });
  if (attemptCount > 0 && patch.questions !== undefined) {
    throw new AppError(
      "This campaign has already been attempted, so its questions are locked",
      409,
    );
  }

  const couponValidForDays =
    patch.couponValidForDays !== undefined
      ? patch.couponValidForDays
      : test.couponValidForDays;
  const questionIds =
    patch.questions !== undefined
      ? toObjectIds(patch.questions, "question id")
      : (test.questions as mongoose.Types.ObjectId[]);
  const configError = validateCampaignConfig({
    questionCount: questionIds.length,
    discountPercent: test.discountPercent,
    durationMinutes: test.durationMinutes,
    attemptsAllowed: test.attemptsAllowed,
    couponValidForDays,
  });
  if (configError) throw new AppError(configError, 400);

  const $set: Record<string, unknown> = {};
  if (patch.description !== undefined) {
    $set.description = patch.description.trim();
  }
  if (patch.couponValidForDays !== undefined) {
    $set.couponValidForDays = couponValidForDays;
  }
  if (patch.isActive !== undefined) $set.isActive = patch.isActive;
  if (patch.questions !== undefined) $set.questions = questionIds;

  const updated = await ScholarshipTestModel.findByIdAndUpdate(
    test._id,
    { $set },
    { new: true, runValidators: true },
  ).lean();
  if (!updated) throw new AppError("Campaign not found", 404);

  // Entitlements already issued keep the deadline they were given; a longer
  // grace period only applies to future winners.
  if (patch.isActive !== undefined) {
    await CouponModel.updateOne(
      { _id: test.couponId },
      { $set: { isActive: patch.isActive } },
    );
  }

  return updated;
};

export interface DeletionPreview {
  blocked: boolean;
  blockedReason: string | null;
  pendingCheckouts: number;
  unclaimedEntitlements: number;
  redemptions: number;
  attempts: number;
}

/**
 * Gathers the counts the confirm dialog shows and decides whether deletion is
 * safe. Shared by the preview endpoint and the delete itself, so the dialog and
 * the action can never disagree about the rules.
 */
type CampaignRef = {
  // `.lean()` hands back ObjectIds while the interface declares `_id` as a
  // string, so both forms reach here. Mongoose casts either one on the way into
  // a query, and nothing below compares them by identity.
  _id: mongoose.Types.ObjectId | string;
  couponId: mongoose.Types.ObjectId | string;
};

const gatherDeletionState = async (
  test: CampaignRef,
): Promise<DeletionPreview> => {
  const coupon = await CouponModel.findById(test.couponId).lean();

  const [pendingCheckouts, unclaimedEntitlements, redemptions, attempts] =
    await Promise.all([
      coupon?.code
        ? OrderModel.countDocuments({
            couponCode: coupon.code,
            paymentStatus: "pending",
          })
        : Promise.resolve(0),
      ScholarshipCouponEntitlementModel.countDocuments({
        testId: test._id,
        redeemedAt: null,
      }),
      ScholarshipCouponEntitlementModel.countDocuments({
        testId: test._id,
        redeemedAt: { $ne: null },
      }),
      ScholarshipAttemptModel.countDocuments({ testId: test._id }),
    ]);

  const blocked = pendingCheckouts > 0;
  return {
    blocked,
    blockedReason: blocked
      ? `${pendingCheckouts} ${
          pendingCheckouts === 1 ? "checkout is" : "checkouts are"
        } in progress with coupons from this campaign`
      : null,
    pendingCheckouts,
    unclaimedEntitlements,
    redemptions,
    attempts,
  };
};

export const previewScholarshipTestDeletion = async (
  id: string,
  actor: Actor,
): Promise<DeletionPreview> => {
  const test = await loadDeletable(id, actor);
  return gatherDeletionState({ _id: test._id, couponId: test.couponId });
};

export const deleteScholarshipTest = async (
  id: string,
  actor: Actor,
): Promise<void> => {
  const test = await loadDeletable(id, actor);
  const state = await gatherDeletionState({
    _id: test._id,
    couponId: test.couponId,
  });

  if (state.blocked) {
    throw new AppError(
      state.blockedReason ?? "Cannot delete this campaign",
      409,
    );
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (state.redemptions > 0) {
        // Historical orders resolve their couponCode through this document, so
        // a redeemed coupon is retired rather than removed.
        await CouponModel.updateOne(
          { _id: test.couponId },
          { $set: { isActive: false } },
          { session },
        );
      } else {
        await CouponModel.deleteOne({ _id: test.couponId }, { session });
      }

      await ScholarshipCouponEntitlementModel.deleteMany(
        { testId: test._id, redeemedAt: null },
        { session },
      );

      // Attempts are detached, not deleted: their snapshot is the campaign's
      // lead and conversion history.
      await ScholarshipAttemptModel.updateMany(
        { testId: test._id },
        { $set: { testId: null } },
        { session },
      );

      await ScholarshipTestModel.findByIdAndDelete(test._id, { session });
    });
  } finally {
    await session.endSession();
  }
};

/**
 * A campaign is live the moment it is created and stays live until someone
 * pauses or deletes it. There is no schedule, so there is nothing between these
 * two states.
 */
export type PublicCampaignState = "live" | "paused";

export interface PublicCampaign {
  title: string;
  slug: string;
  description: string;
  durationMinutes: number;
  attemptsAllowed: number;
  questionCount: number;
  couponValidForDays: number;
  state: PublicCampaignState;
}

/**
 * The anonymous-reachable view of a campaign.
 *
 * Built by naming every field explicitly rather than by deleting a few from the
 * document: `questions` is the paper and `couponId` is the reward, and a
 * spread-then-omit would leak either one the moment a field is added upstream.
 *
 * `discountPercent` is deliberately absent. The size of the reward is what the
 * candidate is playing for, so it is revealed only once they have finished, by
 * the result endpoint. Returning it here would put it in devtools before the
 * first question and turn an earned reward into a posted price.
 */
export const getPublicCampaignBySlug = async (
  slug: string,
): Promise<PublicCampaign> => {
  const campaign = await ScholarshipTestModel.findOne({
    slug: String(slug ?? "").trim().toLowerCase(),
  }).lean();
  if (!campaign) throw new AppError("Campaign not found", 404);

  return {
    title: campaign.title,
    slug: campaign.slug,
    description: campaign.description ?? "",
    durationMinutes: campaign.durationMinutes,
    attemptsAllowed: campaign.attemptsAllowed,
    questionCount: (campaign.questions as unknown[]).length,
    couponValidForDays: campaign.couponValidForDays,
    state: campaign.isActive ? "live" : "paused",
  };
};

/**
 * Best-effort top-of-funnel counter, resolved from the slug because the public
 * campaign view deliberately withholds `_id`.
 *
 * Never throws: an unknown slug or a mongo hiccup is a silent no-op, since a
 * reporting counter must not fail a page load.
 */
export const recordCampaignView = async (slug: string): Promise<void> => {
  try {
    const campaign = await ScholarshipTestModel.findOne({
      slug: String(slug ?? "").trim().toLowerCase(),
    })
      .select("_id")
      .lean();
    if (!campaign) return;
    await ScholarshipTestDailyStatModel.updateOne(
      { testId: campaign._id, day: todayIst() },
      { $inc: { views: 1 } },
      { upsert: true },
    );
  } catch {
    // Deliberately swallowed. See the doc comment.
  }
};
