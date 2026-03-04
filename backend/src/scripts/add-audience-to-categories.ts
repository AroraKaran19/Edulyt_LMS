/**
 * Migration script: Add audience field to existing categories
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/add-audience-to-categories.ts
 */
import mongoose from "mongoose";
import { CategoryModel } from "../models";
import dotenv from "dotenv";

dotenv.config();

async function addAudienceToCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "");
    console.log("Connected to MongoDB");

    const result = await CategoryModel.updateMany(
      { audience: { $exists: false } },
      { $set: { audience: "college-students" } }
    );

    console.log(`Updated ${result.modifiedCount} categories with audience: college-students`);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
}

addAudienceToCategories();
