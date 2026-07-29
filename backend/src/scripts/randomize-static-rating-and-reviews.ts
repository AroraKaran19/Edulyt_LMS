/**
 * Randomizes the admin-set (fake) rating pair on courses:
 *   staticRating      -> 4.0 - 5.0  (one decimal)
 *   staticReviewCount -> 5000 - 9000
 *
 * Each course gets its own random pair: the values are generated server-side
 * with $rand inside an aggregation-pipeline update, so this is a single round
 * trip regardless of how many courses there are.
 *
 * Note: these two only show on the storefront while a course has no real
 * ratings yet (see getCourseDisplayRating). Courses with a real
 * analytics.averageRating keep showing the real numbers.
 *
 * Usage (from backend/):
 *   npx ts-node src/scripts/randomize-static-rating-and-reviews.ts
 *   npx ts-node src/scripts/randomize-static-rating-and-reviews.ts --active-only
 *   npx ts-node src/scripts/randomize-static-rating-and-reviews.ts --dry-run
 */

import path from "path";
import dotenv from "dotenv";
import { connectDB, disconnectDB } from "../config/database";
import { CourseModel } from "../models/course.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const RATING_MIN = 4;
const RATING_MAX = 5;
const REVIEWS_MIN = 5000;
const REVIEWS_MAX = 9000;

const activeOnly = process.argv.includes("--active-only");
const dryRun = process.argv.includes("--dry-run");

const filter = activeOnly ? { isActive: true } : {};

(async () => {
  await connectDB();
  console.log("✅ Connected to DB");

  const total = await CourseModel.countDocuments(filter);
  console.log(
    `📚 ${total} course(s) in scope${activeOnly ? " (active only)" : ""}`
  );

  if (dryRun) {
    console.log(
      `🔎 Dry run: would set staticRating ${RATING_MIN}-${RATING_MAX} ` +
        `and staticReviewCount ${REVIEWS_MIN}-${REVIEWS_MAX} on ${total} course(s).`
    );
    await disconnectDB();
    process.exit(0);
  }

  const result = await CourseModel.updateMany(filter, [
    {
      $set: {
        // $round to 1 decimal keeps ratings looking like "4.7", not "4.7312".
        staticRating: {
          $round: [
            {
              $add: [
                RATING_MIN,
                { $multiply: [{ $rand: {} }, RATING_MAX - RATING_MIN] },
              ],
            },
            1,
          ],
        },
        staticReviewCount: {
          $floor: {
            $add: [
              REVIEWS_MIN,
              { $multiply: [{ $rand: {} }, REVIEWS_MAX - REVIEWS_MIN + 1] },
            ],
          },
        },
      },
    },
  ]);

  console.log(
    `🎲 Randomized staticRating / staticReviewCount on ${result.modifiedCount} course(s)`
  );

  const samples = await CourseModel.find(filter)
    .select("title staticRating staticReviewCount")
    .limit(5)
    .lean();

  console.log("\nSample:");
  for (const c of samples) {
    console.log(
      `  ${c.staticRating} ★  ${c.staticReviewCount} reviews  -  ${c.title}`
    );
  }

  await disconnectDB();
  process.exit(0);
})();
