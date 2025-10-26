import { FAQModel } from "../models/faq.schema";
import { FAQ } from "../types/faq";

export const getAllFAQsService = async (
  page: number,
  limit: number,
  search: string,
  isAdmin?: boolean
): Promise<{
  faqs: FAQ[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  const skip = (page - 1) * limit;

  let filters: any = {};


  // Search filter
  if (search) {
    filters.$or = [
      { question: { $regex: search, $options: "i" } },
      { answer: { $regex: search, $options: "i" } },
    ];
  }

  const faqs = await FAQModel.find(filters)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await FAQModel.countDocuments(filters);

  const totalPages = Math.ceil(total / limit);

  return {
    faqs,
    total,
    totalPages,
    page,
  };
};

export const getFAQByIdService = async (
  id: string,
  isAdmin?: boolean
): Promise<FAQ | null> => {
  const faq = await FAQModel.findById(id)
    .lean()
    .select(isAdmin ? "-__v" : "");

  if (!faq) {
    return null;
  }

  return faq as FAQ;
};

export const createFAQService = async (
  question: string,
  answer: string
): Promise<FAQ | null> => {
  const faq = new FAQModel({ question, answer });
  const savedFAQ = await faq.save();

  if (!savedFAQ) {
    return null;
  }

  return savedFAQ;
};

export const updateFAQService = async (
  id: string,
  updateData: { question?: string; answer?: string }
): Promise<FAQ | null> => {
  const faq = await FAQModel.findByIdAndUpdate(
    id,
    { ...updateData, updatedAt: new Date() },
    {
      runValidators: true,
      new: true,
    }
  );

  if (!faq) {
    return null;
  }

  return faq;
};

export const deleteFAQService = async (id: string): Promise<boolean | null> => {
  const faq = await FAQModel.findByIdAndDelete(id);
  if (!faq) {
    return null;
  }
  return true;
};
