/**
 * Meta titles for every internship, once, per environment.
 *
 * Edulyt's role page renders `metaTitle` as the tab title and falls back to the plain title, so an
 * internship with none shows a bare title, and older ones carry the suffix the admin used to
 * generate, "| Airkrit". Internships are Edulyt's (the model fixes their brand), so both are wrong.
 *
 * This fills a missing title with the same wording the admin's SEO screen generates, and rewrites
 * "Airkrit" to "Edulyt" inside a title an admin already wrote, leaving the rest of their wording
 * alone. A title with no mention of Airkrit is never touched.
 *
 * Re-runs are safe: a row already ending "| Edulyt" is left as it is.
 *
 * Usage (from backend/):
 *   npx ts-node src/scripts/fix-internship-meta-titles.ts
 *   npx ts-node src/scripts/fix-internship-meta-titles.ts --apply
 */

import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/database";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

/** The admin's SEO screen drops a duplicate's "(Copy)" before building the title. */
const metaTitleFor = (title: string): string => {
  const clean = String(title ?? "")
    .replace(/\s*\(Copy\)\s*$/i, "")
    .trim();
  return `${clean || "Internship"} - Internship Program | Edulyt`;
};

type Row = {
  _id: mongoose.Types.ObjectId;
  title?: string;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
};

async function main() {
  const apply = process.argv.includes("--apply");
  await connectDB();
  const internships = mongoose.connection.collection<Row>("internships");

  try {
    console.log(apply ? "APPLYING\n" : "DRY RUN\n");

    const rows = await internships
      .find({}, { projection: { title: 1, slug: 1, metaTitle: 1, metaDescription: 1 } })
      .toArray();

    const writes: { _id: mongoose.Types.ObjectId; metaTitle: string }[] = [];
    const counts = { filled: 0, rebranded: 0, kept: 0 };
    let withoutDescription = 0;

    for (const row of rows) {
      const current = String(row.metaTitle ?? "").trim();
      if (!row.metaDescription) withoutDescription += 1;

      let next = current;
      let action: keyof typeof counts = "kept";

      if (!current) {
        next = metaTitleFor(String(row.title ?? ""));
        action = "filled";
      } else if (/airkrit/i.test(current)) {
        next = current.replace(/airkrit/gi, "Edulyt");
        action = "rebranded";
      }

      counts[action] += 1;
      console.log(`${action.toUpperCase().padEnd(9)} ${row.slug ?? row._id}`);
      if (action !== "kept") {
        console.log(`          from: ${current || "(none)"}`);
        console.log(`            to: ${next}`);
        writes.push({ _id: row._id, metaTitle: next });
      }
    }

    console.log(
      `\n${rows.length} internships: ${counts.filled} to fill, ${counts.rebranded} to rebrand, ${counts.kept} already fine.`,
    );
    if (withoutDescription > 0) {
      console.log(
        `${withoutDescription} have no metaDescription. This script does not write those: the admin builds them from the internship's own description.`,
      );
    }

    if (writes.length === 0) {
      console.log("Nothing to write.");
      return;
    }
    if (!apply) {
      console.log("\nNo --apply: nothing was written.");
      return;
    }

    const now = new Date();
    const result = await internships.bulkWrite(
      writes.map(({ _id, metaTitle }) => ({
        updateOne: {
          filter: { _id },
          update: { $set: { metaTitle, updatedAt: now } },
        },
      })),
      { ordered: false },
    );
    console.log(`Written: ${result.modifiedCount} of ${writes.length}.`);
  } finally {
    await disconnectDB();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
