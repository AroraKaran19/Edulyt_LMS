import mongoose from "mongoose";
import { ScholarshipSession } from "../types/scholarship";

/**
 * Proof that this browser verified this email for this campaign. There is no
 * login here, so every call after OTP verify authenticates with the raw token
 * whose hash is stored below, and `testId` / `email` are read from this
 * document rather than from the request.
 */
const scholarshipSessionSchema = new mongoose.Schema<ScholarshipSession>(
  {
    /**
     * SHA-256 of the raw token, not bcrypt. The middleware has to look a
     * session up *by* its token on every call, and a bcrypt hash is unindexable
     * (each one carries its own salt). A 256-bit random token has no guessable
     * structure, so the slow-hash protection bcrypt buys for passwords has
     * nothing to defend here.
     */
    tokenHash: { type: String, required: true, unique: true },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScholarshipTest",
      required: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true },
    /**
     * Proved separately from the email, and required before an attempt may
     * start. Held on the session rather than written straight to a profile
     * because most candidates have no account to write to.
     */
    phone: { type: String, trim: true, default: null },
    phoneVerifiedAt: { type: Date, default: null },
    /**
     * Written when a send is claimed, before the widget is allowed to dispatch
     * anything, and required to match at verify. MSG91 does not echo the number
     * back on every widget configuration, so without this a token proved
     * against one number could be presented alongside another.
     */
    phonePending: { type: String, trim: true, default: null },
    /**
     * The SMS budget for this session. The widget sends from the browser, so a
     * claim recorded here before each send is the only thing standing between
     * one candidate and an unmetered SMS bill.
     */
    phoneSendCount: { type: Number, default: 0, min: 0 },
    /** Epoch rather than null so the cooldown filter needs no special case. */
    phoneLastSentAt: { type: Date, default: () => new Date(0) },
    /** Only set for a session issued from a signed-in account. */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

scholarshipSessionSchema.index({ testId: 1, email: 1 });
scholarshipSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ScholarshipSessionModel = mongoose.model<ScholarshipSession>(
  "ScholarshipSession",
  scholarshipSessionSchema,
);
