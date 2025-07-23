import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserModel, IUser } from '../models/user.schema';
import { sendEmail, generateTokens, verifyRefreshToken } from '../services';

export class AuthController {
  
  /**
   * Register a new user
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, name, firstName, lastName, username, role = 'student' } = req.body;

      // Validation
      if (!email || !password || !name) {
        res.status(400).json({
          success: false,
          message: 'Email, password, and name are required'
        });
        return;
      }

      // Check if user already exists
      const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
        return;
      }

      // Check username uniqueness if provided
      if (username) {
        const existingUsername = await UserModel.findOne({ username: username.toLowerCase() });
        if (existingUsername) {
          res.status(409).json({
            success: false,
            message: 'Username already taken'
          });
          return;
        }
      }

      // Create user
      const userData: Partial<IUser> = {
        email: email.toLowerCase(),
        password,
        name,
        firstName,
        lastName,
        username: username?.toLowerCase(),
        role: role || 'student',
        isActive: true,
        isEmailVerified: false,
        loginCount: 0,
        preferences: {
          language: 'en',
          timezone: 'UTC',
          emailNotifications: true,
          marketingEmails: false,
          theme: 'light'
        }
      };

      const user = new UserModel(userData);
      
      // Generate email verification token
      const emailVerificationToken = user.generateEmailVerificationToken();
      
      await user.save();

      // Send verification email
      try {
        await sendEmail({
          to: user.email,
          subject: 'Verify Your Email - Edulyt LMS',
          template: 'email-verification',
          data: {
            name: user.name,
            verificationUrl: `${process.env.FRONTEND_URL}/auth/verify-email?token=${emailVerificationToken}`
          }
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user._id, user.role);
      
      // Store refresh token
      user.refreshTokens.push(refreshToken);
      await user.save();

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email for verification.',
        data: {
          user: user.toPublicJSON(),
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Login user
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, rememberMe = false } = req.body;

      // Validation
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
        return;
      }

      // Find user and include password for comparison
      const user = await UserModel.findOne({ 
        email: email.toLowerCase() 
      }).select('+password');

      if (!user || !user.password) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
        return;
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
        return;
      }

      // Check if account is active
      if (!user.isActive) {
        res.status(403).json({
          success: false,
          message: 'Account is deactivated. Please contact support.'
        });
        return;
      }

      // Update login info
      user.lastLoginAt = new Date();
      user.loginCount += 1;

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(
        user._id, 
        user.role, 
        rememberMe ? '7d' : undefined
      );
      
      // Store refresh token
      user.refreshTokens.push(refreshToken);
      
      // Limit refresh tokens per user (security measure)
      if (user.refreshTokens.length > 5) {
        user.refreshTokens = user.refreshTokens.slice(-5);
      }
      
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.toPublicJSON(),
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login'
      });
    }
  };

  /**
   * OAuth login/register
   */
  oauthCallback = async (req: Request, res: Response): Promise<void> => {
    try {
      const { provider, providerData } = req.body;
      
      if (!provider || !providerData) {
        res.status(400).json({
          success: false,
          message: 'Provider and provider data are required'
        });
        return;
      }

      const { id, email, name, username, picture } = providerData;

      // Check if user exists with this OAuth provider
      let user = await UserModel.findOne({
        [`providers.${provider}.id`]: id
      });

      // If not found by provider ID, check by email
      if (!user && email) {
        user = await UserModel.findOne({ email: email.toLowerCase() });
        
        // If user exists with email, link the OAuth account
        if (user) {
          user.providers = user.providers || {};
          user.providers[provider as keyof typeof user.providers] = {
            id,
            email,
            ...(username && { username }),
            ...(provider === 'google' && { verified: true })
          } as any;
          
          // Update profile image if not set
          if (picture && !user.profileImage) {
            user.profileImage = picture;
          }
          
          await user.save();
        }
      }

      // Create new user if doesn't exist
      if (!user) {
        const userData: Partial<IUser> = {
          email: email?.toLowerCase(),
          name: name || `${provider} User`,
          username: username?.toLowerCase(),
          profileImage: picture,
          role: 'student',
          isActive: true,
          isEmailVerified: email ? true : false, // OAuth emails are usually verified
          providers: {
            [provider]: {
              id,
              email,
              ...(username && { username }),
              ...(provider === 'google' && { verified: true })
            }
          } as any,
          loginCount: 0,
          preferences: {
            language: 'en',
            timezone: 'UTC',
            emailNotifications: true,
            marketingEmails: false,
            theme: 'light'
          }
        };

        user = new UserModel(userData);
      }

      // Update login info
      user.lastLoginAt = new Date();
      user.loginCount += 1;

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user._id, user.role);
      
      // Store refresh token
      user.refreshTokens.push(refreshToken);
      if (user.refreshTokens.length > 5) {
        user.refreshTokens = user.refreshTokens.slice(-5);
      }
      
      await user.save();

      res.status(200).json({
        success: true,
        message: user.isNew ? 'Account created and logged in successfully' : 'Login successful',
        data: {
          user: user.toPublicJSON(),
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
        }
      });

    } catch (error) {
      console.error('OAuth callback error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during OAuth authentication'
      });
    }
  };

  /**
   * Refresh access token
   */
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
        return;
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
        return;
      }

      // Find user and check if refresh token exists
      const user = await UserModel.findById(decoded.userId);
      if (!user || !user.refreshTokens.includes(refreshToken)) {
        res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
        return;
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = generateTokens(
        user._id, 
        user.role
      );

      // Replace old refresh token with new one
      const tokenIndex = user.refreshTokens.indexOf(refreshToken);
      user.refreshTokens[tokenIndex] = newRefreshToken;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
        }
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during token refresh'
      });
    }
  };

  /**
   * Logout user
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      // Remove refresh token from user's token list
      if (refreshToken) {
        await UserModel.findByIdAndUpdate(
          userId,
          { $pull: { refreshTokens: refreshToken } }
        );
      }

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during logout'
      });
    }
  };

  /**
   * Logout from all devices
   */
  logoutAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      // Clear all refresh tokens
      await UserModel.findByIdAndUpdate(
        userId,
        { $set: { refreshTokens: [] } }
      );

      res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully'
      });

    } catch (error) {
      console.error('Logout all error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during logout'
      });
    }
  };

  /**
   * Get current user session
   */
  getSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'No active session'
        });
        return;
      }

      const user = await UserModel.findById(userId)
        .populate('enrolledCourses', 'title thumbnail slug')
        .populate('completedCourses', 'title thumbnail slug')
        .populate('createdCourses', 'title thumbnail slug');

      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: 'User not found or inactive'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Session retrieved successfully',
        data: {
          user: user.toPublicJSON()
        }
      });

    } catch (error) {
      console.error('Get session error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving session'
      });
    }
  };

  /**
   * Send password reset email
   */
  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required'
        });
        return;
      }

      const user = await UserModel.findOne({ email: email.toLowerCase() });
      
      // Always return success for security (don't reveal if email exists)
      if (!user) {
        res.status(200).json({
          success: true,
          message: 'If the email exists, a password reset link has been sent'
        });
        return;
      }

      // Generate reset token
      const resetToken = user.generatePasswordResetToken();
      await user.save();

      // Send reset email
      try {
        await sendEmail({
          to: user.email,
          subject: 'Password Reset - Edulyt LMS',
          template: 'password-reset',
          data: {
            name: user.name,
            resetUrl: `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`
          }
        });
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        
        res.status(500).json({
          success: false,
          message: 'Failed to send password reset email'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Password reset link has been sent to your email'
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during password reset request'
      });
    }
  };

  /**
   * Reset password with token
   */
  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        res.status(400).json({
          success: false,
          message: 'Token and new password are required'
        });
        return;
      }

      // Hash the token to compare with stored hash
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find user with valid reset token
      const user = await UserModel.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
      }).select('+password');

      if (!user) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired password reset token'
        });
        return;
      }

      // Update password and clear reset token
      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      
      // Clear all refresh tokens (force re-login)
      user.refreshTokens = [];
      
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password reset successful. Please login with your new password.'
      });

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during password reset'
      });
    }
  };

  /**
   * Verify email with token
   */
  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Verification token is required'
        });
        return;
      }

      // Hash the token to compare with stored hash
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find user with valid verification token
      const user = await UserModel.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() }
      });

      if (!user) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired verification token'
        });
        return;
      }

      // Update user verification status
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Email verified successfully'
      });

    } catch (error) {
      console.error('Verify email error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during email verification'
      });
    }
  };

  /**
   * Resend email verification
   */
  resendVerification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required'
        });
        return;
      }

      const user = await UserModel.findOne({ email: email.toLowerCase() });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      if (user.isEmailVerified) {
        res.status(400).json({
          success: false,
          message: 'Email is already verified'
        });
        return;
      }

      // Generate new verification token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      // Send verification email
      try {
        await sendEmail({
          to: user.email,
          subject: 'Verify Your Email - Edulyt LMS',
          template: 'email-verification',
          data: {
            name: user.name,
            verificationUrl: `${process.env.FRONTEND_URL}/auth/verify-email?token=${verificationToken}`
          }
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        res.status(500).json({
          success: false,
          message: 'Failed to send verification email'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully'
      });

    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during email verification'
      });
    }
  };

  /**
   * Change password (authenticated user)
   */
  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = (req as any).user?.userId;

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      // Find user with password
      const user = await UserModel.findById(userId).select('+password');
      if (!user || !user.password) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
        return;
      }

      // Update password
      user.password = newPassword;
      
      // Clear all refresh tokens except current session (optional)
      // user.refreshTokens = user.refreshTokens.slice(-1);
      
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during password change'
      });
    }
  };
} 