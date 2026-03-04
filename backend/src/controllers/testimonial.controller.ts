import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  createTestimonialService,
  deleteTestimonialService,
  getAllTestimonialsService,
  getTestimonialByIdService,
  updateTestimonialService,
} from "../services/testimonial.services";

export const getAllTestimonials = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = "" } = req.query;
    const isAdmin = req.user?.userType === "admin";

    if (Number(page) < 1 || Number(limit) < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    const result = await getAllTestimonialsService(
      Number(page),
      Number(limit),
      String(search),
      isAdmin
    );

    if (!result || result.testimonials.length === 0) {
      sendSuccessResponse(res, [], "No testimonials found", 200);
      return;
    }

    sendSuccessResponse(res, result, "Testimonials fetched successfully", 200);
    return;
  }
);

export const getTestimonialById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const isAdmin = req.user?.userType === "admin";
    
    if (!id) {
      throw new AppError("Testimonial ID is required", 400);
    }

    const result = await getTestimonialByIdService(id, isAdmin);
    if (!result) {
      sendSuccessResponse(res, [], "Testimonial not found", 200);
      return;
    }

    sendSuccessResponse(res, result, "Testimonial fetched successfully", 200);
    return;
  }
);

export const createTestimonial = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      name,
      currentRole,
      currentCompany,
      linkedin,
      pastRole,
      pastCompany,
      college,
      collegeUrl,
      collegeProfileUrl,
      companyUrl,
      companyProfileUrl,
      verified,
      profileImage,
      category,
      feedback,
      heading2,
    } = req.body;

    if (
      !name ||
      !currentRole ||
      !currentCompany ||
      !linkedin ||
      !pastRole ||
      !pastCompany ||
      !college
    ) {
      throw new AppError(
        "Name, current role, current company, LinkedIn, past role, past company, and college are required",
        400
      );
    }

    const result = await createTestimonialService({
      name,
      currentRole,
      currentCompany,
      linkedin,
      pastRole,
      pastCompany,
      college,
      collegeUrl,
      collegeProfileUrl,
      companyUrl,
      companyProfileUrl,
      verified,
      profileImage,
      category,
      feedback,
      heading2,
    });

    if (!result) {
      throw new AppError("Failed to create testimonial", 500);
    }

    sendSuccessResponse(res, result, "Testimonial created successfully", 201);
    return;
  }
);

export const updateTestimonial = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      name,
      currentRole,
      currentCompany,
      linkedin,
      pastRole,
      pastCompany,
      college,
      collegeUrl,
      collegeProfileUrl,
      companyUrl,
      companyProfileUrl,
      verified,
      profileImage,
      category,
      feedback,
      heading2,
    } = req.body;

    if (!id) {
      throw new AppError("Testimonial ID is required", 400);
    }

    if (
      !name &&
      !currentRole &&
      !currentCompany &&
      !linkedin &&
      !pastRole &&
      !pastCompany &&
      !college &&
      collegeUrl === undefined &&
      collegeProfileUrl === undefined &&
      companyUrl === undefined &&
      companyProfileUrl === undefined &&
      verified === undefined &&
      profileImage === undefined &&
      category === undefined &&
      feedback === undefined &&
      heading2 === undefined
    ) {
      throw new AppError("At least one field is required for update", 400);
    }

    const result = await updateTestimonialService(id, {
      name,
      currentRole,
      currentCompany,
      linkedin,
      pastRole,
      pastCompany,
      college,
      collegeUrl,
      collegeProfileUrl,
      companyUrl,
      companyProfileUrl,
      verified,
      profileImage,
      category,
      feedback,
      heading2,
    });

    if (!result) {
      throw new AppError("Failed to update testimonial", 500);
    }

    sendSuccessResponse(res, result, "Testimonial updated successfully", 200);
    return;
  }
);

export const deleteTestimonial = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new AppError("Testimonial ID is required", 400);
    }

    const result = await deleteTestimonialService(id);
    if (!result) {
      throw new AppError("Failed to delete testimonial", 500);
    }

    sendSuccessResponse(res, result, "Testimonial deleted successfully", 200);
    return;
  }
);
