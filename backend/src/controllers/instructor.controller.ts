import { Request, Response } from 'express';
import { InstructorModel, IInstructor } from '../models/instructor.schema';

export class InstructorController {
  /**
   * Get all instructors
   * @param req - Express request object
   * @param res - Express response object
   */
  getAllInstructors = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;

      // Validate pagination parameters
      if (page < 1) {
        res.status(400).json({
          success: false,
          message: 'Page number must be greater than 0'
        });
        return;
      }

      if (limit < 1 || limit > 100) {
        res.status(400).json({
          success: false,
          message: 'Limit must be between 1 and 100'
        });
        return;
      }

      // Build query
      const query: any = {};
      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }

      // Calculate skip value for pagination
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const total = await InstructorModel.countDocuments(query);

      // Get instructors with pagination
      const instructors = await InstructorModel.find(query)
        .sort({ rating: -1, totalStudents: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        message: 'Instructors retrieved successfully',
        data: {
          instructors,
          pagination: {
            total,
            page,
            totalPages,
            limit,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      console.error('Error in getAllInstructors:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching instructors',
        error: process.env.NODE_ENV === 'development' ? error : 'Something went wrong'
      });
    }
  };

  /**
   * Get instructor by ID
   * @param req - Express request object
   * @param res - Express response object
   */
  getInstructorById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { instructorId } = req.params;

      if (!instructorId?.trim()) {
        res.status(400).json({
          success: false,
          message: 'Instructor ID is required'
        });
        return;
      }

      const instructor = await InstructorModel.findById(instructorId).lean();

      if (!instructor) {
        res.status(404).json({
          success: false,
          message: 'Instructor not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Instructor retrieved successfully',
        data: instructor
      });

    } catch (error) {
      console.error('Error in getInstructorById:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching instructor',
        error: process.env.NODE_ENV === 'development' ? error : 'Something went wrong'
      });
    }
  };

  /**
   * Create new instructor
   * @param req - Express request object
   * @param res - Express response object
   */
  createInstructor = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name,
        profileImage,
        experience,
        bio,
        currentPosition,
        previousExperience,
        education,
        linkedinUrl
      } = req.body;

      // Create instructor data (let MongoDB handle validation and unique constraints)
      const instructorData: Partial<IInstructor> = {
        name: name?.trim(),
        profileImage: profileImage?.trim(),
        experience: experience?.trim(),
        bio: bio?.trim(),
        currentPosition: currentPosition?.trim(),
        previousExperience: previousExperience || [],
        education: education || [],
        linkedinUrl: linkedinUrl?.trim(),
        rating: 0,
        totalStudents: 0,
        totalCourses: 0
      };

      // Create the instructor (MongoDB will handle ID generation and uniqueness)
      const instructor = new InstructorModel(instructorData);
      const savedInstructor = await instructor.save();
      console.log(`✅ Successfully created instructor with ID: ${savedInstructor._id}`);

      res.status(201).json({
        success: true,
        message: 'Instructor created successfully',
        data: savedInstructor
      });

    } catch (error: any) {
      console.error('Error in createInstructor:', error);
      
      // Handle MongoDB duplicate key errors (E11000)
      if (error.code === 11000) {
        // Extract field name from error message for better user experience
        let field = 'data';
        let detailedMessage = error.message;
        
        if (error.message.includes('linkedinUrl')) {
          field = 'LinkedIn URL';
        }
        
        res.status(409).json({
          success: false,
          message: `An instructor with this ${field} already exists`,
          debug: process.env.NODE_ENV === 'development' ? detailedMessage : undefined
        });
        return;
      }

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err: any) => err.message);
        res.status(400).json({
          success: false,
          message: 'Invalid instructor data',
          errors: validationErrors
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while creating instructor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  };

  /**
   * Update instructor
   * @param req - Express request object
   * @param res - Express response object
   */
  updateInstructor = async (req: Request, res: Response): Promise<void> => {
    try {
      const { instructorId } = req.params;
      const updateData = req.body;

      if (!instructorId?.trim()) {
        res.status(400).json({
          success: false,
          message: 'Instructor ID is required'
        });
        return;
      }

      if (!updateData || Object.keys(updateData).length === 0) {
        res.status(400).json({
          success: false,
          message: 'Update data is required'
        });
        return;
      }

      // Remove fields that shouldn't be updated directly
      delete updateData._id;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      const updatedInstructor = await InstructorModel.findByIdAndUpdate(
        instructorId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).lean();

      if (!updatedInstructor) {
        res.status(404).json({
          success: false,
          message: 'Instructor not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Instructor updated successfully',
        data: updatedInstructor
      });

    } catch (error) {
      console.error('Error in updateInstructor:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while updating instructor',
        error: process.env.NODE_ENV === 'development' ? error : 'Something went wrong'
      });
    }
  };

  /**
   * Delete instructor
   * @param req - Express request object
   * @param res - Express response object
   */
  deleteInstructor = async (req: Request, res: Response): Promise<void> => {
    try {
      const { instructorId } = req.params;

      if (!instructorId?.trim()) {
        res.status(400).json({
          success: false,
          message: 'Instructor ID is required'
        });
        return;
      }

      const deletedInstructor = await InstructorModel.findByIdAndDelete(instructorId);

      if (!deletedInstructor) {
        res.status(404).json({
          success: false,
          message: 'Instructor not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Instructor deleted successfully',
        data: { instructorId }
      });

    } catch (error) {
      console.error('Error in deleteInstructor:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while deleting instructor',
        error: process.env.NODE_ENV === 'development' ? error : 'Something went wrong'
      });
    }
  };

  /**
   * Get top rated instructors
   * @param req - Express request object
   * @param res - Express response object
   */
  getTopInstructors = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const instructors = await InstructorModel.find()
        .sort({ rating: -1, totalStudents: -1 })
        .limit(limit)
        .lean();

      res.status(200).json({
        success: true,
        message: 'Top instructors retrieved successfully',
        data: instructors
      });

    } catch (error) {
      console.error('Error in getTopInstructors:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching top instructors',
        error: process.env.NODE_ENV === 'development' ? error : 'Something went wrong'
      });
    }
  };


} 