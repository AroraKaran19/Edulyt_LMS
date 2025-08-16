import { Request, Response } from "express";
import { InstructorService } from "../services/instructor.service";

export class InstructorController {
  private instructorService = new InstructorService();

  constructor() {
    this.instructorService = new InstructorService();
  }

  /**
   * Get all instructors
   * @param req - Request
   * @param res - Response
   */
  getAllInstructors = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const instructors = await this.instructorService.getAllInstructors(
        Number(page),
        Number(limit)
      );
      res.status(200).json({
        success: true,
        message: "Instructors fetched successfully",
        data: {
          instructors: instructors || [],
          pagination: {
            total: instructors?.length || 0,
            page: Number(page),
            limit: Number(limit),
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
    }
  };

  /**
   * Get instructor by id
   * @param req - Request
   * @param res - Response
   */
  getInstructorById = async (req: Request, res: Response) => {
    try {
      const instructorId = req.params.id;
      if (!instructorId) {
        res.status(400).json({
          success: false,
          message: "Instructor ID is required",
        });
        return;
      }
      const instructor = await this.instructorService.getInstructorById(
        instructorId
      );
      if (!instructor) {
        res.status(404).json({
          success: false,
          message: "Instructor not found",
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Instructor fetched successfully",
        data: instructor,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
    }
  };

  /**
   * Create instructor
   * @param req - Request
   * @param res - Response
   */
  createInstructor = async (req: Request, res: Response) => {
    try {
      const { email, fullName, profilePicture, password, currentPosition, currentCompany } = req.body;
      if (!email || !fullName || !profilePicture || !password || !currentPosition || !currentCompany) {
        res.status(400).json({
          success: false,
          message: "All fields are required",
        });
        return;
      }
      const instructor = await this.instructorService.createInstructor({
        email,
        fullName,
        profilePicture,
        password,
        currentPosition,
        currentCompany,
      });
      if (!instructor) {
        res.status(400).json({
          success: false,
          message: "Instructor not created",
        });
        return;
      }
      res.status(201).json({
        success: true,
        message: "Instructor created successfully",
        data: instructor,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
    }
  };

  /**
   * Update instructor
   * @param req - Request
   * @param res - Response
   */
  updateInstructor = async (req: Request, res: Response) => {
    try {
      const instructorId = req.params.id;
			const { data } = req.body;
      if (!instructorId) {
        res.status(400).json({
          success: false,
          message: "Instructor ID is required",
        });
        return;
      }
      if (!data) {
        res.status(400).json({
          success: false,
          message: "Instructor data is required",
        });
        return;
      }
      const instructor = await this.instructorService.updateInstructor(instructorId, data);
      if (!instructor) {
        res.status(400).json({
          success: false,
          message: "Instructor not updated",
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Instructor updated successfully",
        data: instructor,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
    }
  };

  /**
   * Delete instructor
   * @param req - Request
   * @param res - Response
   */
  deleteInstructor = async (req: Request, res: Response) => {
    try {
      const instructorId = req.params.id;
      if (!instructorId) {
        res.status(400).json({
          success: false,
          message: "Instructor ID is required",
        });
        return;
      }
      const instructor = await this.instructorService.deleteInstructor(instructorId);
      if (!instructor) {
        res.status(400).json({
          success: false,
          message: "Instructor not deleted",
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Instructor deleted successfully",
        data: instructor,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
    }
  };
}
