/**
 * Acknowledges a community review submission.
 *
 * No claim marker: `createCommunityReview` enforces one non-anonymous review per
 * user and throws on a second attempt before reaching here, so one post means one
 * email by construction.
 *
 * Anonymous posts carry no `userId`, so there is nobody to write to. The caller
 * checks that before calling, and this repeats the check rather than trusting it.
 */
import mongoose from "mongoose";
import { UserModel } from "../models/user.schema";
import { reviewPostedMail } from "../mail";
import { frontendBaseUrl } from "../lib/internshipSeatUrl";
import {
  buildCommunityUrl,
  buildPointsBlock,
  buildReviewQuote,
  buildReviewTag,
  buildReviewTitle,
} from "../lib/reviewPostedMail";

/**
 * Thank a community author for their post.
 *
 * Returns whether an email was dispatched. Never throws: publishing a story must
 * not fail because a thank-you could not be sent.
 */
export const sendCommunityReviewPostedEmail = async (params: {
  userId: string;
  title: string;
  review: string;
  tag: string;
  successPoints: number;
}): Promise<boolean> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(params.userId)) return false;

    const user = await UserModel.findById(params.userId)
      .select("firstName lastName name email")
      .lean<{
        firstName?: string;
        lastName?: string;
        name?: string;
        email?: string;
      }>();

    const email = user?.email?.trim();
    if (!email) return false;

    const name =
      [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
      user?.name?.trim() ||
      "there";

    await reviewPostedMail.send([{ email, name }], {
      name,
      // Escaped here, at the only point where author-written text becomes HTML.
      reviewTitle: buildReviewTitle(params.title),
      reviewTag: buildReviewTag(params.tag),
      reviewText: buildReviewQuote(params.review),
      pointsBlock: buildPointsBlock(params.successPoints),
      ctaUrl: buildCommunityUrl(frontendBaseUrl()),
      year: new Date().getFullYear(),
    });

    return true;
  } catch (error) {
    console.error(
      `[Community Review Mail] Failed to thank user ${params.userId}:`,
      error instanceof Error ? error.message : error,
    );
    return false;
  }
};
