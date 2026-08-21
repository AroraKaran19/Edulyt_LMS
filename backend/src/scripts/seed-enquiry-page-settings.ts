/**
 * Seeds the enquiry page CMS singleton with the values the page currently
 * renders, so the admin editor opens on real content instead of empty fields.
 *
 * The payload in `data/enquiry-page-seed.json` was generated from the frontend
 * constants themselves, not transcribed, so it matches what visitors see today.
 *
 * Idempotent: upserts on `key: "global"`. By default it only fills sections that
 * are still empty, so a re-run cannot overwrite an admin's edits. Pass
 * `--overwrite` to force every section back to the shipped copy.
 *
 * Dry-run by default. Pass `--apply` to write.
 *
 * Run (dry-run):  npm run scripts:seed-enquiry-page
 * Run (apply):    npm run scripts:seed-enquiry-page:apply
 */
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { EnquiryPageSettingsModel } from "../models/enquiryPageSettings.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const GLOBAL_KEY = "global";
const SEED_PATH = path.resolve(__dirname, "data/enquiry-page-seed.json");

const SCHEMA_DEFAULTS = new Set(["_id", "enabled", "source", "s3Key"]);

/** A section counts as filled once it holds any non-empty value. */
function hasContent(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).some(([k, v]) => {
      // Fields the schema fills in on a blank document. Counting them would
      // read an untouched section as edited, which is how the hero, whose
      // `primaryCta.source` defaults to "url", was almost skipped.
      if (SCHEMA_DEFAULTS.has(k)) return false;
      return hasContent(v);
    });
  }
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return value !== 0;
  return Boolean(value);
}

async function seed() {
  const apply = process.argv.includes("--apply");
  const overwrite = process.argv.includes("--overwrite");

  const seedData = JSON.parse(fs.readFileSync(SEED_PATH, "utf-8")) as Record<
    string,
    unknown
  >;

  try {
    await mongoose.connect(process.env.MONGODB_URI || "");
    console.log(`Connected to ${mongoose.connection.db?.databaseName}`);
    console.log(
      apply
        ? `Mode: APPLY${overwrite ? " --overwrite (existing content will be replaced)" : ""}\n`
        : "Mode: DRY-RUN, nothing will be written. Pass --apply to persist.\n",
    );

    const existing = (await EnquiryPageSettingsModel.findOne({
      key: GLOBAL_KEY,
    }).lean()) as Record<string, unknown> | null;

    const toWrite: Record<string, unknown> = {};
    const skipped: string[] = [];

    for (const [section, value] of Object.entries(seedData)) {
      const alreadySet = hasContent(existing?.[section]);
      if (alreadySet && !overwrite) {
        skipped.push(section);
        continue;
      }
      toWrite[section] = value;
    }

    for (const section of Object.keys(seedData)) {
      const mark = toWrite[section] ? "seed" : "keep";
      console.log(`  ${mark.padEnd(5)} ${section}`);
    }

    if (skipped.length) {
      console.log(
        `\n${skipped.length} section(s) already have content and were left alone.`,
      );
      console.log("Pass --overwrite to replace them with the shipped copy.");
    }

    if (Object.keys(toWrite).length === 0) {
      console.log("\nNothing to seed.");
      return;
    }

    if (!apply) {
      console.log(
        `\nWould seed ${Object.keys(toWrite).length} section(s). Re-run with --apply.`,
      );
      return;
    }

    await EnquiryPageSettingsModel.findOneAndUpdate(
      { key: GLOBAL_KEY },
      { $set: toWrite, $setOnInsert: { key: GLOBAL_KEY } },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
    );

    console.log(`\nSeeded ${Object.keys(toWrite).length} section(s).`);
    console.log(
      "The public page is cached: edit and save any section in the admin, or wait for the hourly revalidate, to see it served from the database.",
    );
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected");
  }
}

void seed();
