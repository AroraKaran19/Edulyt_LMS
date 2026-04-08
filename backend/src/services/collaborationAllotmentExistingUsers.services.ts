import mongoose from "mongoose";
import { UserModel } from "../models";
import { studentEmailRegexForCollaborationDomain } from "../utils/collaborationDomainMatching";
import { createCollaborationAllotmentJobService } from "./collaborationJob.services";

const EXISTING_USER_ENQUEUE_BATCH = Math.max(
  1,
  Number(process.env.COLLABORATION_EXISTING_USERS_BATCH_SIZE) || 40,
);

/**
 * When a new course-allot partnership is created, students who already
 * registered with that email domain never hit `enqueueCollaborationAllotmentAfterRegister`.
 * Enqueue the same allotment jobs for them so the worker enrolls them too.
 * Runs async from create; errors are logged per user.
 */
export async function enqueueCollaborationAllotmentForExistingUsersMatchingDomain(
  collaborationDomainId: string,
  domainKey: string,
): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(collaborationDomainId)) {
    return;
  }
  const regex = studentEmailRegexForCollaborationDomain(domainKey);
  const cursor = UserModel.find({
    userType: "student",
    email: { $regex: regex },
  })
    .select("_id")
    .lean()
    .cursor();

  const batch: { _id: unknown }[] = [];
  const flush = async () => {
    if (batch.length === 0) return;
    const chunk = batch.splice(0, batch.length);
    await Promise.all(
      chunk.map((u) =>
        createCollaborationAllotmentJobService({
          userId: String(u._id),
          collaborationDomainId,
        }).catch((e: unknown) => {
          console.error(
            `[Collaboration] Failed to enqueue allotment for existing user ${String(u._id)} (domain ${collaborationDomainId}):`,
            e,
          );
        }),
      ),
    );
  };

  for await (const doc of cursor) {
    batch.push(doc);
    if (batch.length >= EXISTING_USER_ENQUEUE_BATCH) {
      await flush();
    }
  }
  await flush();
}
