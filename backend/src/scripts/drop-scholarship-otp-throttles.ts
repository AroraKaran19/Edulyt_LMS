/**
 * One-time cleanup: drop the `scholarshipotpthrottles` collection.
 *
 * It backed a per-IP send budget on the scholarship OTP flow. MSG91 already
 * rate limits sends, so that budget was removed along with its model, and the
 * collection is now orphaned: nothing in the codebase reads or writes it.
 *
 * Safe to drop rather than archive. Every document was an ephemeral counter
 * (`ip`, `sendCount`, `windowExpiresAt`) reaped by a TTL index within minutes,
 * so there is no history here worth keeping.
 *
 * Dry-run by default, reporting what it found and writing nothing.
 * Pass `--apply` to drop.
 *
 * Run per environment. A collection missing here is the success case, not a
 * failure: it means that environment never ran the throttle, or was cleaned
 * already.
 *
 * Run (dry-run):  npm run scripts:drop-scholarship-otp-throttles
 * Run (apply):    npm run scripts:drop-scholarship-otp-throttles:apply
 */
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const COLLECTION = "scholarshipotpthrottles";

async function dropScholarshipOtpThrottles() {
  const apply = process.argv.includes("--apply");

  try {
    await mongoose.connect(process.env.MONGODB_URI || "");
    console.log("Connected to MongoDB");
    console.log(`Database: ${mongoose.connection.db?.databaseName}`);
    console.log(
      apply
        ? "Mode: APPLY — the collection will be dropped.\n"
        : "Mode: DRY-RUN — nothing will be dropped. Pass --apply to persist.\n",
    );

    const db = mongoose.connection.db;
    if (!db) throw new Error("No database handle on the connection");

    // Listed by name rather than counted blind, so "absent" and "empty" stay
    // distinguishable in the output.
    const found = await db.listCollections({ name: COLLECTION }).toArray();
    if (found.length === 0) {
      console.log(
        `Collection \`${COLLECTION}\` does not exist here — nothing to do.`,
      );
      return;
    }

    const docCount = await db.collection(COLLECTION).countDocuments();
    console.log(`Collection \`${COLLECTION}\` found.`);
    console.log(`Documents remaining       : ${docCount}`);
    console.log("(TTL reaps these, so a low or zero count is expected.)");

    if (!apply) {
      console.log("\nRe-run with --apply to drop it.");
      return;
    }

    await db.dropCollection(COLLECTION);
    console.log(`\nDropped \`${COLLECTION}\`.`);
  } catch (error) {
    console.error("Drop failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
}

dropScholarshipOtpThrottles();
