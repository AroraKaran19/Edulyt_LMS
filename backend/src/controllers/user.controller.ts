import { Request, Response } from 'express';
import { UserModel, IUser } from '../models/user.schema';

export class UserController {

  /**
   * Get user profile
   */
  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.userId || (req as any).user?.userId;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
        return;
      }

      const user = await UserModel.findById(userId)
        .populate('enrolledCourses', 'title thumbnail slug category skillLevel')
        .populate('completedCourses', 'title thumbnail slug category')
        .populate('createdCourses', 'title thumbnail slug category enrolledCount')
        .populate('certificates', 'courseId issuedAt certificateUrl');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: user.toPublicJSON()
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving profile'
      });
    }
  };

  /**
   * Update user profile
   */
  updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.userId || (req as any).user?.userId;
      const updates = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
        return;
      }

      // Remove sensitive fields that shouldn't be updated via this endpoint
      const {
        password,
        email,
        role,
        isActive,
        isEmailVerified,
        refreshTokens,
        passwordResetToken,
        passwordResetExpires,
        emailVerificationToken,
        emailVerificationExpires,
        providers,
        ...allowedUpdates
      } = updates;

      const user = await UserModel.findByIdAndUpdate(
        userId,
        { 
          ...allowedUpdates,
          updatedAt: new Date()
        },
        { 
          new: true,
          runValidators: true
        }
      ).populate('enrolledCourses', 'title thumbnail slug')
       .populate('completedCourses', 'title thumbnail slug');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: user.toPublicJSON()
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      
      if (error instanceof Error && error.message.includes('validation')) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          error: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while updating profile'
      });
    }
  };

  /**
   * Update user preferences
   */
  updatePreferences = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const { preferences } = req.body;

      if (!preferences) {
        res.status(400).json({
          success: false,
          message: 'Preferences data is required'
        });
        return;
      }

      const user = await UserModel.findByIdAndUpdate(
        userId,
        { 
          preferences: {
            ...preferences
          },
          updatedAt: new Date()
        },
        { 
          new: true,
          runValidators: true
        }
      );

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Preferences updated successfully',
        data: {
          preferences: user.preferences
        }
      });

    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while updating preferences'
      });
    }
  };

  /**
   * Upload user avatar
   */
  updateAvatar = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const { avatarUrl } = req.body;

      if (!avatarUrl) {
        res.status(400).json({
          success: false,
          message: 'Avatar URL is required'
        });
        return;
      }

      const user = await UserModel.findByIdAndUpdate(
        userId,
        { 
          avatar: avatarUrl,
          profileImage: avatarUrl,
          updatedAt: new Date()
        },
        { 
          new: true
        }
      );

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Avatar updated successfully',
        data: {
          avatar: user.avatar,
          profileImage: user.profileImage
        }
      });

    } catch (error) {
      console.error('Update avatar error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while updating avatar'
      });
    }
  };

  /**
   * Get user's enrolled courses
   */
  getEnrolledCourses = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.userId || (req as any).user?.userId;
      const { page = 1, limit = 10, status = 'all' } = req.query;

      const user = await UserModel.findById(userId)
        .populate({
          path: 'enrolledCourses',
          select: 'title description thumbnail category skillLevel instructor duration enrolledCount totalRatings averageRating',
          populate: {
            path: 'instructor',
            select: 'name profileImage'
          }
        });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      let courses = user.enrolledCourses;

      // Filter by status if needed
      if (status === 'completed') {
        courses = courses.filter(courseId => 
          user.completedCourses.includes(courseId)
        );
      } else if (status === 'in-progress') {
        courses = courses.filter(courseId => 
          !user.completedCourses.includes(courseId)
        );
      }

      // Pagination
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedCourses = courses.slice(startIndex, endIndex);

      res.status(200).json({
        success: true,
        message: 'Enrolled courses retrieved successfully',
        data: {
          courses: paginatedCourses,
          pagination: {
            current: Number(page),
            totalPages: Math.ceil(courses.length / Number(limit)),
            total: courses.length,
            hasNext: endIndex < courses.length,
            hasPrev: startIndex > 0
          }
        }
      });

    } catch (error) {
      console.error('Get enrolled courses error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving enrolled courses'
      });
    }
  };

  /**
   * Enroll in a course
   */
  enrollInCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const { courseId } = req.body;

      if (!courseId) {
        res.status(400).json({
          success: false,
          message: 'Course ID is required'
        });
        return;
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Check if already enrolled
      if (user.enrolledCourses.includes(courseId)) {
        res.status(400).json({
          success: false,
          message: 'Already enrolled in this course'
        });
        return;
      }

      // Add course to enrolled courses
      user.enrolledCourses.push(courseId);
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Successfully enrolled in course',
        data: {
          courseId,
          enrolledAt: new Date()
        }
      });

    } catch (error) {
      console.error('Course enrollment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during course enrollment'
      });
    }
  };

  /**
   * Mark course as completed
   */
  completeCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const { courseId } = req.body;

      if (!courseId) {
        res.status(400).json({
          success: false,
          message: 'Course ID is required'
        });
        return;
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Check if enrolled in course
      if (!user.enrolledCourses.includes(courseId)) {
        res.status(400).json({
          success: false,
          message: 'Not enrolled in this course'
        });
        return;
      }

      // Check if already completed
      if (user.completedCourses.includes(courseId)) {
        res.status(400).json({
          success: false,
          message: 'Course already completed'
        });
        return;
      }

      // Add to completed courses
      user.completedCourses.push(courseId);
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Course marked as completed',
        data: {
          courseId,
          completedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Course completion error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during course completion'
      });
    }
  };

  /**
   * Get user statistics
   */
  getUserStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.userId || (req as any).user?.userId;

      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const stats = {
        totalEnrolled: user.enrolledCourses.length,
        totalCompleted: user.completedCourses.length,
        totalCertificates: user.certificates.length,
        totalCreated: user.createdCourses.length,
        completionRate: user.enrolledCourses.length > 0 
          ? Math.round((user.completedCourses.length / user.enrolledCourses.length) * 100)
          : 0,
        joinDate: user.createdAt,
        lastLogin: user.lastLoginAt,
        loginCount: user.loginCount
      };

      res.status(200).json({
        success: true,
        message: 'User statistics retrieved successfully',
        data: { stats }
      });

    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving user statistics'
      });
    }
  };

  /**
   * Search users (admin only)
   */
  searchUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        q = '', 
        role = 'all', 
        status = 'all', 
        page = 1, 
        limit = 20 
      } = req.query;

      // Build search query
      const searchQuery: any = {};

      if (q) {
        searchQuery.$or = [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { username: { $regex: q, $options: 'i' } }
        ];
      }

      if (role !== 'all') {
        searchQuery.role = role;
      }

      if (status === 'active') {
        searchQuery.isActive = true;
      } else if (status === 'inactive') {
        searchQuery.isActive = false;
      } else if (status === 'verified') {
        searchQuery.isEmailVerified = true;
      } else if (status === 'unverified') {
        searchQuery.isEmailVerified = false;
      }

      const users = await UserModel.find(searchQuery)
        .select('name email username role isActive isEmailVerified createdAt lastLoginAt')
        .sort({ createdAt: -1 })
        .limit(Number(limit) * Number(page))
        .skip((Number(page) - 1) * Number(limit));

      const total = await UserModel.countDocuments(searchQuery);

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users,
          pagination: {
            current: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            total,
            hasNext: Number(page) * Number(limit) < total,
            hasPrev: Number(page) > 1
          }
        }
      });

    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while searching users'
      });
    }
  };

  /**
   * Delete user account
   */
  deleteAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.userId || (req as any).user?.userId;
      const { confirmPassword } = req.body;

      if (!confirmPassword) {
        res.status(400).json({
          success: false,
          message: 'Password confirmation is required'
        });
        return;
      }

      const user = await UserModel.findById(userId).select('+password');
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(confirmPassword);
      if (!isPasswordValid) {
        res.status(400).json({
          success: false,
          message: 'Invalid password'
        });
        return;
      }

      // Soft delete (set deletedAt)
      user.deletedAt = new Date();
      user.isActive = false;
      user.refreshTokens = [];
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Account deleted successfully'
      });

    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while deleting account'
      });
    }
  };
} 