import { FAQModel } from "../models/faq.schema";
import { FAQ } from "../types";
import { AppError } from "../middlewares/error.middleware";
import mongoose from "mongoose";

/**
 * Get all FAQs with pagination
 * @param page - Page number
 * @param limit - Items per page
 * @param search - Search term for question/answer
 * @returns Promise<{faqs: FAQ[], total: number, page: number, totalPages: number}>
 */
export const getAllFAQs = async (
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<{
  faqs: FAQ[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  try {
    // Build query object
    const query: any = {};

    // Add search filter if provided
    if (search) {
      query.$or = [
        { question: { $regex: search, $options: "i" } },
        { answer: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await FAQModel.countDocuments(query);

    const faqs = await FAQModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      faqs,
      total,
      page,
      totalPages,
    };
  } catch (error) {
    console.error("Database error in getAllFAQs:", error);
    throw new AppError("Failed to fetch FAQs from database", 500);
  }
};

/**
 * Get FAQ by ID
 * @param faqId - FAQ ID
 * @returns Promise<FAQ | null>
 */
export const getFAQById = async (faqId: string): Promise<FAQ | null> => {
  try {
    // Validate faqId format
    if (!mongoose.Types.ObjectId.isValid(faqId)) {
      throw new AppError("Invalid FAQ ID format", 400);
    }

    const faq = await FAQModel.findById(faqId).lean();
    return faq;
  } catch (error) {
    console.error("Database error in getFAQById:", error);
    throw new AppError("Failed to fetch FAQ from database", 500);
  }
};

/**
 * Create a new FAQ
 * @param faqData - FAQ data
 * @returns Promise<{success: boolean, faqId: string, message: string}>
 */
export const createFAQ = async (faqData: Partial<FAQ>) => {
  try {
    // Validate required fields
    if (!faqData.question || !faqData.answer) {
      throw new AppError("Missing required fields: question and answer", 400);
    }

    // Validate field lengths
    if (faqData.question.trim().length < 5) {
      throw new AppError("Question must be at least 5 characters long", 400);
    }

    if (faqData.answer.trim().length < 10) {
      throw new AppError("Answer must be at least 10 characters long", 400);
    }

    const newFAQ = new FAQModel({
      question: faqData.question.trim(),
      answer: faqData.answer.trim(),
    });

    await newFAQ.validate();
    await newFAQ.save();

    return {
      success: true,
      faqId: newFAQ._id,
      message: "FAQ created successfully",
    };
  } catch (error) {
    console.error("Database error in createFAQ:", error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(field => 
        `${field}: ${error.errors[field].message}`
      ).join(', ');
      throw new AppError(`Validation failed: ${validationErrors}`, 400);
    }
    
    throw new AppError("Failed to create FAQ", 500);
  }
};

/**
 * Update FAQ
 * @param faqId - FAQ ID
 * @param updateData - FAQ update data
 * @returns Promise<{success: boolean, message: string}>
 */
export const updateFAQ = async (
  faqId: string,
  updateData: Partial<FAQ>
): Promise<{success: boolean, message: string}> => {
  try {
    // Validate faqId format
    if (!mongoose.Types.ObjectId.isValid(faqId)) {
      throw new AppError("Invalid FAQ ID format", 400);
    }

    // Remove fields that shouldn't be updated
    const { _id, createdAt, ...allowedUpdateData } = updateData;

    if (Object.keys(allowedUpdateData).length === 0) {
      throw new AppError("No valid fields provided for update", 400);
    }

    // Validate field lengths if provided
    if (allowedUpdateData.question && allowedUpdateData.question.trim().length < 5) {
      throw new AppError("Question must be at least 5 characters long", 400);
    }

    if (allowedUpdateData.answer && allowedUpdateData.answer.trim().length < 10) {
      throw new AppError("Answer must be at least 10 characters long", 400);
    }

    // Trim strings if provided
    if (allowedUpdateData.question) {
      allowedUpdateData.question = allowedUpdateData.question.trim();
    }
    if (allowedUpdateData.answer) {
      allowedUpdateData.answer = allowedUpdateData.answer.trim();
    }

    const updateResult = await FAQModel.findByIdAndUpdate(
      faqId,
      {
        ...allowedUpdateData,
        updatedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updateResult) {
      throw new AppError("FAQ not found", 404);
    }

    return {
      success: true,
      message: "FAQ updated successfully",
    };
  } catch (error) {
    console.error("Database error in updateFAQ:", error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(field => 
        `${field}: ${error.errors[field].message}`
      ).join(', ');
      throw new AppError(`Validation failed: ${validationErrors}`, 400);
    }
    
    throw new AppError("Failed to update FAQ", 500);
  }
};

/**
 * Delete FAQ
 * @param faqId - FAQ ID
 * @returns Promise<{success: boolean, message: string}>
 */
export const deleteFAQ = async (faqId: string): Promise<{success: boolean, message: string}> => {
  try {
    // Validate faqId format
    if (!mongoose.Types.ObjectId.isValid(faqId)) {
      throw new AppError("Invalid FAQ ID format", 400);
    }

    const deleteResult = await FAQModel.findByIdAndDelete(faqId);

    if (!deleteResult) {
      throw new AppError("FAQ not found", 404);
    }

    return {
      success: true,
      message: "FAQ deleted successfully",
    };
  } catch (error) {
    console.error("Database error in deleteFAQ:", error);
    throw new AppError("Failed to delete FAQ", 500);
  }
};

/**
 * Search FAQs
 * @param searchTerm - Search term
 * @param limit - Maximum results to return
 * @returns Promise<FAQ[]>
 */
export const searchFAQs = async (
  searchTerm: string,
  limit: number = 10
): Promise<FAQ[]> => {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new AppError("Search term must be at least 2 characters long", 400);
    }

    const faqs = await FAQModel.find({
      $or: [
        { question: { $regex: searchTerm.trim(), $options: "i" } },
        { answer: { $regex: searchTerm.trim(), $options: "i" } },
      ]
    })
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();

    return faqs;
  } catch (error) {
    console.error("Database error in searchFAQs:", error);
    throw new AppError("Failed to search FAQs", 500);
  }
};

/**
 * Bulk create FAQs
 * @param faqsData - Array of FAQ data
 * @returns Promise<{success: boolean, createdCount: number, errors: string[]}>
 */
export const bulkCreateFAQs = async (
  faqsData: Partial<FAQ>[]
): Promise<{success: boolean, createdCount: number, errors: string[]}> => {
  try {
    if (!Array.isArray(faqsData) || faqsData.length === 0) {
      throw new AppError("FAQs array is required and cannot be empty", 400);
    }

    let createdCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < faqsData.length; i++) {
      try {
        await createFAQ(faqsData[i]);
        createdCount++;
      } catch (error) {
        errors.push(`FAQ ${i + 1}: ${error.message}`);
      }
    }

    return {
      success: true,
      createdCount,
      errors,
    };
  } catch (error) {
    console.error("Database error in bulkCreateFAQs:", error);
    throw new AppError("Failed to bulk create FAQs", 500);
  }
};
