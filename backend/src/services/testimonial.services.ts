import TestimonialModel from "../models/testimonial.schema";
import { Testimonial } from "../types/course";

export const getAllTestimonialsService = async (
  page: number,
  limit: number,
  search: string,
  isAdmin?: boolean
): Promise<{
  testimonials: Testimonial[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  const skip = (page - 1) * limit;

  let filters: any = {};

  // Verified filter - only show verified testimonials for non-admin users
  if (!isAdmin) {
    filters.verified = true;
  }

  // Search filter
  if (search) {
    filters.$or = [
      { name: { $regex: search, $options: "i" } },
      { currentRole: { $regex: search, $options: "i" } },
      { currentCompany: { $regex: search, $options: "i" } },
      { pastRole: { $regex: search, $options: "i" } },
      { pastCompany: { $regex: search, $options: "i" } },
      { college: { $regex: search, $options: "i" } },
    ];
  }

  const testimonials = await TestimonialModel.find(filters)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await TestimonialModel.countDocuments(filters);

  const totalPages = Math.ceil(total / limit);

  return {
    testimonials,
    total,
    totalPages,
    page,
  };
};

export const getTestimonialByIdService = async (
  id: string,
  isAdmin?: boolean
): Promise<Testimonial | null> => {
  const testimonial = await TestimonialModel.findById(id)
    .where(isAdmin ? {} : { verified: true });

  if (!testimonial) {
    return null;
  }

  return testimonial as Testimonial;
};

export const createTestimonialService = async (testimonialData: {
  name: string;
  currentRole: string;
  currentCompany: string;
  linkedin: string;
  pastRole: string;
  pastCompany: string;
  college: string;
  collegeUrl?: string;
  collegeProfileUrl?: string;
  companyUrl?: string;
  companyProfileUrl?: string;
  verified?: boolean;
  profileImage?: string;
  category?: "college-students" | "professionals" | "internships";
  feedback?: string;
  heading2?: string;
}): Promise<Testimonial | null> => {
  const testimonial = new TestimonialModel(testimonialData);
  const savedTestimonial = await testimonial.save();

  if (!savedTestimonial) {
    return null;
  }

  return savedTestimonial;
};

export const updateTestimonialService = async (
  id: string,
  updateData: {
    name?: string;
    currentRole?: string;
    currentCompany?: string;
    linkedin?: string;
    pastRole?: string;
    pastCompany?: string;
    college?: string;
    collegeUrl?: string;
    collegeProfileUrl?: string;
    companyUrl?: string;
    companyProfileUrl?: string;
    verified?: boolean;
    profileImage?: string;
    category?: "college-students" | "professionals" | "internships";
    feedback?: string;
    heading2?: string;
  }
): Promise<Testimonial | null> => {
  const testimonial = await TestimonialModel.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!testimonial) {
    return null;
  }

  return testimonial as Testimonial;
};

export const deleteTestimonialService = async (
  id: string
): Promise<Testimonial | null> => {
  const testimonial = await TestimonialModel.findByIdAndDelete(id);

  if (!testimonial) {
    return null;
  }

  return testimonial as Testimonial;
};
