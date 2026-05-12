import { PartnerCollegeModel } from "../models/partnerCollege.schema";
import { PartnerCollege } from "../types/partner-college";

export const createPartnerCollegeService = async (
  partnerCollegeData: Omit<PartnerCollege, "_id">,
): Promise<PartnerCollege> => {
  const partnerCollege = new PartnerCollegeModel(partnerCollegeData);
  await partnerCollege.save();
  return partnerCollege.toObject();
};

export const getAllPartnerCollegesService = async (filters: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{
  partnerColleges: PartnerCollege[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const search = filters.search || "";

  const query: any = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { website: { $regex: search, $options: "i" } },
    ];
  }

  const total = await PartnerCollegeModel.countDocuments(query);
  const partnerColleges = await PartnerCollegeModel.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    partnerColleges: partnerColleges as PartnerCollege[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

export const getPartnerCollegeByIdService = async (
  id: string,
): Promise<PartnerCollege | null> => {
  const partnerCollege = await PartnerCollegeModel.findById(id).lean();
  return partnerCollege as PartnerCollege | null;
};

export const updatePartnerCollegeService = async (
  id: string,
  updateData: Partial<PartnerCollege>,
): Promise<PartnerCollege | null> => {
  const partnerCollege = await PartnerCollegeModel.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true },
  ).lean();
  return partnerCollege as PartnerCollege | null;
};

export const deletePartnerCollegeService = async (
  id: string,
): Promise<void> => {
  await PartnerCollegeModel.findByIdAndDelete(id);
};
