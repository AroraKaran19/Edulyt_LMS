import mongoose from "mongoose";
import { ScholarshipTestModel } from "../models/scholarshipTest.schema";
import { AppError } from "../middlewares/error.middleware";

/**
 * Attaching a campaign to an enquiry page, shared by the two places that do it:
 * a marketer or sales person on their own links, and an admin on the bare
 * `/enquiry` page.
 *
 * Its own module rather than part of `scholarshipTest.services`, which pulls in
 * coupons and entitlements and is itself imported by that service's callers.
 * Everything here needs only the campaign collection.
 */

/** How many campaigns a picker offers. Nobody scrolls past this many. */
const OPTION_LIMIT = 200;

/**
 * Validates a pointer someone is about to attach, returning it as an ObjectId
 * or null to clear.
 *
 * Ownership is proved here rather than trusted from the picker: the picker only
 * ever lists the caller's own campaigns, but the endpoint behind it accepts any
 * id. `isActive` deliberately is not checked, because pausing a campaign must
 * not silently detach it; the public resolver refuses to render a paused one,
 * so resuming brings the line straight back.
 */
export const resolveAttachableCampaignId = async (
  value: unknown,
  actorId: string,
): Promise<mongoose.Types.ObjectId | null> => {
  const raw = value === null || value === undefined ? "" : String(value).trim();
  if (!raw) return null;

  if (!mongoose.Types.ObjectId.isValid(raw)) {
    throw new AppError("Invalid campaign id", 400);
  }

  const owned = await ScholarshipTestModel.exists({
    _id: new mongoose.Types.ObjectId(raw),
    createdBy: new mongoose.Types.ObjectId(actorId),
  });
  if (!owned) {
    throw new AppError("You can only attach a campaign you created", 400);
  }

  return new mongoose.Types.ObjectId(raw);
};

/**
 * The caller's own campaigns, for a picker.
 *
 * Hard-scoped to `createdBy` for every role, super-admin included: the two
 * pages that render this picker are gated on `leads.enquiry-page` and
 * `crm.my-team`, neither of which grants sight of the campaign list, so a
 * role-widened result here would leak other people's work. Paused campaigns are
 * included and labelled, since attaching one is legal.
 *
 * Served by the `{ createdBy: 1, createdAt: -1 }` index.
 */
export const listOwnCampaignOptions = async (actorId: string) =>
  ScholarshipTestModel.find(
    { createdBy: new mongoose.Types.ObjectId(actorId) },
    { title: 1, slug: 1, isActive: 1 },
  )
    .sort({ createdAt: -1 })
    .limit(OPTION_LIMIT)
    .lean();
