import { AppError } from "../middlewares/error.middleware";
import { InstructorModel } from "../models";
import { Instructor } from "../types";

export interface GetInstructorsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetInstructorsResult {
  instructors: Instructor[];
  total: number;
  page: number;
  totalPages: number;
}

export const getAllInstructorsService = async (
  params: GetInstructorsParams = {}
): Promise<GetInstructorsResult> => {
  const { page = 1, limit = 10, search = "" } = params;
  const skip = (page - 1) * limit;

  let filters: any = {
    userType: "instructor",
    status: "active", // Only fetch active instructors
  };

  if (search) {
    filters.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { currentPosition: { $regex: search, $options: "i" } },
      { currentCompany: { $regex: search, $options: "i" } },
    ];
  }

  try {
    const instructors = await InstructorModel.find(filters)
      .select("-password -refreshTokens -permissions") // Exclude sensitive data
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await InstructorModel.countDocuments(filters);
    const totalPages = Math.ceil(total / limit);

    return {
      instructors: instructors as Instructor[],
      total,
      page,
      totalPages,
    };
  } catch (error) {
    console.error("Database error in getAllInstructorsService:", error);
    throw new AppError(
      `Failed to fetch instructors: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

export const getInstructorByIdService = async (
  instructorId: string
): Promise<Instructor | null> => {
  try {
    const instructor = await InstructorModel.findOne({
      _id: instructorId,
      userType: "instructor",
      status: "active",
    })
      .select("-password -refreshTokens -permissions") // Exclude sensitive data
      .lean();

    return instructor as Instructor | null;
  } catch (error) {
    console.error("Database error in getInstructorByIdService:", error);
    throw new AppError(
      `Failed to fetch instructor: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

export const getInstructorsByIdsService = async (
  instructorIds: string[]
): Promise<Instructor[]> => {
  try {
    const instructors = await InstructorModel.find({
      _id: { $in: instructorIds },
      userType: "instructor",
      status: "active",
    })
      .select("-password -refreshTokens -permissions") // Exclude sensitive data
      .lean();

    return instructors as Instructor[];
  } catch (error) {
    console.error("Database error in getInstructorsByIdsService:", error);
    throw new AppError(
      `Failed to fetch instructors: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};
