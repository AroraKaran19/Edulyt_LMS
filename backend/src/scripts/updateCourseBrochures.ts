import mongoose from "mongoose";
import { CourseModel } from "../models";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from backend root
// When run as ts-node src/scripts/..., __dirname is backend/src/scripts
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const BROCHURE_URL = "https://edulyt-v2.s3.amazonaws.com/courses/ai___natural_language_processing___beginner/brochure/b271479c-02ff-468a-a9a4-7c5e0d1dc5a0.pdf";

async function updateAllCourseBrochures() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully");

    // Get count of all courses
    const totalCourses = await CourseModel.countDocuments();
    console.log(`\nTotal courses found: ${totalCourses}`);

    // Update all courses with the new brochure URL
    console.log("\nUpdating all courses with new brochure URL...");
    const result = await CourseModel.updateMany(
      {}, // Empty filter to match all documents
      {
        $set: {
          brochure: BROCHURE_URL,
          brochureSource: "url",
          brochureS3Key: "",
        },
      }
    );

    console.log(`\n✅ Update completed successfully!`);
    console.log(`   - Matched: ${result.matchedCount} courses`);
    console.log(`   - Modified: ${result.modifiedCount} courses`);
    console.log(`   - Brochure URL: ${BROCHURE_URL}`);

    // Verify the update by fetching a few sample courses
    console.log("\nVerifying update with sample courses...");
    const sampleCourses = await CourseModel.find({})
      .select("title brochure brochureSource")
      .limit(5);

    console.log("\nSample courses after update:");
    sampleCourses.forEach((course, index) => {
      console.log(`\n${index + 1}. ${course.title}`);
      console.log(`   Brochure: ${course.brochure || "Not set"}`);
      console.log(`   Source: ${(course as any).brochureSource || "Not set"}`);
    });

  } catch (error) {
    console.error("\n❌ Error updating course brochures:", error);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log("\n\nMongoDB connection closed");
    process.exit(0);
  }
}

// Run the script
console.log("=".repeat(60));
console.log("Course Brochure Update Script");
console.log("=".repeat(60));
console.log(`\nTarget Brochure URL:\n${BROCHURE_URL}\n`);

updateAllCourseBrochures();
