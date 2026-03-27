import mongoose from "mongoose";
import { CollaborationDomainModel } from "../models";
import { findActiveCourseAllotDomainByEmail } from "./collaborationDomain.services";
import { createCollaborationAllotmentJobService } from "./collaborationJob.services";

/**
 * After registration: if email matches an active course-allot partnership, enqueue background enrollment.
 * Discount-only partnerships do not enqueue (checkout applies discount later).
 * Fire-and-forget from auth — errors are logged, not thrown to the client.
 */
export async function enqueueCollaborationAllotmentAfterRegister(
  userId: string | mongoose.Types.ObjectId,
  email: string | undefined,
  userType: string
): Promise<void> {
  if (!email?.trim() || userType !== "student") {
    return;
  }

  try {
    const domain = await findActiveCourseAllotDomainByEmail(email);
    if (!domain?._id) {
      return;
    }

    await createCollaborationAllotmentJobService({
      userId: String(userId),
      collaborationDomainId: String(domain._id),
    });
  } catch (e) {
    console.error(
      "[Collaboration] Failed to enqueue allotment job after register:",
      e
    );
  }
}

/** Loads domain for worker (courses as ids, enrollment access). */
export async function getCourseAllotDomainForWorker(domainId: string) {
  if (!mongoose.Types.ObjectId.isValid(domainId)) {
    return null;
  }
  return CollaborationDomainModel.findById(domainId).lean();
}
