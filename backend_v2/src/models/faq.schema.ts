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

// indexes
faqSchema.index({ question: 1, createdAt: -1 });
faqSchema.index({ answer: 1, createdAt: -1 });
faqSchema.index({ createdAt: -1 });
faqSchema.index({ updatedAt: -1 });
faqSchema.index({ question: 1, answer: 1, createdAt: -1 });
faqSchema.index({ question: 1, answer: 1, updatedAt: -1 });

export const FAQModel = mongoose.model<FAQ>("FAQ", faqSchema);
