import mongoose from "mongoose";
import { ContactSession } from "../types/contactVerification";

/**
 * What this browser has proved for one scope: an email, a phone, or on the
 * enquiry form only a phone against a typed address. There is no login here, so
 * every call after verification authenticates with the raw token whose hash is
 * stored below, and `scope` / `email` are read from this document rather than
 * from the request. Which proofs actually happened is `emailVerifiedAt` and
 * `phoneVerifiedAt`, never the existence of the document.
 */
const contactSessionSchema = new mongoose.Schema<ContactSession>(
  {
    tokenHash: { type: String, required: true, unique: true },
    scope: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    /** Null on a session whose address was typed rather than proved. */
    emailVerifiedAt: { type: Date, default: null },
    phone: { type: String, trim: true, default: null },
    phoneVerifiedAt: { type: Date, default: null },
    phonePending: { type: String, trim: true, default: null },
    phoneSendCount: { type: Number, default: 0, min: 0 },
    /** Epoch rather than null so the cooldown filter needs no special case. */
    phoneLastSentAt: { type: Date, default: () => new Date(0) },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

contactSessionSchema.index({ scope: 1, email: 1 });
contactSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ContactSessionModel = mongoose.model<ContactSession>(
  "ContactSession",
  contactSessionSchema,
);
