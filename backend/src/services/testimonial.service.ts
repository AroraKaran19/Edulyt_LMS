import TestimonialModel from "../models/testimonial.schema";
import { Testimonial } from "../types/course";

/**
 * Get all testimonials with pagination and search
 */
export const getAllTestimonials = async (
  page: number = 1,
  limit: number = 10,
  search: string = ""
) => {
  try {
    const skip = (page - 1) * limit;
    
    // Build search query
    const searchQuery: any = {};
    if (search.trim()) {
      searchQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { currentRole: { $regex: search, $options: "i" } },
        { currentCompany: { $regex: search, $options: "i" } },
        { pastRole: { $regex: search, $options: "i" } },
        { pastCompany: { $regex: search, $options: "i" } },
        { college: { $regex: search, $options: "i" } },
      ];
    }

    const testimonials = await TestimonialModel.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalItems = await TestimonialModel.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalItems / limit);

    return {
      testimonials,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    throw new Error(`Failed to fetch testimonials: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

/**
 * Get testimonial by ID
 */
export const getTestimonialById = async (id: string) => {
  try {
    const testimonial = await TestimonialModel.findById(id).lean();
    
    if (!testimonial) {
      throw new Error("Testimonial not found");
    }

    return testimonial;
  } catch (error) {
    throw new Error(`Failed to fetch testimonial: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

/**
 * Create a new testimonial
 */
export const createTestimonial = async (testimonialData: Partial<Testimonial>) => {
  try {
    // Validate required fields
    const requiredFields = ["name", "currentRole", "currentCompany", "linkedin", "pastRole", "pastCompany", "college", "profileImage"];
    for (const field of requiredFields) {
      if (!testimonialData[field as keyof Testimonial]) {
        throw new Error(`${field} is required`);
      }
    }

    // Check for duplicate testimonial (same name and company combination)
    const existingTestimonial = await TestimonialModel.findOne({
      name: testimonialData.name,
      currentCompany: testimonialData.currentCompany,
    });

    if (existingTestimonial) {
      throw new Error("A testimonial from this person and company already exists");
    }

    const testimonial = new TestimonialModel(testimonialData);
    await testimonial.save();

    return testimonial.toObject();
  } catch (error) {
    throw new Error(`Failed to create testimonial: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

/**
 * Update a testimonial
 */
export const updateTestimonial = async (id: string, updateData: Partial<Testimonial>) => {
  try {
    const testimonial = await TestimonialModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!testimonial) {
      throw new Error("Testimonial not found");
    }

    return testimonial;
  } catch (error) {
    throw new Error(`Failed to update testimonial: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

/**
 * Delete a testimonial
 */
export const deleteTestimonial = async (id: string) => {
  try {
    const testimonial = await TestimonialModel.findByIdAndDelete(id);

    if (!testimonial) {
      throw new Error("Testimonial not found");
    }

    return { message: "Testimonial deleted successfully" };
  } catch (error) {
    throw new Error(`Failed to delete testimonial: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

/**
 * Get testimonials by IDs (for course testimonial selection)
 */
export const getTestimonialsByIds = async (ids: string[]) => {
  try {
    const testimonials = await TestimonialModel.find({
      _id: { $in: ids }
    }).lean();

    return testimonials;
  } catch (error) {
    throw new Error(`Failed to fetch testimonials by IDs: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

/**
 * Get verified testimonials only
 */
export const getVerifiedTestimonials = async (
  page: number = 1,
  limit: number = 10
) => {
  try {
    const skip = (page - 1) * limit;
    
    const testimonials = await TestimonialModel.find({ verified: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalItems = await TestimonialModel.countDocuments({ verified: true });
    const totalPages = Math.ceil(totalItems / limit);

    return {
      testimonials,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    throw new Error(`Failed to fetch verified testimonials: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};
