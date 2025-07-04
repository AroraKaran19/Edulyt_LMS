import { Request, Response } from 'express';
import { CourseService } from '../services/course.service';
import { Course } from '../types/course';

export class CourseController {
  private courseService: CourseService;

  constructor() {
    this.courseService = new CourseService();
  }

  /**
   * Create a new course
   * @param req - Express request object
   * @param res - Express response object
   */
  createCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseData: Partial<Course> = req.body;

      // Validate course data
      const validation = this.courseService.validateCourseData(courseData);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
        return;
      }

      // Create the course
      const createdCourse = await this.courseService.createCourse(courseData);

      // Return success response
      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: {
          course: createdCourse
        }
      });

    } catch (error) {
      console.error('Error in createCourse controller:', error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('duplicate key')) {
          res.status(409).json({
            success: false,
            message: 'Course with this ID or slug already exists',
            error: error.message
          });
          return;
        }

        if (error.message.includes('validation')) {
          res.status(400).json({
            success: false,
            message: 'Invalid course data',
            error: error.message
          });
          return;
        }
      }

      // Generic error response
      res.status(500).json({
        success: false,
        message: 'Internal server error while creating course',
        error: process.env.NODE_ENV === 'development' ? error : 'Something went wrong'
      });
    }
  };


} 