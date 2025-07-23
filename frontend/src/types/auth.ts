// Authentication types that align with backend user schema
export interface BackendUser {
  _id: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  username?: string
  avatar?: string
  profileImage?: string
  role: 'student' | 'instructor' | 'admin' | 'superadmin'
  isActive: boolean
  isEmailVerified: boolean
  
  // OAuth providers
  providers?: {
    google?: { 
      id: string
      email: string
      verified: boolean 
    }
    github?: { 
      id: string
      username: string
      email: string 
    }
    linkedin?: { 
      id: string
      email: string 
    }
  }
  
  // Profile information
  profile?: {
    bio?: string
    dateOfBirth?: Date
    phone?: string
    address?: {
      street?: string
      city?: string
      state?: string
      country?: string
      zipCode?: string
    }
    socialLinks?: {
      linkedin?: string
      twitter?: string
      github?: string
      website?: string
    }
  }
  
  // User preferences
  preferences?: {
    language: string
    timezone: string
    emailNotifications: boolean
    marketingEmails: boolean
    theme: 'light' | 'dark' | 'auto'
  }
  
  // Learning data
  enrolledCourses: string[]
  createdCourses: string[]
  completedCourses: string[]
  certificates: string[]
  
  // Account management
  lastLoginAt?: Date
  loginCount: number
  passwordResetToken?: string
  passwordResetExpires?: Date
  emailVerificationToken?: string
  emailVerificationExpires?: Date
  refreshTokens: string[]
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

// API Response types
export interface AuthResponse {
  success: boolean
  message: string
  data?: {
    user: BackendUser
    accessToken: string
    refreshToken: string
    expiresIn: string
  }
  error?: string
}

export interface SessionResponse {
  success: boolean
  message: string
  data?: {
    user: BackendUser
  }
  error?: string
}

// Authentication request types
export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  firstName?: string
  lastName?: string
  username?: string
  role?: 'student' | 'instructor'
}

export interface OAuthCallbackRequest {
  provider: 'google' | 'github' | 'linkedin'
  providerData: {
    id: string
    email: string
    name: string
    username?: string
    picture?: string
  }
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
}

export interface VerifyEmailRequest {
  token: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

// NextAuth session types (extends the ones in route.ts)
export interface ExtendedSession {
  user: {
    id: string
    email: string
    name: string
    username?: string
    image?: string
    role: string
    isEmailVerified: boolean
    preferences?: BackendUser['preferences']
    enrolledCourses: string[]
    completedCourses: string[]
    certificates: string[]
    accessToken: string
    refreshToken: string
    backendUser: BackendUser
  }
  accessToken: string
  refreshToken: string
  error?: string
}

// User profile update types
export interface ProfileUpdateRequest {
  name?: string
  firstName?: string
  lastName?: string
  username?: string
  profile?: {
    bio?: string
    phone?: string
    dateOfBirth?: Date
    address?: {
      street?: string
      city?: string
      state?: string
      country?: string
      zipCode?: string
    }
    socialLinks?: {
      linkedin?: string
      twitter?: string
      github?: string
      website?: string
    }
  }
}

export interface PreferencesUpdateRequest {
  preferences: {
    language?: string
    timezone?: string
    emailNotifications?: boolean
    marketingEmails?: boolean
    theme?: 'light' | 'dark' | 'auto'
  }
}

export interface AvatarUpdateRequest {
  avatarUrl: string
}

// Course enrollment types
export interface CourseEnrollmentRequest {
  courseId: string
}

export interface CourseCompletionRequest {
  courseId: string
}

// User statistics
export interface UserStats {
  totalEnrolled: number
  totalCompleted: number
  totalCertificates: number
  totalCreated: number
  completionRate: number
  joinDate: Date
  lastLogin?: Date
  loginCount: number
}

// Error types
export interface AuthError {
  code: string
  message: string
  details?: string
}

// Form validation types
export interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  name: string
  firstName?: string
  lastName?: string
  username?: string
  role: 'student' | 'instructor'
  agreeToTerms: boolean
}

export interface ForgotPasswordFormData {
  email: string
}

export interface ResetPasswordFormData {
  password: string
  confirmPassword: string
}

export interface ChangePasswordFormData {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

// Auth context types
export interface AuthContextType {
  user: BackendUser | null
  session: ExtendedSession | null
  loading: boolean
  error: AuthError | null
  login: (credentials: LoginRequest) => Promise<AuthResponse>
  register: (data: RegisterRequest) => Promise<AuthResponse>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  updateProfile: (data: ProfileUpdateRequest) => Promise<AuthResponse>
  updatePreferences: (data: PreferencesUpdateRequest) => Promise<AuthResponse>
  changePassword: (data: ChangePasswordRequest) => Promise<AuthResponse>
  enrollInCourse: (courseId: string) => Promise<AuthResponse>
  completeCourse: (courseId: string) => Promise<AuthResponse>
}

// Role-based access control
export type UserRole = 'student' | 'instructor' | 'admin' | 'superadmin'

export interface RolePermissions {
  canCreateCourses: boolean
  canManageUsers: boolean
  canAccessAdmin: boolean
  canViewAnalytics: boolean
  canManageSystem: boolean
}

export const getRolePermissions = (role: UserRole): RolePermissions => {
  switch (role) {
    case 'superadmin':
      return {
        canCreateCourses: true,
        canManageUsers: true,
        canAccessAdmin: true,
        canViewAnalytics: true,
        canManageSystem: true
      }
    case 'admin':
      return {
        canCreateCourses: true,
        canManageUsers: true,
        canAccessAdmin: true,
        canViewAnalytics: true,
        canManageSystem: false
      }
    case 'instructor':
      return {
        canCreateCourses: true,
        canManageUsers: false,
        canAccessAdmin: false,
        canViewAnalytics: true,
        canManageSystem: false
      }
    case 'student':
    default:
      return {
        canCreateCourses: false,
        canManageUsers: false,
        canAccessAdmin: false,
        canViewAnalytics: false,
        canManageSystem: false
      }
  }
}

// Utility types
export type AuthProvider = 'credentials' | 'google' | 'github' | 'linkedin'
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error'
export type ThemePreference = 'light' | 'dark' | 'auto'

// API endpoint types
export interface AuthEndpoints {
  login: string
  register: string
  logout: string
  logoutAll: string
  refreshToken: string
  session: string
  forgotPassword: string
  resetPassword: string
  verifyEmail: string
  resendVerification: string
  changePassword: string
  oauthCallback: string
}

export const AUTH_ENDPOINTS: AuthEndpoints = {
  login: '/auth/login',
  register: '/auth/register',
  logout: '/auth/logout',
  logoutAll: '/auth/logout-all',
  refreshToken: '/auth/refresh-token',
  session: '/auth/session',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  verifyEmail: '/auth/verify-email',
  resendVerification: '/auth/resend-verification',
  changePassword: '/auth/change-password',
  oauthCallback: '/auth/oauth/callback'
}

// User endpoints
export interface UserEndpoints {
  profile: string
  preferences: string
  avatar: string
  enrolledCourses: string
  enroll: string
  complete: string
  stats: string
  search: string
  deleteAccount: string
}

export const USER_ENDPOINTS: UserEndpoints = {
  profile: '/users/profile',
  preferences: '/users/preferences',
  avatar: '/users/avatar',
  enrolledCourses: '/users/courses/enrolled',
  enroll: '/users/courses/enroll',
  complete: '/users/courses/complete',
  stats: '/users/stats',
  search: '/users/search',
  deleteAccount: '/users/account'
} 