import crypto from "crypto";
import mongoose from "mongoose";
import { ReferralCommissionConfigModel } from "../models/referralCommissionConfig.schema";
import { ReferralProfileModel } from "../models/referralProfile.schema";
import { ReferralSaleModel } from "../models/referralSale.schema";
import { ReferralWithdrawalModel } from "../models/referralWithdrawal.schema";
import { UserModel } from "../models";
import { AppError } from "../middlewares/error.middleware";
import { queueReferralUsedEmail } from "./referralMail.services";
import { BRAND_MAIL, asBrand, type Brand } from "../constants/brands";
import type {
  ReferralCommissionTier,
  ReferralSale,
  ReferralWithdrawalStatus,
} from "../types/referral";

// ─── Code generation ─────────────────────────────────────────────────────────

/** Avoids visually-ambiguous chars (0/O/1/I/L). */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;
const CODE_MAX_RETRIES = 6;

function generateReferralCode(): string {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─── Profile (lazy-create) ───────────────────────────────────────────────────

/**
 * Returns the user's referral profile on a brand, creating it (with a unique
 * code) on the first call. One profile per user per brand. Retries on the rare
 * unique-code collision.
 */
export async function getOrCreateReferralProfileForUser(
  userId: mongoose.Types.ObjectId,
  brand: Brand,
) {
  const existing = await ReferralProfileModel.findOne({ userId, brand }).lean();
  if (existing) return existing;

  for (let attempt = 0; attempt < CODE_MAX_RETRIES; attempt++) {
    try {
      const doc = await ReferralProfileModel.create({
        userId,
        brand,
        code: generateReferralCode(),
      });
      return doc.toObject();
    } catch (err: unknown) {
      const e = err as { code?: number; keyPattern?: Record<string, unknown> };
      if (e.code === 11000) {
        // Either another concurrent call won the { userId, brand } key, or the
        // code collided. Re-read the profile; otherwise retry with a fresh code.
        if (e.keyPattern && "userId" in e.keyPattern) {
          const raced = await ReferralProfileModel.findOne({ userId, brand }).lean();
          if (raced) return raced;
        }
        continue;
      }
      throw err;
    }
  }
  throw new AppError(
    "Failed to generate a unique referral code, please retry.",
    500,
  );
}

// ─── Commission tier math ────────────────────────────────────────────────────

/**
 * Highest tier whose `thresholdSales <= activeCount`. Returns 0% when no tier
 * is configured or the count hasn't reached any threshold.
 */
function pickCurrentTierPct(
  activeCount: number,
  tiers: ReferralCommissionTier[],
): number {
  const sorted = [...tiers].sort(
    (a, b) => a.thresholdSales - b.thresholdSales,
  );
  let pct = 0;
  for (const t of sorted) {
    if (activeCount >= t.thresholdSales) pct = t.commissionPercent;
    else break;
  }
  return pct;
}

async function loadCommissionTiers(): Promise<ReferralCommissionTier[]> {
  const cfg = await ReferralCommissionConfigModel.findOne({}).lean();
  return (cfg?.tiers ?? []).map((t) => ({
    thresholdSales: t.thresholdSales,
    commissionPercent: t.commissionPercent,
  }));
}

interface BalanceSnapshot {
  activeCount: number;
  /** Rate the referrer's NEXT sale will earn. Display only — earned commission
   *  is frozen per-sale and this value never touches a balance. */
  currentTierPct: number;
  lifetimeEarned: number;
  heldOrPaid: number;
  available: number;
}

/**
 * Live balance snapshot. `lifetimeEarned` is the sum of the commission frozen
 * onto each active sale at the time it was made, so it is immune to later tier
 * config edits and is monotonic (it can only fall via a `reversed` refund).
 */
export async function computeReferralBalance(
  userId: mongoose.Types.ObjectId,
  brand: Brand,
): Promise<BalanceSnapshot> {
  const [salesAgg, tiers, outflowAgg] = await Promise.all([
    // Rides the { referrerUserId, brand, status, createdAt } index.
    ReferralSaleModel.aggregate<{ _id: null; count: number; earned: number }>([
      { $match: { referrerUserId: userId, brand, status: "active" } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          earned: { $sum: "$commissionAmount" },
        },
      },
    ]),
    loadCommissionTiers(),
    ReferralWithdrawalModel.aggregate<{ _id: null; sum: number }>([
      {
        $match: {
          referrerUserId: userId,
          brand,
          status: { $in: ["pending", "processing", "success"] },
        },
      },
      { $group: { _id: null, sum: { $sum: "$amount" } } },
    ]),
  ]);

  const activeCount = Number(salesAgg[0]?.count ?? 0);
  const lifetimeEarned = Number(salesAgg[0]?.earned ?? 0);
  // The next sale is rated at activeCount + 1 — mirror that here so the figure
  // we show is the one they will actually get.
  const currentTierPct = pickCurrentTierPct(activeCount + 1, tiers);
  const heldOrPaid = Number(outflowAgg[0]?.sum ?? 0);
  const available = lifetimeEarned - heldOrPaid;

  return {
    activeCount,
    currentTierPct,
    lifetimeEarned: round2(lifetimeEarned),
    heldOrPaid: round2(heldOrPaid),
    available: round2(available),
  };
}

// ─── User overview ───────────────────────────────────────────────────────────

export interface ReferralRecentSaleRow {
  _id: string;
  courseName: string;
  buyerName: string;
  amount: number;
  commission: number;
  status: ReferralSale["status"];
  createdAt: string;
}

/** Maps a lean `ReferralSale` doc to the row shape shared by the overview and
 *  the paginated sales list. `commission` reads the frozen `commissionAmount`
 *  — never re-derived from the live tier config. */
function toSaleRow(r: {
  _id: unknown;
  amount?: number;
  commissionAmount?: number;
  status: ReferralSale["status"];
  courseName?: string;
  buyerName?: string;
  createdAt?: Date;
}): ReferralRecentSaleRow {
  return {
    _id: String(r._id),
    courseName: String(r.courseName ?? ""),
    buyerName: String(r.buyerName ?? ""),
    amount: Number(r.amount ?? 0),
    commission:
      r.status === "active" ? round2(Number(r.commissionAmount ?? 0)) : 0,
    status: r.status,
    createdAt: (r.createdAt ?? new Date()).toISOString(),
  };
}

export interface ReferralOverviewResult {
  code: string;
  upiId: string;
  tiers: ReferralCommissionTier[];
  activeCount: number;
  currentTierPct: number;
  lifetimeEarned: number;
  heldOrPaid: number;
  availableBalance: number;
  recentSales: ReferralRecentSaleRow[];
}

export async function getReferralOverviewForUser(
  userId: mongoose.Types.ObjectId,
  brand: Brand,
): Promise<ReferralOverviewResult> {
  const profile = await getOrCreateReferralProfileForUser(userId, brand);
  const balance = await computeReferralBalance(userId, brand);
  const recent = await ReferralSaleModel.find({ referrerUserId: userId, brand })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const recentSales: ReferralRecentSaleRow[] = recent.map(toSaleRow);

  return {
    code: profile.code,
    upiId: profile.upiId ?? "",
    tiers: await loadCommissionTiers(),
    activeCount: balance.activeCount,
    currentTierPct: balance.currentTierPct,
    lifetimeEarned: balance.lifetimeEarned,
    heldOrPaid: balance.heldOrPaid,
    availableBalance: balance.available,
    recentSales,
  };
}

export async function setReferralUpiForUser(
  userId: mongoose.Types.ObjectId,
  brand: Brand,
  upiIdRaw: unknown,
): Promise<{ upiId: string }> {
  const upiId = typeof upiIdRaw === "string" ? upiIdRaw.trim() : "";
  if (!upiId) {
    throw new AppError("UPI ID is required", 400);
  }
  if (!/^[\w.\-]+@[\w]+$/.test(upiId)) {
    throw new AppError(
      "UPI ID must look like name@bank (only basic pattern is checked).",
      400,
    );
  }
  await getOrCreateReferralProfileForUser(userId, brand);
  await ReferralProfileModel.updateOne({ userId, brand }, { $set: { upiId } });
  return { upiId };
}

// ─── Code validation (cart-time + order-success) ─────────────────────────────

export interface ValidateReferralCodeResult {
  valid: boolean;
  referrerName?: string;
  reason?: "not-found" | "self" | "empty" | "other-brand";
  /** Set with `other-brand`: where the code can be used. */
  codeBrand?: Brand;
  message?: string;
  /** Buyer discount % to apply at checkout when this code is valid. */
  buyerDiscountPercent?: number;
}

/** Configured buyer-side discount %, clamped to [0, 100]. 0 when unset. */
export async function getReferralBuyerDiscountPercent(): Promise<number> {
  const cfg = await ReferralCommissionConfigModel.findOne({})
    .select("buyerDiscountPercent")
    .lean();
  const pct = Number(cfg?.buyerDiscountPercent ?? 0);
  if (!Number.isFinite(pct)) return 0;
  return Math.min(100, Math.max(0, pct));
}

export const otherBrandReferralMessage = (codeBrand: Brand): string =>
  `This referral code belongs to ${BRAND_MAIL[codeBrand].fromName} and cannot be used here.`;

export async function validateReferralCode(
  codeRaw: unknown,
  buyerUserId: mongoose.Types.ObjectId,
  brand: Brand,
): Promise<ValidateReferralCodeResult> {
  const code =
    typeof codeRaw === "string" ? codeRaw.trim().toUpperCase() : "";
  if (!code) return { valid: false, reason: "empty" };

  const profile = await ReferralProfileModel.findOne({ code })
    .select("userId code brand")
    .lean();
  if (!profile) return { valid: false, reason: "not-found" };

  // Codes are globally unique, so the code alone says which brand it pays on.
  const codeBrand = asBrand((profile as { brand?: unknown }).brand);
  if (codeBrand !== brand) {
    return {
      valid: false,
      reason: "other-brand",
      codeBrand,
      message: otherBrandReferralMessage(codeBrand),
    };
  }

  if (String(profile.userId) === String(buyerUserId)) {
    return { valid: false, reason: "self" };
  }

  const user = await UserModel.findById(profile.userId)
    .select("firstName lastName email")
    .lean();
  const name =
    `${(user as { firstName?: string } | null)?.firstName ?? ""} ${
      (user as { lastName?: string } | null)?.lastName ?? ""
    }`.trim() ||
    String((user as { email?: string } | null)?.email ?? "Referrer");
  const buyerDiscountPercent = await getReferralBuyerDiscountPercent();
  return { valid: true, referrerName: name, buyerDiscountPercent };
}

// ─── Sales (created from order-success hook) ─────────────────────────────────

/**
 * Records a `ReferralSale` for a completed course order, when the order
 * carried a valid referral code from someone other than the buyer. The
 * commission rate live at this instant is frozen onto the row and is never
 * recalculated. Idempotent: the `orderId` unique index swallows duplicate calls.
 */
export async function recordReferralSaleForOrder(params: {
  orderId: mongoose.Types.ObjectId | string;
  code: string;
  buyerUserId: mongoose.Types.ObjectId | string;
  courseId?: mongoose.Types.ObjectId | string;
  courseName?: string;
  buyerName?: string;
  amount: number;
  /** The order's brand. A sale only ever credits the balance on that brand. */
  brand: Brand;
}): Promise<void> {
  const code = String(params.code ?? "").trim().toUpperCase();
  if (!code) return;

  const profile = await ReferralProfileModel.findOne({ code })
    .select("userId code brand")
    .lean();
  if (!profile) return;
  if (String(profile.userId) === String(params.buyerUserId)) return;
  // Checkout already refuses this; kept so a replayed order cannot cross brands.
  if (asBrand((profile as { brand?: unknown }).brand) !== params.brand) return;

  // Rate this sale against the referrer's count *including* this sale, so a
  // `1+` tier pays out on their very first one.
  const [tiers, priorActiveCount] = await Promise.all([
    loadCommissionTiers(),
    ReferralSaleModel.countDocuments({
      referrerUserId: profile.userId,
      brand: params.brand,
      status: "active",
    }),
  ]);
  const amount = Math.max(0, Number(params.amount ?? 0));
  const commissionPercent = pickCurrentTierPct(priorActiveCount + 1, tiers);
  const commissionAmount = round2(amount * (commissionPercent / 100));

  try {
    await ReferralSaleModel.create({
      referrerUserId: profile.userId,
      buyerUserId: new mongoose.Types.ObjectId(String(params.buyerUserId)),
      orderId: new mongoose.Types.ObjectId(String(params.orderId)),
      courseId: params.courseId
        ? new mongoose.Types.ObjectId(String(params.courseId))
        : undefined,
      courseName: params.courseName ?? "",
      buyerName: params.buyerName ?? "",
      amount,
      commissionPercent,
      commissionAmount,
      code,
      brand: params.brand,
      status: "active",
    });
  } catch (err: unknown) {
    const e = err as { code?: number };
    if (e.code === 11000) return; // duplicate orderId — already recorded
    throw err;
  }

  // Only past the create, so the duplicate-orderId path above cannot mail the
  // same reward twice. The unique index is what makes that guarantee, not this
  // call site.
  queueReferralUsedEmail({
    referrerUserId: profile.userId,
    buyerName: params.buyerName,
    commissionAmount,
    brand: params.brand,
  });
}

export interface PaginatedReferralSales {
  items: ReferralRecentSaleRow[];
  total: number;
  page: number;
  totalPages: number;
}

export async function listReferralSalesForUser(
  userId: mongoose.Types.ObjectId,
  brand: Brand,
  page: number,
  limit: number,
): Promise<PaginatedReferralSales> {
  const p = Math.max(1, Math.floor(page));
  const l = Math.min(100, Math.max(1, Math.floor(limit)));

  const filter = { referrerUserId: userId, brand };
  const [docs, total] = await Promise.all([
    ReferralSaleModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l)
      .lean(),
    ReferralSaleModel.countDocuments(filter),
  ]);

  const items: ReferralRecentSaleRow[] = docs.map(toSaleRow);

  return {
    items,
    total,
    page: p,
    totalPages: Math.max(1, Math.ceil(total / l)),
  };
}

// ─── Withdrawals ─────────────────────────────────────────────────────────────

const MIN_WITHDRAWAL_AMOUNT = 500;

export interface WithdrawalRow {
  _id: string;
  brand: Brand;
  amount: number;
  upiIdSnapshot: string;
  status: ReferralWithdrawalStatus;
  notes?: string;
  decidedAt: string | null;
  createdAt: string;
}

export interface AdminWithdrawalRow extends WithdrawalRow {
  user: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface PaginatedWithdrawals<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

export async function createReferralWithdrawalForUser(
  userId: mongoose.Types.ObjectId,
  brand: Brand,
  amountRaw: unknown,
): Promise<WithdrawalRow> {
  const amount = Math.floor(Number(amountRaw));
  if (!Number.isFinite(amount) || amount < MIN_WITHDRAWAL_AMOUNT) {
    throw new AppError(
      `Minimum withdrawal amount is ₹${MIN_WITHDRAWAL_AMOUNT}.`,
      400,
    );
  }

  const profile = await getOrCreateReferralProfileForUser(userId, brand);
  const upi = String(profile.upiId ?? "").trim();
  if (!upi) {
    throw new AppError(
      "Set your UPI ID before requesting a withdrawal.",
      400,
    );
  }

  const balance = await computeReferralBalance(userId, brand);
  if (amount > balance.available) {
    throw new AppError(
      `Requested amount exceeds your available balance (₹${balance.available}).`,
      400,
    );
  }

  const created = await ReferralWithdrawalModel.create({
    referrerUserId: userId,
    brand,
    amount,
    upiIdSnapshot: upi,
    status: "pending",
  });

  return serializeWithdrawal(created.toObject());
}

function serializeWithdrawal(input: unknown): WithdrawalRow {
  const doc = input as Record<string, unknown>;
  return {
    _id: String(doc._id),
    brand: asBrand(doc.brand),
    amount: Number(doc.amount ?? 0),
    upiIdSnapshot: String(doc.upiIdSnapshot ?? ""),
    status: String(doc.status ?? "pending") as ReferralWithdrawalStatus,
    notes:
      typeof doc.notes === "string" && doc.notes.length > 0
        ? doc.notes
        : undefined,
    decidedAt:
      doc.decidedAt instanceof Date
        ? doc.decidedAt.toISOString()
        : doc.decidedAt
          ? new Date(doc.decidedAt as string).toISOString()
          : null,
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : doc.createdAt
          ? new Date(doc.createdAt as string).toISOString()
          : new Date().toISOString(),
  };
}

export async function listWithdrawalsForUser(
  userId: mongoose.Types.ObjectId,
  brand: Brand,
  page: number,
  limit: number,
): Promise<PaginatedWithdrawals<WithdrawalRow>> {
  const p = Math.max(1, Math.floor(page));
  const l = Math.min(100, Math.max(1, Math.floor(limit)));

  const filter = { referrerUserId: userId, brand };
  const [docs, total] = await Promise.all([
    ReferralWithdrawalModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l)
      .lean(),
    ReferralWithdrawalModel.countDocuments(filter),
  ]);

  return {
    items: docs.map(serializeWithdrawal),
    total,
    page: p,
    totalPages: Math.max(1, Math.ceil(total / l)),
  };
}

// ─── Admin: config ───────────────────────────────────────────────────────────

export async function getReferralCommissionConfigAdmin(): Promise<{
  tiers: ReferralCommissionTier[];
  buyerDiscountPercent: number;
  updatedAt: string | null;
}> {
  const cfg = await ReferralCommissionConfigModel.findOne({}).lean();
  return {
    tiers: (cfg?.tiers ?? []).map((t) => ({
      thresholdSales: t.thresholdSales,
      commissionPercent: t.commissionPercent,
    })),
    buyerDiscountPercent: Number(cfg?.buyerDiscountPercent ?? 0),
    updatedAt: cfg?.updatedAt ? new Date(cfg.updatedAt).toISOString() : null,
  };
}

export async function updateReferralCommissionConfigAdmin(
  rawTiers: unknown,
  rawBuyerDiscountPercent: unknown,
  updatedBy: mongoose.Types.ObjectId,
): Promise<{
  tiers: ReferralCommissionTier[];
  buyerDiscountPercent: number;
  updatedAt: string | null;
}> {
  if (!Array.isArray(rawTiers)) {
    throw new AppError("tiers must be an array", 400);
  }

  const buyerDiscountPercent = Number(rawBuyerDiscountPercent ?? 0);
  if (
    !Number.isFinite(buyerDiscountPercent) ||
    buyerDiscountPercent < 0 ||
    buyerDiscountPercent > 100
  ) {
    throw new AppError(
      "buyerDiscountPercent must be between 0 and 100",
      400,
    );
  }
  const cleaned: ReferralCommissionTier[] = rawTiers.map((row, i) => {
    const threshold = Math.floor(
      Number((row as { thresholdSales?: unknown })?.thresholdSales),
    );
    const pct = Number(
      (row as { commissionPercent?: unknown })?.commissionPercent,
    );
    if (!Number.isFinite(threshold) || threshold < 1) {
      throw new AppError(
        `Tier ${i + 1}: thresholdSales must be an integer >= 1`,
        400,
      );
    }
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      throw new AppError(
        `Tier ${i + 1}: commissionPercent must be between 0 and 100`,
        400,
      );
    }
    return { thresholdSales: threshold, commissionPercent: pct };
  });

  cleaned.sort((a, b) => a.thresholdSales - b.thresholdSales);
  for (let i = 1; i < cleaned.length; i++) {
    if (cleaned[i].thresholdSales === cleaned[i - 1].thresholdSales) {
      throw new AppError(
        `Duplicate thresholdSales: ${cleaned[i].thresholdSales}`,
        400,
      );
    }
  }

  const updated = await ReferralCommissionConfigModel.findOneAndUpdate(
    {},
    { $set: { tiers: cleaned, buyerDiscountPercent, updatedBy } },
    { new: true, upsert: true },
  ).lean();

  return {
    tiers: (updated?.tiers ?? []).map((t) => ({
      thresholdSales: t.thresholdSales,
      commissionPercent: t.commissionPercent,
    })),
    buyerDiscountPercent: Number(updated?.buyerDiscountPercent ?? 0),
    updatedAt: updated?.updatedAt
      ? new Date(updated.updatedAt).toISOString()
      : null,
  };
}

// ─── Admin: withdrawals ──────────────────────────────────────────────────────

const ESCAPE_REGEX = (s: string) =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function listAllReferralWithdrawalsAdmin(opts: {
  status?: ReferralWithdrawalStatus;
  q?: string;
  brand?: Brand;
  page: number;
  limit: number;
}): Promise<PaginatedWithdrawals<AdminWithdrawalRow>> {
  const p = Math.max(1, Math.floor(opts.page));
  const l = Math.min(100, Math.max(1, Math.floor(opts.limit)));

  const filter: Record<string, unknown> = {};
  if (opts.status) filter.status = opts.status;
  if (opts.brand) filter.brand = opts.brand;

  const q = (opts.q ?? "").trim();
  if (q) {
    const rx = new RegExp(ESCAPE_REGEX(q), "i");
    const users = await UserModel.find({
      $or: [{ firstName: rx }, { lastName: rx }, { email: rx }],
    })
      .select("_id")
      .lean();
    filter.referrerUserId = { $in: users.map((u) => u._id) };
  }

  const [docs, total] = await Promise.all([
    ReferralWithdrawalModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l)
      .lean(),
    ReferralWithdrawalModel.countDocuments(filter),
  ]);

  const userIds = [
    ...new Set(docs.map((d) => String(d.referrerUserId))),
  ];
  const users = await UserModel.find({ _id: { $in: userIds } })
    .select("_id firstName lastName email")
    .lean();
  const userMap = new Map<
    string,
    { name: string; email: string }
  >(
    users.map((u) => [
      String(u._id),
      {
        name:
          `${(u as { firstName?: string }).firstName ?? ""} ${
            (u as { lastName?: string }).lastName ?? ""
          }`.trim() || String((u as { email?: string }).email ?? ""),
        email: String((u as { email?: string }).email ?? ""),
      },
    ]),
  );

  const items: AdminWithdrawalRow[] = docs.map((d) => {
    const base = serializeWithdrawal(d);
    const u = userMap.get(String(d.referrerUserId));
    return {
      ...base,
      user: {
        _id: String(d.referrerUserId),
        name: u?.name ?? "(unknown user)",
        email: u?.email ?? "",
      },
    };
  });

  return {
    items,
    total,
    page: p,
    totalPages: Math.max(1, Math.ceil(total / l)),
  };
}

const ALLOWED_TRANSITIONS: Record<
  ReferralWithdrawalStatus,
  ReferralWithdrawalStatus[]
> = {
  pending: ["processing", "rejected"],
  processing: ["success", "rejected"],
  success: [],
  rejected: [],
};

export async function transitionReferralWithdrawalAdmin(
  id: string,
  nextStatusRaw: unknown,
  adminUserId: mongoose.Types.ObjectId,
  notesRaw: unknown,
): Promise<AdminWithdrawalRow> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid withdrawal id", 400);
  }
  const VALID = ["pending", "processing", "success", "rejected"] as const;
  const nextStatus = String(nextStatusRaw ?? "");
  if (!(VALID as readonly string[]).includes(nextStatus)) {
    throw new AppError("Invalid status", 400);
  }
  const ns = nextStatus as ReferralWithdrawalStatus;

  const doc = await ReferralWithdrawalModel.findById(id);
  if (!doc) throw new AppError("Withdrawal request not found", 404);

  const current = String(doc.status) as ReferralWithdrawalStatus;
  if (!ALLOWED_TRANSITIONS[current].includes(ns)) {
    throw new AppError(
      `Cannot move withdrawal from "${current}" to "${ns}".`,
      400,
    );
  }

  doc.set("status", ns);
  doc.set("decidedAt", new Date());
  doc.set("decidedBy", adminUserId);
  if (typeof notesRaw === "string" && notesRaw.trim()) {
    doc.set("notes", notesRaw.trim());
  }
  await doc.save();

  const userInfo = await UserModel.findById(doc.referrerUserId)
    .select("_id firstName lastName email")
    .lean();
  const name = userInfo
    ? `${(userInfo as { firstName?: string }).firstName ?? ""} ${
        (userInfo as { lastName?: string }).lastName ?? ""
      }`.trim() ||
        String((userInfo as { email?: string }).email ?? "")
    : "(unknown user)";

  return {
    ...serializeWithdrawal(doc.toObject()),
    user: {
      _id: String(doc.referrerUserId),
      name,
      email: String((userInfo as { email?: string } | null)?.email ?? ""),
    },
  };
}
