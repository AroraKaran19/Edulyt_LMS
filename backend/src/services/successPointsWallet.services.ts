import mongoose, { type ClientSession } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { StudentModel } from "../models";
import { AppError } from "../middlewares/error.middleware";
import { getPointsSettings } from "./pointsSettings.services";
import {
  creditLots,
  debitLots,
  expiryFromDays,
  istMonthKey,
  nextExpiringLot,
  reconcileLots,
  splitExpiredLots,
  type SuccessPointLot,
} from "../lib/successPointLots";
import type { SuccessPointTransaction } from "../types/user";

export type WalletState = {
  balance: number;
  lots: SuccessPointLot[];
  transferMonth?: string;
  transferredThisMonth: number;
};

export type WalletChange = {
  delta: number;
  lots: SuccessPointLot[];
  history: SuccessPointTransaction[];
  set?: Record<string, unknown>;
};

type WalletDoc = {
  _id: mongoose.Types.ObjectId;
  successPoints?: number;
  successPointsLots?: SuccessPointLot[];
  successPointsVersion?: number;
  successPointsTransferMonth?: string;
  successPointsTransferredThisMonth?: number;
};

const WALLET_FIELDS =
  "successPoints successPointsLots successPointsVersion successPointsTransferMonth successPointsTransferredThisMonth";

const MAX_ATTEMPTS = 5;

// Labelled transient so session.withTransaction re-runs the whole callback.
function versionConflict(): Error {
  const err = new mongoose.mongo.MongoError("Wallet changed during write");
  err.addErrorLabel("TransientTransactionError");
  return err;
}

function toState(doc: WalletDoc): WalletState {
  const balance = Number(doc.successPoints ?? 0);
  return {
    balance,
    lots: reconcileLots(doc.successPointsLots ?? [], balance),
    transferMonth: doc.successPointsTransferMonth,
    transferredThisMonth: Number(doc.successPointsTransferredThisMonth ?? 0),
  };
}

/** Sole writer of `successPoints` and its lots; `plan` throws to abort, returns null to skip. */
export async function mutateWallet(
  userId: string | mongoose.Types.ObjectId,
  plan: (state: WalletState) => WalletChange | null,
  session?: ClientSession,
): Promise<{ balance: number } | null> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const doc = await StudentModel.findById(userId)
      .select(WALLET_FIELDS)
      .session(session ?? null)
      .lean<WalletDoc | null>();
    if (!doc) throw new AppError("Student account not found", 404);

    const state = toState(doc);
    const change = plan(state);
    if (!change) return null;

    const version = Number(doc.successPointsVersion ?? 0);
    const updated = await StudentModel.findOneAndUpdate(
      {
        _id: doc._id,
        successPointsVersion: version === 0 ? { $in: [0, null] } : version,
      },
      {
        $inc: { successPoints: change.delta, successPointsVersion: 1 },
        $set: {
          ...change.set,
          successPointsLots: reconcileLots(
            change.lots,
            state.balance + change.delta,
          ),
        },
        ...(change.history.length
          ? { $push: { successPointsHistory: { $each: change.history } } }
          : {}),
      },
      { new: true, session, projection: { successPoints: 1 } },
    ).lean<{ successPoints?: number } | null>();

    if (updated) return { balance: Number(updated.successPoints ?? 0) };
    if (session) throw versionConflict();
  }
  throw new AppError("Your points balance is busy, please try again", 409);
}

/** Expiry for a new credit under the admin's global window. */
export async function defaultCreditExpiry(now = new Date()): Promise<Date | null> {
  const { successPointsExpiryDays } = await getPointsSettings();
  return expiryFromDays(successPointsExpiryDays, now);
}

export function creditWallet(
  userId: string | mongoose.Types.ObjectId,
  points: number,
  expiresAt: Date | null,
  tx: SuccessPointTransaction,
  session?: ClientSession,
) {
  return mutateWallet(
    userId,
    (s) => ({
      delta: points,
      lots: creditLots(s.lots, s.balance, [{ points, expiresAt }]),
      history: [tx],
    }),
    session,
  );
}

/** May take the balance negative; callers that must not overdraw check first. */
export function debitWallet(
  userId: string | mongoose.Types.ObjectId,
  points: number,
  tx: SuccessPointTransaction,
  session?: ClientSession,
) {
  return mutateWallet(
    userId,
    (s) => ({
      delta: -points,
      lots: debitLots(s.lots, points).lots,
      history: [tx],
    }),
    session,
  );
}

export async function getWalletSummary(userId: string): Promise<{
  balance: number;
  nextExpiry: { points: number; expiresAt: Date } | null;
  transfer: { monthlyLimit: number; sentThisMonth: number; remainingThisMonth: number | null };
}> {
  const [doc, settings] = await Promise.all([
    StudentModel.findById(userId).select(WALLET_FIELDS).lean<WalletDoc | null>(),
    getPointsSettings(),
  ]);
  if (!doc) throw new AppError("Account not found", 404);

  const state = toState(doc);
  const next = nextExpiringLot(state.lots);
  const limit = settings.successPointsMonthlyTransferLimit;
  const sentThisMonth =
    state.transferMonth === istMonthKey() ? state.transferredThisMonth : 0;

  return {
    balance: state.balance,
    nextExpiry:
      next?.expiresAt ? { points: next.points, expiresAt: next.expiresAt } : null,
    transfer: {
      monthlyLimit: limit,
      sentThisMonth,
      remainingThisMonth: limit > 0 ? Math.max(0, limit - sentThisMonth) : null,
    },
  };
}

const EXPIRY_BATCH = 25;

/** Nightly sweep: drops lots past `expiresAt` and records one `expired` entry per wallet. */
export async function expireSuccessPoints(
  now = new Date(),
): Promise<{ wallets: number; points: number; failed: number }> {
  const due = await StudentModel.find({
    "successPointsLots.expiresAt": { $lte: now },
  })
    .select("_id")
    .lean<{ _id: mongoose.Types.ObjectId }[]>();

  let wallets = 0;
  let points = 0;
  let failed = 0;

  for (let i = 0; i < due.length; i += EXPIRY_BATCH) {
    const results = await Promise.allSettled(
      due.slice(i, i + EXPIRY_BATCH).map(async ({ _id }) => {
        let expired = 0;
        const res = await mutateWallet(_id, (s) => {
          const split = splitExpiredLots(s.lots, now);
          if (split.expiredPoints <= 0) return null;
          expired = split.expiredPoints;
          return {
            delta: -expired,
            lots: split.live,
            history: [
              {
                transactionId: uuidv4(),
                earnedAt: now,
                type: "expired",
                points: expired,
              },
            ],
          };
        });
        return res ? expired : 0;
      }),
    );
    for (const r of results) {
      if (r.status === "rejected") {
        failed++;
        console.error("Success points expiry failed for a wallet:", r.reason);
      } else if (r.value > 0) {
        wallets++;
        points += r.value;
      }
    }
  }

  return { wallets, points, failed };
}
