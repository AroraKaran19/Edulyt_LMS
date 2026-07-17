/**
 * One-shot manual trigger for randomizeActiveCourseSeatsLeft.
 *
 * Usage (from backend/):
 *   npx ts-node src/scripts/randomize-seats-left.ts
 */

import path from "path";
import dotenv from "dotenv";
import { connectDB, disconnectDB } from "../config/database";
import { randomizeActiveCourseSeatsLeft } from "../services/course.services";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

(async () => {
  await connectDB();
  console.log("✅ Connected to DB");

  const count = await randomizeActiveCourseSeatsLeft();
  console.log(`🎲 seatsLeft randomized for ${count} active course(s)`);

  await disconnectDB();
  process.exit(0);
})();
