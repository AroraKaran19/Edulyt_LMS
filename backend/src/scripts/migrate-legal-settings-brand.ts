/**
 * Terms & Conditions per brand, once, per environment.
 *
 * The documents used to live in one row keyed "global". Each brand now reads its own row, keyed by
 * the brand. This copies the global row to "airkrit", since every document in it is Airkrit's, and
 * leaves the global row alone so the backend still deployed keeps reading it: run it right before
 * deploying. Edulyt starts with no row, and its cart skips the T&C step until a document is uploaded.
 *
 * Re-runs are safe: the copy is an upsert that never touches an existing "airkrit" row.
 *
 * Usage (from backend/):
 *   npx ts-node src/scripts/migrate-legal-settings-brand.ts
 *   npx ts-node src/scripts/migrate-legal-settings-brand.ts --apply
 */

import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/database";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const FIELDS = [
  "courseTermsUrl",
  "courseTermsS3Key",
  "internshipTermsUrl",
  "internshipTermsS3Key",
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  await connectDB();
  const legalSettings = mongoose.connection.collection("legalsettings");

  try {
    console.log(apply ? "APPLYING\n" : "DRY RUN\n");

    const [globalRow, airkritRow] = await Promise.all([
      legalSettings.findOne({ key: "global" }),
      legalSettings.findOne({ key: "airkrit" }),
    ]);

    if (airkritRow) {
      console.log('An "airkrit" row already exists. Nothing to copy.');
      return;
    }
    if (!globalRow) {
      console.log('No "global" row. Nothing to copy.');
      return;
    }

    const documents = Object.fromEntries(
      FIELDS.map((field) => [
        field,
        typeof globalRow[field] === "string" ? globalRow[field] : "",
      ]),
    );
    console.log('Copy "global" to "airkrit":', documents);

    if (!apply) {
      console.log("\nNo --apply: nothing was written.");
      return;
    }

    const now = new Date();
    const result = await legalSettings.updateOne(
      { key: "airkrit" },
      { $setOnInsert: { key: "airkrit", ...documents, createdAt: now, updatedAt: now } },
      { upsert: true },
    );
    console.log(
      result.upsertedCount === 1
        ? "Written."
        : 'An "airkrit" row appeared meanwhile. Left as it was.',
    );
  } finally {
    await disconnectDB();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
