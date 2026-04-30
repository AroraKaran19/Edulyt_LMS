import { Request, Response } from "express";
import {
  createPartnerCollegeService,
  getAllPartnerCollegesService,
  getPartnerCollegeByIdService,
  updatePartnerCollegeService,
  deletePartnerCollegeService,
} from "../services/partnerCollege.services";
import { PartnerCollege } from "../types/partner-college";

export const createPartnerCollege = async (req: Request, res: Response) => {
  try {
    const partnerCollegeData: Omit<PartnerCollege, "_id"> = req.body;
    const partnerCollege = await createPartnerCollegeService(partnerCollegeData);
    res.status(201).json({
      success: true,
      message: "Partner college created successfully",
      data: partnerCollege,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: "Failed to create partner college",
      error: { message: error.message },
    });
  }
};

export const getAllPartnerColleges = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";

    const result = await getAllPartnerCollegesService({ page, limit, search });
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: "Failed to fetch partner colleges",
      error: { message: error.message },
    });
  }
};

export const getPartnerCollegeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const partnerCollege = await getPartnerCollegeByIdService(id);
    if (!partnerCollege) {
      return res.status(404).json({
        success: false,
        message: "Partner college not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: partnerCollege,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: "Failed to fetch partner college",
      error: { message: error.message },
    });
  }
};

export const updatePartnerCollege = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: Partial<PartnerCollege> = req.body;
    const partnerCollege = await updatePartnerCollegeService(id, updateData);
    if (!partnerCollege) {
      return res.status(404).json({
        success: false,
        message: "Partner college not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Partner college updated successfully",
      data: partnerCollege,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: "Failed to update partner college",
      error: { message: error.message },
    });
  }
};

export const deletePartnerCollege = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deletePartnerCollegeService(id);
    res.status(200).json({
      success: true,
      message: "Partner college deleted successfully",
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: "Failed to delete partner college",
      error: { message: error.message },
    });
  }
};
