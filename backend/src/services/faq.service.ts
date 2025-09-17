import { FAQModel } from "../models/faq.schema";
import { FAQ } from "../types/faq";
import { AppError } from "../middlewares/error.middleware";

/**
 * Get all FAQs with pagination and search
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @param search - Search term for question and answer
 * @returns Object with FAQs array and pagination info
 */
export const getAllFAQs = async (
  page: number = 1,
  limit: number = 10,
  search: string = ""
) => {
  try {
    // Validate pagination parameters
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page
    const skip = (validatedPage - 1) * validatedLimit;

    // Build search query
    let searchQuery = {};
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      searchQuery = {
        $or: [
          { question: { $regex: searchRegex } },
          { answer: { $regex: searchRegex } }
        ]
      };
    }

    // Execute queries in parallel
    const [faqs, total] = await Promise.all([
      FAQModel.find(searchQuery)
        .sort({ createdAt: -1 }) // Most recent first
        .skip(skip)
        .limit(validatedLimit)
        .lean(),
      FAQModel.countDocuments(searchQuery)
    ]);

    return {
      faqs,
      pagination: {
        currentPage: validatedPage,
        totalPages: Math.ceil(total / validatedLimit),
        totalItems: total,
        itemsPerPage: validatedLimit,
        hasNext: validatedPage * validatedLimit < total,
        hasPrev: validatedPage > 1
      }
    };
  } catch (error) {
    console.error("Error in getAllFAQs:", error);
    throw new AppError("Failed to fetch FAQs", 500);
  }
};

/**
 * Get FAQ by ID
 * @param id - FAQ ID
 * @returns FAQ object
 */
export const getFAQById = async (id: string): Promise<FAQ> => {
  try {
    if (!id) {
      throw new AppError("FAQ ID is required", 400);
    }

    const faq = await FAQModel.findById(id).lean();

    if (!faq) {
      throw new AppError("FAQ not found", 404);
    }

    return faq;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Error in getFAQById:", error);
    throw new AppError("Failed to fetch FAQ", 500);
  }
};

/**
 * Create a new FAQ
 * @param faqData - FAQ data (question and answer)
 * @returns Created FAQ object
 */
export const createFAQ = async (faqData: {
  question: string;
  answer: string;
}): Promise<FAQ> => {
  try {
    const { question, answer } = faqData;

    // Validate required fields
    if (!question || !question.trim()) {
      throw new AppError("Question is required", 400);
    }

    if (!answer || !answer.trim()) {
      throw new AppError("Answer is required", 400);
    }

    // Check for duplicate questions (case-insensitive)
    const existingFAQ = await FAQModel.findOne({
      question: { $regex: new RegExp(`^${question.trim()}$`, "i") }
    });

    if (existingFAQ) {
      throw new AppError("FAQ with this question already exists", 409);
    }

    // Create new FAQ
    const newFAQ = new FAQModel({
      question: question.trim(),
      answer: answer.trim()
    });

    const savedFAQ = await newFAQ.save();
    return savedFAQ.toObject();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Error in createFAQ:", error);
    throw new AppError("Failed to create FAQ", 500);
  }
};

/**
 * Update an existing FAQ
 * @param id - FAQ ID
 * @param updateData - Updated FAQ data
 * @returns Updated FAQ object
 */
export const updateFAQ = async (
  id: string,
  updateData: {
    question?: string;
    answer?: string;
  }
): Promise<FAQ> => {
  try {
    if (!id) {
      throw new AppError("FAQ ID is required", 400);
    }

    const { question, answer } = updateData;

    // Validate at least one field is provided
    if (!question && !answer) {
      throw new AppError("At least one field (question or answer) is required", 400);
    }

    // Build update object
    const updateFields: any = {};
    if (question && question.trim()) {
      updateFields.question = question.trim();
    }
    if (answer && answer.trim()) {
      updateFields.answer = answer.trim();
    }

    // Check for duplicate questions if updating question
    if (updateFields.question) {
      const existingFAQ = await FAQModel.findOne({
        _id: { $ne: id },
        question: { $regex: new RegExp(`^${updateFields.question}$`, "i") }
      });

      if (existingFAQ) {
        throw new AppError("FAQ with this question already exists", 409);
      }
    }

    // Update FAQ
    const updatedFAQ = await FAQModel.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    ).lean();

    if (!updatedFAQ) {
      throw new AppError("FAQ not found", 404);
    }

    return updatedFAQ;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Error in updateFAQ:", error);
    throw new AppError("Failed to update FAQ", 500);
  }
};

/**
 * Delete an FAQ
 * @param id - FAQ ID
 * @returns Success message
 */
export const deleteFAQ = async (id: string): Promise<{ message: string }> => {
  try {
    if (!id) {
      throw new AppError("FAQ ID is required", 400);
    }

    const deletedFAQ = await FAQModel.findByIdAndDelete(id);

    if (!deletedFAQ) {
      throw new AppError("FAQ not found", 404);
    }

    return { message: "FAQ deleted successfully" };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Error in deleteFAQ:", error);
    throw new AppError("Failed to delete FAQ", 500);
  }
};

/**
 * Get FAQs by IDs (for course FAQ selection)
 * @param ids - Array of FAQ IDs
 * @returns Array of FAQ objects
 */
export const getFAQsByIds = async (ids: string[]): Promise<FAQ[]> => {
  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return [];
    }

    const faqs = await FAQModel.find({
      _id: { $in: ids }
    }).lean();

    return faqs;
  } catch (error) {
    console.error("Error in getFAQsByIds:", error);
    throw new AppError("Failed to fetch FAQs by IDs", 500);
  }
};
