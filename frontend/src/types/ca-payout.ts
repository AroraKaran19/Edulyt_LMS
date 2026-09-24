/** Mirrors `CaPayoutView` in `backend/src/services/caPayoutSelfService.services.ts`. */
export interface CaPayoutView {
  method: "upi" | "details" | null;
  masked: string | null;
  lastChangedAt: string | null;
  lockedUntil: string | null;
}

export interface CaPayoutOtpSent {
  sentTo: string;
  /** Country code + number, no "+": what the MSG91 widget's `sendOtp` takes. */
  identifier: string;
}
