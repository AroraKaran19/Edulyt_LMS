# Edulyt LMS API Documentation

## Base URL
```
http://localhost:8080/api
```

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All API responses follow this structure:
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error message",
  "error": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 1. Authentication Endpoints

### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "userType": "student", // "student", "instructor", "collaborator", "admin", "super-admin"
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "instructorData": { // Only if userType is "instructor"
    "bio": "Experienced developer",
    "currentPosition": "Senior Developer",
    "currentCompany": "Tech Corp",
    "linkedinUrl": "https://linkedin.com/in/johndoe"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6789012345",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "userType": "student",
      "enrolledCourses": []
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6789012345",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "userType": "student",
      "enrolledCourses": []
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /api/auth/oauth-signin
Login with OAuth providers (Google, LinkedIn).

**Request Body:**
```json
{
  "email": "user@gmail.com",
  "fullName": "John Doe",
  "provider": "google", // "google" or "linkedin"
  "userType": "student",
  "profilePicture": "https://example.com/photo.jpg"
}
```

### POST /api/auth/refresh-token
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 2. User Endpoints

### GET /api/user/profile
Get user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6789012345",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "userType": "student",
      "profilePicture": "https://example.com/photo.jpg",
      "phone": "+1234567890",
      "address": {
        "address": "123 Main St",
        "city": "New York",
        "state": "NY",
        "country": "USA",
        "pincode": "10001"
      }
    }
  }
}
```

### GET /api/user/enrolled-courses
Get user's enrolled courses (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Enrolled courses retrieved successfully",
  "data": {
    "enrolledCourses": [
      {
        "_id": "64a1b2c3d4e5f6789012346",
        "courseId": {
          "_id": "64a1b2c3d4e5f6789012347",
          "title": "Complete React Course",
          "thumbnail": "https://example.com/thumb.jpg",
          "category": "programming"
        },
        "status": "active",
        "progress": {
          "overallCompletion": 45,
          "totalModules": 5,
          "completedModules": 2,
          "totalLessons": 20,
          "completedLessons": 9
        },
        "enrolledAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

## 3. Course Endpoints

### GET /api/courses
Get all courses with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search in title, description, or short description
- `filter` (optional): Filter by categories (can be used multiple times)
- `category` (optional): Filter by categories (comma-separated)
- `audience` (optional): Filter by target audience ("college-students" or "professionals")

**Example:**
```
GET /api/courses?page=1&limit=10&search=javascript&filter=programming&audience=professionals
```

**Response:**
```json
{
  "success": true,
  "message": "Courses retrieved successfully",
  "data": {
    "courses": [
      {
        "_id": "64a1b2c3d4e5f6789012345",
        "title": "Complete React Course",
        "description": "Learn React from scratch...",
        "shortDescription": "Master React development",
        "category": "programming",
        "thumbnail": "https://example.com/thumb.jpg",
        "isFeatured": true,
        "isCertified": true,
        "audience": "professionals",
        "skillLevel": "beginner",
        "duration": "40 hours",
        "analytics": {
          "totalEnrollments": 150,
          "averageRating": 4.5,
          "completionRate": 85
        }
      }
    ],
    "total": 25,
    "page": 1,
    "totalPages": 3
  }
}
```

### GET /api/courses/:slug
Get a specific course by slug.

**Parameters:**
- `slug`: Course slug (unique identifier)

**Response:**
```json
{
  "success": true,
  "message": "Course retrieved successfully",
  "data": {
    "course": {
      "_id": "64a1b2c3d4e5f6789012345",
      "title": "Complete React Course",
      "description": "Learn React from scratch...",
      "shortDescription": "Master React development",
      "category": "programming",
      "thumbnail": "https://example.com/thumb.jpg",
      "previewVideoUrl": "https://example.com/preview.mp4",
      "isFeatured": true,
      "isCertified": true,
      "whatYouWillLearn": "You will learn React fundamentals...",
      "skills": ["React", "JavaScript", "JSX"],
      "highlights": [
        {
          "title": "Hands-on Projects",
          "description": "Build real-world applications"
        }
      ],
      "careerPaths": ["Frontend Developer", "React Developer"],
      "skillLevel": "beginner",
      "whoShouldJoin": "Beginners who want to learn React",
      "prerequisites": ["Basic JavaScript knowledge"],
      "duration": "40 hours",
      "modules": [
        {
          "_id": "64a1b2c3d4e5f6789012346",
          "title": "Introduction to React",
          "description": "Learn the basics of React",
          "lessons": [...]
        }
      ],
      "instructor": [
        {
          "_id": "64a1b2c3d4e5f6789012347",
          "firstName": "John",
          "lastName": "Doe",
          "profilePicture": "https://example.com/instructor.jpg",
          "bio": "Experienced React developer",
          "rating": 4.8
        }
      ],
      "plans": {
        "elite": {
          "price": 199,
          "currency": "USD",
          "features": ["Lifetime access", "Certificate", "1-on-1 support"]
        },
        "essential": {
          "price": 99,
          "currency": "USD",
          "features": ["6 months access", "Certificate"]
        }
      },
      "reviews": [...],
      "testimonials": [...],
      "faqs": [...],
      "analytics": {
        "totalEnrollments": 150,
        "activeEnrollments": 120,
        "completionRate": 85,
        "averageRating": 4.5
      }
    }
  }
}
```

### GET /api/courses/featured
Get featured courses.

**Response:**
```json
{
  "success": true,
  "message": "Courses retrieved successfully",
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "title": "Complete React Course",
      "thumbnail": "https://example.com/thumb.jpg",
      "category": "programming",
      "isFeatured": true,
      "analytics": {
        "totalEnrollments": 150,
        "averageRating": 4.5
      }
    }
  ]
}
```

### GET /api/courses/audience
Get courses by target audience.

**Query Parameters:**
- `audience`: Target audience ("college-students" or "professionals")

### GET /api/courses/category
Get courses by category.

**Query Parameters:**
- `category`: Category name

### GET /api/courses/check-slug/:slug
Check if a course slug is available.

**Parameters:**
- `slug`: The slug to check

**Response:**
```json
{
  "success": true,
  "message": "Slug availability checked",
  "data": {
    "available": true
  }
}
```

---

## 4. Course Management Endpoints (Admin/Instructor)

### POST /api/courses/chunked/metadata
Create course metadata only (for chunked course creation).

**Request Body:**
```json
{
  "title": "Complete React Course",
  "description": "Learn React from scratch...",
  "shortDescription": "Master React development",
  "category": "programming",
  "audience": "professionals",
  "thumbnail": "https://example.com/thumb.jpg",
  "whatYouWillLearn": "You will learn React fundamentals...",
  "skills": ["React", "JavaScript", "JSX"],
  "careerPaths": ["Frontend Developer", "React Developer"],
  "skillLevel": "beginner",
  "whoShouldJoin": "Beginners who want to learn React",
  "prerequisites": ["Basic JavaScript knowledge"],
  "duration": "40 hours",
  "language": "en",
  "tags": ["react", "javascript", "frontend"]
}
```

### PUT /api/courses/:courseId/metadata
Update course metadata.

**Parameters:**
- `courseId`: Course ID

**Request Body:**
```json
{
  "title": "Updated Course Title",
  "description": "Updated description",
  "category": "programming",
  "audience": "professionals"
}
```

### POST /api/courses/:courseId/modules
Add a single module to a course.

**Parameters:**
- `courseId`: Course ID

**Request Body:**
```json
{
  "title": "Introduction to React",
  "description": "Learn the basics of React",
  "thumbnailUrl": "https://example.com/module-thumb.jpg",
  "lessons": []
}
```

### PUT /api/courses/:courseId/modules/:moduleId
Update a single module.

**Parameters:**
- `courseId`: Course ID
- `moduleId`: Module ID

### DELETE /api/courses/:courseId/modules/:moduleId
Delete a single module.

**Parameters:**
- `courseId`: Course ID
- `moduleId`: Module ID

### POST /api/courses/:courseId/modules/:moduleId/lessons
Add a single lesson to a module.

**Parameters:**
- `courseId`: Course ID
- `moduleId`: Module ID

**Request Body:**
```json
{
  "title": "React Components",
  "description": "Learn about React components",
  "contents": []
}
```

### PUT /api/courses/:courseId/modules/:moduleId/lessons/:lessonId
Update a single lesson.

**Parameters:**
- `courseId`: Course ID
- `moduleId`: Module ID
- `lessonId`: Lesson ID

### DELETE /api/courses/:courseId/modules/:moduleId/lessons/:lessonId
Delete a single lesson.

**Parameters:**
- `courseId`: Course ID
- `moduleId`: Module ID
- `lessonId`: Lesson ID

### POST /api/courses/:courseId/modules/:moduleId/lessons/:lessonId/contents
Add content to a lesson.

**Parameters:**
- `courseId`: Course ID
- `moduleId`: Module ID
- `lessonId`: Lesson ID

**Request Body:**
```json
{
  "type": "video", // "video", "text", "quiz", "assignment"
  "title": "Introduction Video",
  "description": "Watch this video to get started",
  "contentUrl": "https://example.com/video.mp4",
  "duration": 300, // in seconds
  "isRequired": true
}
```

### PUT /api/courses/:courseId/modules/:moduleId/lessons/:lessonId/contents/:contentId
Update lesson content.

**Parameters:**
- `courseId`: Course ID
- `moduleId`: Module ID
- `lessonId`: Lesson ID
- `contentId`: Content ID

### DELETE /api/courses/:courseId/modules/:moduleId/lessons/:lessonId/contents/:contentId
Delete lesson content.

**Parameters:**
- `courseId`: Course ID
- `moduleId`: Module ID
- `lessonId`: Lesson ID
- `contentId`: Content ID

### POST /api/courses/:courseId/finalize
Finalize course creation (mark as complete and ready).

**Parameters:**
- `courseId`: Course ID

### PUT /api/courses/status/:courseId
Update course status.

**Parameters:**
- `courseId`: Course ID

**Request Body:**
```json
{
  "isActive": true
}
```

### GET /api/courses/admin
Get all courses for admin (includes inactive courses).

### GET /api/courses/admin/id/:courseId
Get a specific course by ID for admin (includes inactive courses).

**Parameters:**
- `courseId`: Course ID

---

## 5. Enrollment Endpoints

### POST /api/enrollment
Create a new enrollment (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "courseId": "64a1b2c3d4e5f6789012345",
  "enrollmentSource": "direct", // "direct", "gift", "promotion"
  "giftFrom": "64a1b2c3d4e5f6789012346", // Optional, user ID if gift
  "promotionCode": "SAVE20" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Enrollment created successfully",
  "data": {
    "enrollment": {
      "_id": "64a1b2c3d4e5f6789012347",
      "userId": "64a1b2c3d4e5f6789012348",
      "courseId": "64a1b2c3d4e5f6789012345",
      "status": "active",
      "enrolledAt": "2024-01-01T00:00:00.000Z",
      "progress": {
        "overallCompletion": 0,
        "totalModules": 0,
        "completedModules": 0,
        "totalLessons": 0,
        "completedLessons": 0
      }
    }
  }
}
```

### GET /api/enrollment/user
Get user's enrollments (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status ("active", "completed", "dropped", "paused")

### GET /api/enrollment/course/:courseId
Get course enrollments (admin/instructor only).

**Parameters:**
- `courseId`: Course ID

**Query Parameters:**
- `status` (optional): Filter by status

### GET /api/enrollment/:courseId
Get specific enrollment for a course (requires authentication).

**Parameters:**
- `courseId`: Course ID

### GET /api/enrollment/:courseId/check
Check if user is enrolled in a course (requires authentication).

**Parameters:**
- `courseId`: Course ID

**Response:**
```json
{
  "success": true,
  "message": "Enrollment status checked",
  "data": {
    "isEnrolled": true,
    "enrollment": {
      "_id": "64a1b2c3d4e5f6789012347",
      "status": "active",
      "progress": {
        "overallCompletion": 45
      }
    },
    "status": "active"
  }
}
```

### PUT /api/enrollment/:courseId/modules/:moduleId/lessons/:lessonId/progress
Update enrollment progress for a specific lesson (requires authentication).

**Parameters:**
- `courseId`: Course ID
- `moduleId`: Module ID
- `lessonId`: Lesson ID

**Request Body:**
```json
{
  "completed": true,
  "score": 85, // Optional
  "timeSpent": 300 // Optional, in seconds
}
```

### PUT /api/enrollment/:courseId/complete
Mark enrollment as completed (requires authentication).

**Parameters:**
- `courseId`: Course ID

### PUT /api/enrollment/:courseId/status
Update enrollment status (requires authentication).

**Parameters:**
- `courseId`: Course ID

**Request Body:**
```json
{
  "status": "paused" // "active", "completed", "dropped", "paused"
}
```

### GET /api/enrollment/stats/course/:courseId
Get course enrollment statistics (admin/instructor only).

**Parameters:**
- `courseId`: Course ID

### GET /api/enrollment/stats/user
Get user enrollment statistics (requires authentication).

### GET /api/enrollment/stats/overall
Get overall enrollment statistics (admin only).

### DELETE /api/enrollment/:courseId
Delete enrollment (requires authentication).

**Parameters:**
- `courseId`: Course ID

---

## 6. Category Endpoints

### GET /api/categories
Get all categories with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `search` (optional): Search in name or description
- `isActive` (optional): Filter by active status

**Response:**
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": {
    "categories": [
      {
        "_id": "64a1b2c3d4e5f6789012345",
        "name": "Programming",
        "description": "Programming and software development courses",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 10,
    "page": 1,
    "totalPages": 1
  }
}
```

### GET /api/categories/active
Get active categories only (for dropdowns).

### GET /api/categories/:categoryId
Get category by ID.

**Parameters:**
- `categoryId`: Category ID

### POST /api/categories
Create a new category (admin/instructor only).

**Request Body:**
```json
{
  "name": "Programming",
  "description": "Programming and software development courses"
}
```

### PUT /api/categories/:categoryId
Update a category (admin/instructor only).

**Parameters:**
- `categoryId`: Category ID

**Request Body:**
```json
{
  "name": "Updated Programming",
  "description": "Updated description",
  "isActive": true
}
```

### DELETE /api/categories/:categoryId
Delete a category (admin/instructor only).

**Parameters:**
- `categoryId`: Category ID

---

## 7. Instructor Endpoints

### POST /api/instructor/register
Register a new instructor (admin only).

**Request Body:**
```json
{
  "email": "instructor@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith",
  "bio": "Experienced developer with 10+ years",
  "currentPosition": "Senior Developer",
  "currentCompany": "Tech Corp",
  "linkedinUrl": "https://linkedin.com/in/janesmith",
  "previousExperience": [
    {
      "companyName": "Previous Company",
      "position": "Developer",
      "duration": {
        "from": "2020-01-01T00:00:00.000Z",
        "to": "2022-01-01T00:00:00.000Z"
      },
      "description": "Worked on various projects"
    }
  ]
}
```

### GET /api/instructor
Get all instructors with pagination and filtering (admin only).

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `search` (optional): Search term
- `status` (optional): Filter by status
- `sortBy` (optional): Sort field
- `sortOrder` (optional): Sort order ("asc" or "desc")

### GET /api/instructor/:id
Get instructor by ID (admin only).

**Parameters:**
- `id`: Instructor ID

### PUT /api/instructor/:id
Update instructor by ID (admin only).

**Parameters:**
- `id`: Instructor ID

### DELETE /api/instructor/:id
Delete instructor by ID (admin only).

**Parameters:**
- `id`: Instructor ID

---

## 8. Payment Endpoints

### POST /api/payment/create-order
Create a payment order.

**Request Body:**
```json
{
  "userId": "64a1b2c3d4e5f6789012345",
  "courseId": "64a1b2c3d4e5f6789012346",
  "planType": "elite" // "elite" or "essential"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "ORDER_123456789",
    "redirectUrl": "https://payment-gateway.com/pay/ORDER_123456789",
    "amount": 199,
    "currency": "USD"
  }
}
```

### GET /api/payment/order-info/:orderId
Get order information.

**Parameters:**
- `orderId`: Order ID

### GET /api/payment/status/:orderId
Get payment status.

**Parameters:**
- `orderId`: Order ID

### GET /api/payment/verify-token/:token
Verify payment gateway token.

**Parameters:**
- `token`: Payment gateway token

### POST /api/payment/webhook
Payment gateway webhook for automated payment status updates.

**Note:** This endpoint is called by the payment gateway, not by your frontend.

---

## 9. Upload Endpoints

### POST /api/upload/presigned-url
Generate presigned URL for direct S3 upload.

**Request Body:**
```json
{
  "fileName": "image.jpg",
  "fileType": "image/jpeg",
  "folderName": "instructor-profiles"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Presigned URL generated",
  "data": {
    "presignedUrl": "https://s3.amazonaws.com/bucket/path?signature=...",
    "s3Key": "instructor-profiles/image-123.jpg",
    "expiresIn": 3600
  }
}
```

### POST /api/upload/presigned-url/access
Generate presigned URL for secure file access.

**Request Body:**
```json
{
  "s3Key": "course-videos/lesson1.mp4",
  "expiresIn": 3600
}
```

### DELETE /api/upload/:s3Key
Delete file from S3.

**Parameters:**
- `s3Key`: S3 key of the file to delete (URL encoded)

### GET /api/upload/:s3Key/info
Get file information.

**Parameters:**
- `s3Key`: S3 key of the file (URL encoded)

---

## 10. FAQ Endpoints

### GET /api/faqs
Get all FAQs with pagination and search.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search term for question and answer

**Response:**
```json
{
  "success": true,
  "message": "FAQs retrieved successfully",
  "data": {
    "faqs": [
      {
        "_id": "64a1b2c3d4e5f6789012345",
        "question": "How long do I have access to the course?",
        "answer": "You have lifetime access to the course content.",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 15,
    "page": 1,
    "totalPages": 2
  }
}
```

### GET /api/faqs/:id
Get a FAQ by ID.

**Parameters:**
- `id`: FAQ ID

### POST /api/faqs
Create a new FAQ (admin only).

**Request Body:**
```json
{
  "question": "How long do I have access to the course?",
  "answer": "You have lifetime access to the course content."
}
```

### PUT /api/faqs/:id
Update an existing FAQ (admin only).

**Parameters:**
- `id`: FAQ ID

**Request Body:**
```json
{
  "question": "Updated question",
  "answer": "Updated answer"
}
```

### DELETE /api/faqs/:id
Delete an FAQ (admin only).

**Parameters:**
- `id`: FAQ ID

### POST /api/faqs/by-ids
Get FAQs by array of IDs.

**Request Body:**
```json
{
  "ids": ["64a1b2c3d4e5f6789012345", "64a1b2c3d4e5f6789012346"]
}
```

---

## 11. Testimonial Endpoints

### GET /api/testimonials
Get all testimonials with pagination and search.

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `search` (optional): Search term

### GET /api/testimonials/verified
Get verified testimonials only.

### GET /api/testimonials/:id
Get testimonial by ID.

**Parameters:**
- `id`: Testimonial ID

### POST /api/testimonials
Create a new testimonial (admin only).

**Request Body:**
```json
{
  "name": "John Doe",
  "position": "Software Developer",
  "company": "Tech Corp",
  "content": "This course was amazing!",
  "rating": 5,
  "profilePicture": "https://example.com/photo.jpg",
  "isVerified": true
}
```

### POST /api/testimonials/by-ids
Get testimonials by IDs array.

**Request Body:**
```json
{
  "ids": ["64a1b2c3d4e5f6789012345", "64a1b2c3d4e5f6789012346"]
}
```

### PUT /api/testimonials/:id
Update a testimonial (admin only).

**Parameters:**
- `id`: Testimonial ID

### DELETE /api/testimonials/:id
Delete a testimonial (admin only).

**Parameters:**
- `id`: Testimonial ID

---

## 12. Admin Endpoints

### GET /api/admin/users
Get all users (admin only).

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `search` (optional): Search term
- `userType` (optional): Filter by user type
- `status` (optional): Filter by status

### GET /api/admin/users/show
Get users for admin dashboard (admin only).

### GET /api/admin/users/:id
Get user by ID (admin only).

**Parameters:**
- `id`: User ID

### PUT /api/admin/users/:id
Update user by ID (admin only).

**Parameters:**
- `id`: User ID

**Request Body:**
```json
{
  "firstName": "Updated Name",
  "lastName": "Updated Last Name",
  "email": "updated@example.com",
  "userType": "instructor",
  "status": "active"
}
```

### POST /api/admin/users/admin
Create new admin user (admin only).

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123",
  "firstName": "Admin",
  "lastName": "User"
}
```

### DELETE /api/admin/users/:id
Delete user by ID (admin only).

**Parameters:**
- `id`: User ID

---

## Error Codes

### Authentication Errors
- `MISSING_TOKEN`: Authorization header missing or invalid format
- `EXPIRED_TOKEN`: JWT token has expired
- `INVALID_TOKEN`: JWT token is invalid
- `TOKEN_VERIFICATION_FAILED`: Token verification failed
- `INVALID_TOKEN_PAYLOAD`: Token payload is invalid
- `TOKEN_REVOKED`: Token has been revoked
- `UNAUTHORIZED`: User not authorized for this action

### User Errors
- `USER_NOT_FOUND`: User not found
- `EMAIL_ALREADY_EXISTS`: Email already in use
- `INVALID_CREDENTIALS`: Invalid email or password
- `PASSWORDS_DO_NOT_MATCH`: Passwords do not match

### Course Errors
- `COURSE_NOT_FOUND`: Course not found
- `COURSE_ALREADY_EXISTS`: Course with this slug already exists
- `INVALID_COURSE_DATA`: Invalid course data provided
- `COURSE_CREATION_FAILED`: Course creation failed

### Enrollment Errors
- `ENROLLMENT_NOT_FOUND`: Enrollment not found
- `ALREADY_ENROLLED`: User already enrolled in this course
- `ENROLLMENT_FAILED`: Enrollment creation failed
- `INVALID_PROGRESS_DATA`: Invalid progress data provided

### General Errors
- `VALIDATION_ERROR`: Request validation failed
- `INTERNAL_ERROR`: Internal server error
- `NOT_FOUND`: Resource not found
- `BAD_REQUEST`: Bad request
- `FORBIDDEN`: Access forbidden

---

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **Authentication endpoints**: 5 requests per minute per IP
- **General endpoints**: 100 requests per minute per IP
- **Upload endpoints**: 10 requests per minute per IP

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Pagination

Most list endpoints support pagination with these query parameters:
- `page`: Page number (starts from 1)
- `limit`: Number of items per page (max 100)

Response includes pagination metadata:
```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "totalPages": 15,
  "hasNext": true,
  "hasPrev": false
}
```

---

## File Upload

### Direct S3 Upload Process
1. Call `/api/upload/presigned-url` to get upload URL
2. Upload file directly to S3 using the presigned URL
3. Use the returned `s3Key` to reference the file

### Supported File Types
- **Images**: jpg, jpeg, png, gif, webp
- **Videos**: mp4, webm, mov
- **Documents**: pdf, doc, docx
- **Archives**: zip, rar

### File Size Limits
- **Images**: 10MB max
- **Videos**: 500MB max
- **Documents**: 50MB max

---

## Webhooks

### Payment Webhook
The payment webhook endpoint (`/api/payment/webhook`) receives notifications from the payment gateway about payment status changes. This is used to automatically update enrollment status when payments are completed.

---

## Testing

### Health Check
```
GET /
```

**Response:**
```json
{
  "status": "OK",
  "message": "Airkrit Backend Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Test Data
Use the provided test data file (`testdata.json`) to populate the database with sample data for testing.

---

## Support

For API support and questions, please contact the development team or refer to the internal documentation.

## QnA (Questions & Answers) API

The QnA API provides endpoints for managing course-related questions and answers, allowing students to ask questions and instructors to provide responses in a threaded format.

### Base URL
```
/api/qna
```

### Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Questions

### Create Question
**POST** `/questions`

Create a new question for a specific course.

**Request Body:**
```json
{
  "courseId": "string (required)",
  "title": "string (required, max 200 chars)",
  "description": "string (required, max 2000 chars)",
  "priority": "low|medium|high (optional, default: medium)",
  "tags": ["string"] (optional),
  "isAnonymous": "boolean (optional, default: false)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Question created successfully",
  "data": {
    "question": {
      "_id": "string",
      "courseId": "string",
      "userId": "string",
      "title": "string",
      "description": "string",
      "status": "open",
      "priority": "medium",
      "tags": ["string"],
      "isAnonymous": false,
      "upvotes": 0,
      "downvotes": 0,
      "viewCount": 0,
      "lastActivityAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Get Questions
**GET** `/questions`

Get questions with optional filtering and pagination.

**Query Parameters:**
- `courseId` (optional): Filter by course ID
- `userId` (optional): Filter by user ID
- `status` (optional): Filter by status (open, resolved, closed)
- `priority` (optional): Filter by priority (low, medium, high)
- `search` (optional): Search in title and description
- `tags` (optional): Comma-separated list of tags
- `dateFrom` (optional): Filter questions from this date
- `dateTo` (optional): Filter questions to this date
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "message": "Questions fetched successfully",
  "data": {
    "data": [
      {
        "_id": "string",
        "courseId": "string",
        "userId": "string",
        "title": "string",
        "description": "string",
        "status": "open",
        "priority": "medium",
        "tags": ["string"],
        "isAnonymous": false,
        "upvotes": 0,
        "downvotes": 0,
        "viewCount": 0,
        "lastActivityAt": "2024-01-01T00:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "user": {
          "_id": "string",
          "firstName": "string",
          "lastName": "string",
          "profilePicture": "string",
          "userType": "string"
        },
        "course": {
          "_id": "string",
          "title": "string",
          "thumbnail": "string"
        },
        "replies": [],
        "replyCount": 0
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

### Get User Questions
**GET** `/questions/user`

Get questions asked by the authenticated user.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (open, resolved, closed)

### Get Course Questions
**GET** `/questions/course/:courseId`

Get questions for a specific course.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (open, resolved, closed)
- `priority` (optional): Filter by priority (low, medium, high)
- `search` (optional): Search in title and description

### Get Question by ID
**GET** `/questions/:questionId`

Get a single question with all details and replies.

**Response:**
```json
{
  "success": true,
  "message": "Question fetched successfully",
  "data": {
    "question": {
      "_id": "string",
      "courseId": "string",
      "userId": "string",
      "title": "string",
      "description": "string",
      "status": "open",
      "priority": "medium",
      "tags": ["string"],
      "isAnonymous": false,
      "upvotes": 0,
      "downvotes": 0,
      "viewCount": 1,
      "lastActivityAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "user": {
        "_id": "string",
        "firstName": "string",
        "lastName": "string",
        "profilePicture": "string",
        "userType": "string"
      },
      "course": {
        "_id": "string",
        "title": "string",
        "thumbnail": "string"
      },
      "replies": [],
      "replyCount": 0
    }
  }
}
```

### Update Question
**PUT** `/questions/:questionId`

Update a question (only by question owner).

**Request Body:**
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "status": "open|resolved|closed (optional)",
  "priority": "low|medium|high (optional)",
  "tags": ["string"] (optional)
}
```

### Delete Question
**DELETE** `/questions/:questionId`

Delete a question and all its replies (only by question owner).

---

## Replies

### Create Reply
**POST** `/questions/:questionId/replies`

Create a reply to a question.

**Request Body:**
```json
{
  "content": "string (required, max 2000 chars)",
  "parentReplyId": "string (optional, for nested replies)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reply created successfully",
  "data": {
    "reply": {
      "_id": "string",
      "questionId": "string",
      "userId": "string",
      "content": "string",
      "isInstructorReply": true,
      "isAccepted": false,
      "upvotes": 0,
      "downvotes": 0,
      "parentReplyId": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Get Replies
**GET** `/questions/:questionId/replies`

Get replies for a specific question.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "message": "Replies fetched successfully",
  "data": {
    "data": [
      {
        "_id": "string",
        "questionId": "string",
        "userId": "string",
        "content": "string",
        "isInstructorReply": true,
        "isAccepted": false,
        "upvotes": 0,
        "downvotes": 0,
        "parentReplyId": null,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "user": {
          "_id": "string",
          "firstName": "string",
          "lastName": "string",
          "profilePicture": "string",
          "userType": "string"
        },
        "parentReply": null,
        "nestedReplies": []
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### Update Reply
**PUT** `/replies/:replyId`

Update a reply (by reply owner or question owner).

**Request Body:**
```json
{
  "content": "string (optional)",
  "isAccepted": "boolean (optional, only question owner can set)"
}
```

### Delete Reply
**DELETE** `/replies/:replyId`

Delete a reply and all its nested replies (by reply owner or question owner).

---

## Voting

### Vote on Question or Reply
**POST** `/vote`

Vote on a question or reply.

**Request Body:**
```json
{
  "itemId": "string (required)",
  "itemType": "question|reply (required)",
  "voteType": "upvote|downvote|remove (required)"
}
```

---

## Statistics

### Get QnA Statistics
**GET** `/stats`

Get QnA statistics (optionally filtered by course).

**Query Parameters:**
- `courseId` (optional): Filter statistics by course ID

**Response:**
```json
{
  "success": true,
  "message": "QnA statistics fetched successfully",
  "data": {
    "stats": {
      "totalQuestions": 100,
      "openQuestions": 25,
      "resolvedQuestions": 70,
      "closedQuestions": 5,
      "totalReplies": 300,
      "averageRepliesPerQuestion": 3.0,
      "averageResponseTime": 2.5,
      "mostActiveInstructors": [
        {
          "instructorId": "string",
          "instructorName": "string",
          "replyCount": 50
        }
      ]
    }
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "User authentication required",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Not authorized to perform this action",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## Business Rules

1. **Question Creation**: Only enrolled students can ask questions for a course
2. **Reply Creation**: Enrolled students and course instructors can reply to questions
3. **Question Updates**: Only the question owner can update their questions
4. **Reply Updates**: Reply owners and question owners can update replies
5. **Accepting Replies**: Only question owners can mark replies as accepted
6. **Anonymous Questions**: Users can ask anonymous questions (user info is hidden)
7. **Nested Replies**: Users can reply to replies, creating threaded conversations
8. **Voting**: All authenticated users can vote on questions and replies
9. **View Count**: Question view count is incremented when fetched by ID
10. **Activity Tracking**: Question lastActivityAt is updated when replies are added

## Course Reviews API

The Course Reviews API provides endpoints for managing course reviews, allowing enrolled students to write, read, update, and delete reviews for courses they are enrolled in.

### Base URL
```
/api/reviews
```

### Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Reviews

### Create Review
**POST** `/reviews`

Create a new review for a specific course.

**Request Body:**
```json
{
  "courseId": "string (required)",
  "rating": "number (required, 1-5)",
  "title": "string (required, max 100 chars)",
  "comment": "string (required, max 1000 chars)",
  "isAnonymous": "boolean (optional, default: false)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "review": {
      "_id": "string",
      "courseId": "string",
      "userId": "string",
      "rating": 5,
      "title": "string",
      "comment": "string",
      "isAnonymous": false,
      "helpfulVotes": 0,
      "notHelpfulVotes": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Get Reviews
**GET** `/reviews`

Get reviews with optional filtering and pagination.

**Query Parameters:**
- `courseId` (optional): Filter by course ID
- `userId` (optional): Filter by user ID
- `rating` (optional): Filter by rating (1-5)
- `isAnonymous` (optional): Filter by anonymous status
- `search` (optional): Search in title and comment
- `dateFrom` (optional): Filter reviews from this date
- `dateTo` (optional): Filter reviews to this date
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "message": "Reviews fetched successfully",
  "data": {
    "data": [
      {
        "_id": "string",
        "courseId": "string",
        "userId": "string",
        "rating": 5,
        "title": "string",
        "comment": "string",
        "isAnonymous": false,
        "helpfulVotes": 10,
        "notHelpfulVotes": 2,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "user": {
          "_id": "string",
          "firstName": "string",
          "lastName": "string",
          "profilePicture": "string",
          "userType": "string"
        },
        "course": {
          "_id": "string",
          "title": "string",
          "thumbnail": "string"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

### Get User Reviews
**GET** `/reviews/user`

Get reviews written by the authenticated user.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

### Get Course Reviews
**GET** `/reviews/course/:courseId`

Get reviews for a specific course.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `rating` (optional): Filter by rating (1-5)

### Get Review Statistics
**GET** `/reviews/stats/:courseId`

Get review statistics for a specific course.

**Response:**
```json
{
  "success": true,
  "message": "Review statistics fetched successfully",
  "data": {
    "stats": {
      "totalReviews": 150,
      "averageRating": 4.2,
      "ratingDistribution": {
        "1": 5,
        "2": 10,
        "3": 25,
        "4": 60,
        "5": 50
      },
      "recentReviews": 15
    }
  }
}
```

### Get Review by ID
**GET** `/reviews/:reviewId`

Get a single review with all details.

**Response:**
```json
{
  "success": true,
  "message": "Review fetched successfully",
  "data": {
    "review": {
      "_id": "string",
      "courseId": "string",
      "userId": "string",
      "rating": 5,
      "title": "string",
      "comment": "string",
      "isAnonymous": false,
      "helpfulVotes": 10,
      "notHelpfulVotes": 2,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "user": {
        "_id": "string",
        "firstName": "string",
        "lastName": "string",
        "profilePicture": "string",
        "userType": "string"
      },
      "course": {
        "_id": "string",
        "title": "string",
        "thumbnail": "string"
      }
    }
  }
}
```

### Update Review
**PUT** `/reviews/:reviewId`

Update a review (only by review owner).

**Request Body:**
```json
{
  "rating": "number (optional, 1-5)",
  "title": "string (optional)",
  "comment": "string (optional)",
  "isAnonymous": "boolean (optional)"
}
```

### Delete Review
**DELETE** `/reviews/:reviewId`

Delete a review (only by review owner).

---

## Voting

### Vote on Review
**POST** `/reviews/vote`

Vote on a review (helpful/not helpful).

**Request Body:**
```json
{
  "reviewId": "string (required)",
  "voteType": "helpful|not_helpful|remove (required)"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "User authentication required",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Not authorized to perform this action",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## Business Rules

1. **Review Creation**: Only enrolled students can write reviews for a course
2. **One Review Per Course**: Each user can only write one review per course
3. **Review Updates**: Only the review owner can update their reviews
4. **Review Deletion**: Only the review owner can delete their reviews
5. **Anonymous Reviews**: Users can write anonymous reviews (user info is hidden)
6. **Voting**: Only enrolled students can vote on reviews (helpful/not helpful)
7. **Rating Validation**: Rating must be between 1 and 5 stars
8. **Content Limits**: Title max 100 chars, comment max 1000 chars
9. **Statistics**: Real-time calculation of average rating and distribution
10. **Recent Reviews**: Tracks reviews from the last 30 days

---

*This documentation is generated automatically and should be kept up to date with any API changes.*
