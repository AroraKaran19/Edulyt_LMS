import mongoose from "mongoose";

/** One extra question a marketer or sales person adds to their enquiry form. */
export interface CrmExtraQuestion {
  enabled: boolean;
  key: string;
  label: string;
  type: "text" | "select";
  options: string[];
  required: boolean;
}

/**
 * A CRM member's referral identity and form configuration.
 *
 * Split out of `User` because a form configuration is not an identity
 * attribute. One document per CRM user, created on demand.
 */
export interface CrmProfile {
  _id?: string;
  userId: mongoose.Types.ObjectId;
  /**
   * Optional: a profile can exist to hold a question alone, because
   * `PATCH /crm/me/question` gates on userType and never mints a code.
   */
  code?: string | null;
  codeActive?: boolean;
  /** An ambassador's current marketer or sales owner. Null for staff. */
  parentUserId?: mongoose.Types.ObjectId | null;
  /** Which kind of intern a campus ambassador is. Unset for staff. */
  ambassadorKind?: "marketing" | "sales";
  /** Up to MAX_EXTRA_QUESTIONS, in the order they appear on the form. */
  extraQuestions?: CrmExtraQuestion[];
  /**
   * Whether this owner's campus ambassadors may set questions of their own.
   * When false, an ambassador's link falls back to this owner's questions.
   * Meaningless on an ambassador's own profile.
   */
  allowAmbassadorQuestions?: boolean;
  /**
   * Hides plan prices on this member's OWN enquiry link, because sales quote
   * below the listing price on a call.
   */
  hidePlanPrices?: boolean;
  /**
   * Hides plan prices on this owner's ambassadors' links. Deliberately separate
   * from `hidePlanPrices`: a marketer may work their own leads from a priced
   * page while their campus ambassadors send an unpriced one, or the reverse.
   * Meaningless on an ambassador's own profile.
   */
  hideAmbassadorPlanPrices?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
