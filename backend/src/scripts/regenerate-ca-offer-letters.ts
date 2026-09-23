/**
 * Re-renders every generated CA offer letter and re-sends the approved email with
 * the corrected PDF. Used after letters came out with the intern ID clipped
 * (missing Carlito font on the PDF host). Install the font before applying.
 *
 * Dry run: npm run scripts:regenerate-ca-offer-letters
 * Apply:   npm run scripts:regenerate-ca-offer-letters:apply
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import { CaApplicationModel } from "../models";
import { enqueueCaDocumentJob } from "../services/caDocumentJob.services";

dotenv.config();

const APPLY = process.argv.includes("--apply");

async function regenerateCaOfferLetters() {
  let failed = false;
  try {
    await mongoose.connect(process.env.MONGODB_URI || "");
    const filter = { "documents.offerLetter": { $ne: null } };
    const apps = await CaApplicationModel.find(filter, { _id: 1 }).lean();
    console.log(`${apps.length} CA application(s) have a generated offer letter`);

    if (!APPLY) {
      console.log("Dry run. Re-run with --apply to re-render them and re-send the approved email.");
      return;
    }

    const ids = apps.map((a) => a._id);
    await CaApplicationModel.updateMany(
      { _id: { $in: ids } },
      { $set: { "documents.offerLetter": null, "emails.approvedAt": null } },
    );
    await Promise.all(ids.map((id) => enqueueCaDocumentJob(id, "offer-letter")));
    console.log(`Queued ${ids.length} offer letter(s) for regeneration`);
  } catch (error) {
    failed = true;
    console.error("Regeneration failed:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(failed ? 1 : 0);
  }
}

void regenerateCaOfferLetters();
