/**
 * Migration: the announcement `audience` enum dropped the catch-all `student`
 * value in favour of `course` and `internship`. Existing `student`
 * announcements were the learner-dashboard feed, which is now the `course`
 * feed, so re-home them there.
 *
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/migrate-announcement-audience-student-to-course.ts
 */
import mongoose from "mongoose";
import { AnnouncementModel } from "../models/announcement.schema";
import dotenv from "dotenv";

dotenv.config();

async function migrateAnnouncementAudience() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "");
    console.log("Connected to MongoDB");

    const result = await AnnouncementModel.updateMany(
      { audience: "student" },
      { $set: { audience: "course" } },
    );

    console.log(
      `Re-homed ${result.modifiedCount} announcement(s) from 'student' to 'course'`,
    );
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
}

migrateAnnouncementAudience();
