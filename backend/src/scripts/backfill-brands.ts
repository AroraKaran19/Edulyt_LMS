/**
 * Brands history, once, per environment.
 *
 * Courses go by audience, internships are all Edulyt, access records follow
 * their product, transactional records keep Airkrit, the brand they were
 * transacted under, and jobs follow the order or enrollment they were queued for. Every user gets Airkrit; anyone holding a professional
 * course or an internship also gets Edulyt.
 *
 * Re-runs are safe: every filter skips documents already carrying the brand it
 * would set, so a second run reports zero changes.
 *
 * `courseId` is stored as an ObjectId on some rows and a string on others, so
 * course-matching filters carry both forms.
 *
 * Usage (from backend/):
 *   npx ts-node src/scripts/backfill-brands.ts
 *   npx ts-node src/scripts/backfill-brands.ts --apply
 */

import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/database";
import { couponBrandFor, rebrandMetaTitle } from "../lib/brandRules";
import type { Brand } from "../constants/brands";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const BATCH = 1000;

const chunk = <T>(items: T[], size = BATCH): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

/** Matches rows whose id was stored either as an ObjectId or as a string. */
const bothIdForms = (ids: mongoose.Types.ObjectId[]) => ({
  $in: [...ids, ...ids.map((id) => String(id))],
});

async function main() {
  const apply = process.argv.includes("--apply");
  await connectDB();
  const db = mongoose.connection;

  const run = async (
    label: string,
    collection: string,
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
  ) => {
    const target = db.collection(collection);
    const count = await target.countDocuments(filter);
    console.log(`${label.padEnd(46)} ${String(count).padStart(8)}`);
    if (apply && count > 0) {
      const result = await target.updateMany(filter, update);
      console.log(`${"".padEnd(46)} ${String(result.modifiedCount).padStart(8)} written`);
    }
  };

  try {
    console.log(apply ? "APPLYING\n" : "DRY RUN\n");

    // 1. Catalogue first: everything else follows a product's brand.
    await run("courses: professionals to edulyt", "courses",
      { brand: { $exists: false }, audience: "professionals" },
      { $set: { brand: "edulyt" } });
    await run("courses: the rest to airkrit", "courses",
      { brand: { $exists: false } }, { $set: { brand: "airkrit" } });
    await run("internships: all to edulyt", "internships",
      { brand: { $ne: "edulyt" } }, { $set: { brand: "edulyt" } });
    await run("categories: professionals to edulyt", "categories",
      { brand: { $exists: false }, audience: "professionals" },
      { $set: { brand: "edulyt" } });
    await run("categories: the rest to airkrit", "categories",
      { brand: { $exists: false } }, { $set: { brand: "airkrit" } });
    await run("announcements: internship to edulyt", "announcements",
      { brand: { $exists: false }, audience: "internship" },
      { $set: { brand: "edulyt" } });
    await run("announcements: the rest to airkrit", "announcements",
      { brand: { $exists: false } }, { $set: { brand: "airkrit" } });

    // By predicate, not by the brand just written, so a dry run reports the
    // same set an apply would act on. After the write the two agree.
    const edulytCourseIds = (
      await db
        .collection("courses")
        .find(
          {
            $or: [
              { brand: "edulyt" },
              { brand: { $exists: false }, audience: "professionals" },
            ],
          },
          { projection: { _id: 1 } },
        )
        .toArray()
    ).map((course) => course._id as mongoose.Types.ObjectId);
    console.log(`\nedulyt courses: ${edulytCourseIds.length}\n`);

    // 2. Access records follow the product. `$ne` rather than `$exists`, so a
    //    row stamped airkrit before its course was branded is corrected.
    for (const ids of chunk(edulytCourseIds)) {
      await run("enrollments on edulyt courses", "enrollments",
        { courseId: bothIdForms(ids), brand: { $ne: "edulyt" } },
        { $set: { brand: "edulyt" } });
      await run("course internships on edulyt courses", "courseinternshipenrollments",
        { course: bothIdForms(ids), brand: { $ne: "edulyt" } },
        { $set: { brand: "edulyt" } });
      await run("live classes on edulyt courses", "liveclasses",
        { course: bothIdForms(ids), brand: { $ne: "edulyt" } },
        { $set: { brand: "edulyt" } });
      await run("course certificates on edulyt courses", "certificates",
        { courseId: bothIdForms(ids), brand: { $ne: "edulyt" } },
        { $set: { brand: "edulyt" } });
    }
    await run("internship enrollments to edulyt", "internshipenrollments",
      { brand: { $ne: "edulyt" } }, { $set: { brand: "edulyt" } });
    await run("internship certificates to edulyt", "certificates",
      { enrollmentModel: "InternshipEnrollment", brand: { $ne: "edulyt" } },
      { $set: { brand: "edulyt" } });
    await run("live meetings to edulyt", "internshiplivemeetings",
      { brand: { $ne: "edulyt" } }, { $set: { brand: "edulyt" } });

    for (const collection of ["enrollments", "courseinternshipenrollments", "liveclasses", "certificates"]) {
      await run(`${collection}: the rest to airkrit`, collection,
        { brand: { $exists: false } }, { $set: { brand: "airkrit" } });
    }

    // 3. Transactional records keep the brand they were transacted under.
    for (const collection of ["orders", "referralsales", "referralwithdrawals", "referralprofiles"]) {
      await run(`${collection}: to airkrit`, collection,
        { brand: { $exists: false } }, { $set: { brand: "airkrit" } });
    }

    // 4. Jobs follow the record they were queued for. Both store that record's
    //    id as a string.
    const edulytOrderIds = (
      await db.collection("orders").distinct("_id", { brand: "edulyt" })
    ).map(String);
    for (const ids of chunk(edulytOrderIds)) {
      await run("invoice jobs on edulyt orders", "invoicejobs",
        { orderId: { $in: ids }, brand: { $ne: "edulyt" } },
        { $set: { brand: "edulyt" } });
    }
    await run("invoicejobs: the rest to airkrit", "invoicejobs",
      { brand: { $exists: false } }, { $set: { brand: "airkrit" } });

    await run("certificate jobs: internship to edulyt", "certificatejobs",
      { certificateType: "internship", brand: { $ne: "edulyt" } },
      { $set: { brand: "edulyt" } });
    const edulytEnrollmentIds = (
      await db.collection("enrollments").distinct("_id", {
        $or: [{ brand: "edulyt" }, { courseId: bothIdForms(edulytCourseIds) }],
      })
    ).map(String);
    for (const ids of chunk(edulytEnrollmentIds)) {
      await run("course certificate jobs on edulyt courses", "certificatejobs",
        { certificateType: { $ne: "internship" }, enrollmentId: { $in: ids }, brand: { $ne: "edulyt" } },
        { $set: { brand: "edulyt" } });
    }
    await run("certificatejobs: the rest to airkrit", "certificatejobs",
      { brand: { $exists: false } }, { $set: { brand: "airkrit" } });

    // 5. Memberships.
    await run("users: everyone gets airkrit", "users",
      { brands: { $exists: false } }, { $set: { brands: ["airkrit"] } });
    await run("users: empty membership list gets airkrit", "users",
      { brands: { $size: 0 } }, { $set: { brands: ["airkrit"] } });

    // Also by predicate: an access record's brand may not be written yet.
    const edulytHolderFilters: [string, string, Record<string, unknown>][] = [
      [
        "enrollments",
        "userId",
        { $or: [{ brand: "edulyt" }, { courseId: bothIdForms(edulytCourseIds) }] },
      ],
      [
        "courseinternshipenrollments",
        "user",
        { $or: [{ brand: "edulyt" }, { course: bothIdForms(edulytCourseIds) }] },
      ],
      // Every internship is Edulyt's, so every holder of one needs the brand.
      ["internshipenrollments", "user", {}],
    ];
    const edulytHolders = new Set<string>();
    for (const [collection, field, filter] of edulytHolderFilters) {
      const holders = await db.collection(collection).distinct(field, filter);
      for (const holder of holders) if (holder) edulytHolders.add(String(holder));
    }
    console.log(`\nusers needing edulyt: ${edulytHolders.size}`);
    if (apply) {
      for (const ids of chunk([...edulytHolders].map((id) => new mongoose.Types.ObjectId(id)))) {
        const result = await db.collection("users").updateMany(
          { _id: { $in: ids }, brands: { $ne: "edulyt" } },
          { $addToSet: { brands: "edulyt" } },
        );
        console.log(`  added edulyt to ${result.modifiedCount}`);
      }
    }

    // 6. Coupons follow their courses when they all sit on one brand.
    const edulytCourseKeys = new Set(edulytCourseIds.map(String));
    const coupons = await db.collection("coupons")
      .find({ brand: { $exists: false } }, { projection: { applicableType: 1, applicableCourses: 1 } })
      .toArray();
    const mixed: string[] = [];
    for (const coupon of coupons) {
      const courses = (coupon.applicableCourses ?? []) as unknown[];
      const brands = courses.map((id): Brand =>
        edulytCourseKeys.has(String(id)) ? "edulyt" : "airkrit");
      const brand = couponBrandFor(coupon.applicableType, brands);
      if (brand === "airkrit" && brands.includes("edulyt")) mixed.push(String(coupon._id));
      if (apply) {
        await db.collection("coupons").updateOne({ _id: coupon._id }, { $set: { brand } });
      }
    }
    console.log(`\ncoupons: ${coupons.length} branded, ${mixed.length} span both brands`);
    for (const id of mixed) console.log(`  review coupon ${id}`);

    // 7. Saved SEO titles that still say Airkrit on a moved course.
    const moved = await db.collection("courses")
      .find({ brand: "edulyt", metaTitle: { $regex: "airkrit", $options: "i" } },
        { projection: { metaTitle: 1 } })
      .toArray();
    console.log(`\ncourses with an Airkrit meta title: ${moved.length}`);
    if (apply) {
      for (const course of moved) {
        const rewritten = rebrandMetaTitle(course.metaTitle as string, "edulyt");
        if (rewritten && rewritten !== course.metaTitle) {
          await db.collection("courses").updateOne(
            { _id: course._id }, { $set: { metaTitle: rewritten } });
        }
      }
      console.log("  rewritten");
    }

    if (!apply) console.log("\nNo --apply: nothing was written.");
  } finally {
    await disconnectDB();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
