interface ErrorResponseData {
  code: string;
  message: string;
  status: number;
}

const errorMessages = {
  course: {
    COURSE_NOT_FOUND: {
      code: "COURSE_NOT_FOUND",
      message: "Course not found",
      status: 404,
    },
    COURSE_ALREADY_EXISTS: {
      code: "COURSE_ALREADY_EXISTS",
      message: "Course already exists",
      status: 409,
    },
    COURSE_CREATION_FAILED: {
      code: "COURSE_CREATION_FAILED",
      message: "Course creation failed",
      status: 500,
    },
    COURSE_UPDATE_FAILED: {
      code: "COURSE_UPDATE_FAILED",
      message: "Course update failed",
      status: 500,
    },
    COURSE_DELETION_FAILED: {
      code: "COURSE_DELETION_FAILED",
      message: "Course deletion failed",
      status: 500,
    },
  },
  instructor: {
    INSTRUCTOR_NOT_FOUND: {
      code: "INSTRUCTOR_NOT_FOUND",
      message: "Instructor not found",
      status: 404,
    },
    INSTRUCTOR_ALREADY_EXISTS: {
      code: "INSTRUCTOR_ALREADY_EXISTS",
      message: "Instructor already exists",
      status: 409,
    },
    INSTRUCTOR_CREATION_FAILED: {
      code: "INSTRUCTOR_CREATION_FAILED",
      message: "Instructor creation failed",
      status: 500,
    },
    INSTRUCTOR_UPDATE_FAILED: {
      code: "INSTRUCTOR_UPDATE_FAILED",
      message: "Instructor update failed",
      status: 500,
    },
    INSTRUCTOR_DELETION_FAILED: {
      code: "INSTRUCTOR_DELETION_FAILED",
      message: "Instructor deletion failed",
      status: 500,
    },
  },
  review: {
    REVIEW_NOT_FOUND: {
      code: "REVIEW_NOT_FOUND",
      message: "Review not found",
      status: 404,
    },
    REVIEW_ALREADY_EXISTS: {
      code: "REVIEW_ALREADY_EXISTS",
      message: "Review already exists",
      status: 409,
    },
    REVIEW_CREATION_FAILED: {
      code: "REVIEW_CREATION_FAILED",
      message: "Review creation failed",
      status: 500,
    },
    REVIEW_UPDATE_FAILED: {
      code: "REVIEW_UPDATE_FAILED",
      message: "Review update failed",
      status: 500,
    },
    REVIEW_DELETION_FAILED: {
      code: "REVIEW_DELETION_FAILED",
      message: "Review deletion failed",
      status: 500,
    },
  },
  user: {
    USER_NOT_FOUND: {
      code: "USER_NOT_FOUND",
      message: "User not found",
      status: 404,
    },
    USER_ALREADY_EXISTS: {
      code: "USER_ALREADY_EXISTS",
      message: "User already exists",
      status: 409,
    },
    USER_CREATION_FAILED: {
      code: "USER_CREATION_FAILED",
      message: "User creation failed",
      status: 500,
    },
    USER_UPDATE_FAILED: {
      code: "USER_UPDATE_FAILED",
      message: "User update failed",
      status: 500,
    },
    USER_DELETION_FAILED: {
      code: "USER_DELETION_FAILED",
      message: "User deletion failed",
      status: 500,
    },
    USER_LOGIN_FAILED: {
      code: "USER_LOGIN_FAILED",
      message: "User login failed",
      status: 401,
    },
    USER_LOGOUT_FAILED: {
      code: "USER_LOGOUT_FAILED",
      message: "User logout failed",
      status: 500,
    },
    USER_REFRESH_TOKEN_FAILED: {
      code: "USER_REFRESH_TOKEN_FAILED",
      message: "User refresh token failed",
      status: 401,
    },
    USER_VERIFY_EMAIL_FAILED: {
      code: "USER_VERIFY_EMAIL_FAILED",
      message: "User verify email failed",
      status: 500,
    },
    USER_RESET_PASSWORD_FAILED: {
      code: "USER_RESET_PASSWORD_FAILED",
      message: "User reset password failed",
      status: 500,
    },
    USER_FORGOT_PASSWORD_FAILED: {
      code: "USER_FORGOT_PASSWORD_FAILED",
      message: "User forgot password failed",
      status: 500,
    },
    USER_CHANGE_PASSWORD_FAILED: {
      code: "USER_CHANGE_PASSWORD_FAILED",
      message: "User change password failed",
      status: 500,
    },
    USER_CHANGE_EMAIL_FAILED: {
      code: "USER_CHANGE_EMAIL_FAILED",
      message: "User change email failed",
      status: 500,
    },
    USER_CHANGE_USERNAME_FAILED: {
      code: "USER_CHANGE_USERNAME_FAILED",
      message: "User change username failed",
      status: 500,
    },
    USER_CHANGE_PROFILE_IMAGE_FAILED: {
      code: "USER_CHANGE_PROFILE_IMAGE_FAILED",
      message: "User change profile image failed",
      status: 500,
    },
  },
  auth: {
    UNAUTHORIZED: {
      code: "UNAUTHORIZED",
      message: "Unauthorized",
      status: 401,
    },
    MISSING_TOKEN: {
      code: "MISSING_TOKEN",
      message: "Unauthorized - Token is required",
      status: 401,
    },
    EXPIRED_TOKEN: {
      code: "EXPIRED_TOKEN",
      message: "Unauthorized - Token has expired",
      status: 401,
    },
    INVALID_TOKEN: {
      code: "INVALID_TOKEN",
      message: "Unauthorized - Invalid token",
      status: 401,
    },
    TOKEN_VERIFICATION_FAILED: {
      code: "TOKEN_VERIFICATION_FAILED",
      message: "Unauthorized - Token verification failed",
      status: 401,
    },
    INVALID_TOKEN_PAYLOAD: {
      code: "INVALID_TOKEN_PAYLOAD",
      message: "Unauthorized - Invalid token payload",
      status: 401,
    },
    TOKEN_REVOKED: {
      code: "TOKEN_REVOKED",
      message: "Unauthorized - Token has been revoked",
      status: 401,
    },
    MISSING_JWT_SECRET: {
      code: "MISSING_JWT_SECRET",
      message: "JWT_SECRET is not defined in environment variables",
      status: 500,
    },
  },
  general: {
    INTERNAL_ERROR: {
      code: "INTERNAL_ERROR",
      message: "Internal server error",
      status: 500,
    },
  },
};

// Error response helper class
class ErrorResponse extends Error {
  public code: string;
  public status: number;

  constructor(errorData: ErrorResponseData) {
    super(errorData.message);
    this.code = errorData.code;
    this.status = errorData.status;
  }
}

// Helper to create standardized error responses
const createErrorResponse = (
  res: import("express").Response,
  errorData: ErrorResponseData
): void => {
  const error = new ErrorResponse(errorData);
  res.status(error.status).json({
    success: false,
    message: error.message,
    error: error.code,
  });
};

export { errorMessages, createErrorResponse };
