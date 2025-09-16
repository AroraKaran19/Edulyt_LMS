import { FAQ } from "@/types";
import mongoose from "mongoose";

// ===================
// FAQ Schema
// ===================

const faqSchema = new mongoose.Schema<FAQ>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { timestamps: true }
);

export const FAQModel = mongoose.model<FAQ>("FAQ", faqSchema);