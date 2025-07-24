import { Course } from "@/types";

export const demoCourses: Course[] = [
  {
    "_id": "course_001",
    "title": "Introduction to Machine Learning",
    "description": "This comprehensive course covers the basics of machine learning, including supervised and unsupervised learning, neural networks, and practical applications using Python.",
    "shortDescription": "Learn the essentials of machine learning with hands-on projects.",
    "category": "Technology",
    "subcategory": "Artificial Intelligence",
    "thumbnail": "https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "previewVideoUrl": "https://videos.pexels.com/video-files/31755962/13529383_2560_1440_60fps.mp4",
    "isFeatured": true,
    "isCertified": true,
    "enrolledCount": 1500,
    "totalRatings": 4.7,
    "totalLectures": 25,
    "duration": "3 months",
    "whatYouWillLearn": "Understand core machine learning concepts, implement algorithms in Python, and build predictive models.",
    "skills": ["Machine Learning", "Python", "Data Analysis", "Neural Networks"],
    "keyFeatures": [
      {
        "title": "Hands-On Projects",
        "description": "Build real-world ML models."
      },
      {
        "title": "Expert Instruction",
        "description": "Learn from industry professionals."
      }
    ],
    "features": ["Interactive quizzes", "Downloadable resources"],
    "careerPaths": ["Data Scientist", "Machine Learning Engineer"],
    "skillLevel": "Beginner to Intermediate",
    "whoShouldJoin": "Aspiring data scientists and developers interested in AI.",
    "prerequisites": ["Basic Python knowledge", "Understanding of statistics"],
    "modules": [
      {
        "_id": "module_001",
        "title": "Introduction to Machine Learning",
        "thumbnailUrl": "https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "lessons": [
          {
            "_id": "lesson_001",
            "title": "What is Machine Learning?",
            "description": "An overview of machine learning concepts.",
            "content": [
              {
                "_id": "content_001",
                "title": "Introduction Video",
                "description": "Introduction to ML concepts.",
                "content": {
                  "_id": "video_001",
                  "sources": [
                    {
                      "_id": "vq_001",
                      "quality": "1080p",
                      "videoUrl": "https://videos.pexels.com/video-files/31755962/13529383_2560_1440_60fps.mp4"
                    },
                    {
                      "_id": "vq_002",
                      "quality": "720p",
                      "videoUrl": "https://videos.pexels.com/video-files/31755962/13529383_2560_1440_60fps.mp4"
                    }
                  ],
                  "thumbnailUrl": "https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                  "duration": 300
                },
                "type": "video",
                "isCompleted": false,
                "isLocked": false,
                "createdAt": new Date("2025-07-01T10:00:00Z"),
                "updatedAt": new Date("2025-07-01T10:00:00Z")
              }
            ],
            "isCompleted": false,
            "isLocked": false,
            "createdAt": new Date("2025-07-01T10:00:00Z"),
            "updatedAt": new Date("2025-07-01T10:00:00Z")
          }
        ],
        "description": "Learn the basics of machine learning.",
        "isCompleted": false,
        "isLocked": false,
        "createdAt": new Date("2025-07-01T10:00:00Z"),
        "updatedAt": new Date("2025-07-01T10:00:00Z")
      }
    ],
    "instructor": [
      {
        "_id": "instructor_001",
        "name": "Dr. Jane Smith",
        "profileImage": "https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "experience": "10 years in AI research",
        "rating": 4.8,
        "totalStudents": 5000,
        "totalCourses": 3,
        "bio": "Dr. Jane Smith is a leading AI researcher with a PhD in Computer Science.",
        "currentPosition": "Lead Data Scientist at TechCorp",
        "previousExperience": ["Data Scientist at AI Innovations", "Researcher at ML Labs"],
        "education": ["PhD in Computer Science, MIT", "MS in Data Science, Stanford"],
        "linkedinUrl": "https://linkedin.com/in/janesmith"
      }
    ],
    "plans": {
      "elite": {
        "_id": "plan_001",
        "title": "Elite Plan",
        "type": "elite",
        "price": 199.99,
        "features": [
          {
            "title": "Full Course Access",
            "provided": true
          },
          {
            "title": "Certificate of Completion",
            "provided": true
          }
        ],
        "discount": {
          "discount": "percentage",
          "value": 10,
          "startDate": new Date("2025-07-01T00:00:00Z"),
          "endDate": new Date("2025-12-31T23:59:59Z"),
          "isActive": true
        },
        "isPopular": true,
        "billingPeriod": "annually",
        "trialDays": 7,
        "isActive": true,
        "createdAt": new Date("2025-07-01T10:00:00Z"),
        "updatedAt": new Date("2025-07-01T10:00:00Z")
      },
      "essential": {
        "_id": "plan_002",
        "title": "Essential Plan",
        "type": "essential",
        "price": 99.99,
        "features": [
          {
            "title": "Basic Course Access",
            "provided": true
          }
        ],
        "billingPeriod": "monthly",
        "isActive": true,
        "createdAt": new Date("2025-07-01T10:00:00Z"),
        "updatedAt": new Date("2025-07-01T10:00:00Z")
      }
    },
    "reviews": [
      {
        "_id": "review_001",
        "name": "John Doe",
        "rating": 5,
        "comment": "Amazing course with clear explanations!",
        "date": new Date("2025-06-15T10:00:00Z"),
        "isActive": true,
        "createdAt": new Date("2025-06-15T10:00:00Z"),
        "updatedAt": new Date("2025-06-15T10:00:00Z")
      }
    ],
    "featuredReviews": [
      {
        "_id": "review_002",
        "name": "Alice Brown",
        "rating": 4.5,
        "comment": "Very practical and well-structured.",
        "profileImage": "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
        "currentRole": "Data Scientist",
        "currentCompany": "TechCorp",
        "pastRole": "Software Engineer",
        "pastCompany": "StartupXYZ",
        "linkedin": "https://linkedin.com/in/alicebrown",
        "date": new Date("2025-06-10T10:00:00Z"),
        "isActive": true,
        "verified": true,
        "createdAt": new Date("2025-06-10T10:00:00Z"),
        "updatedAt": new Date("2025-06-10T10:00:00Z")
      }
    ],
    "faqs": [
      {
        "_id": "faq_001",
        "question": "What is the prerequisite for this course?",
        "answer": "Basic knowledge of Python and statistics is recommended."
      }
    ],
    "isActive": true,
    "createdAt": new Date("2025-07-01T10:00:00Z"),
    "updatedAt": new Date("2025-07-01T10:00:00Z"),
    "createdBy": "admin_001",
    "tags": ["machine learning", "AI", "Python"],
    "audience": "professionals",
    "slug": "introduction-to-machine-learning",
    "metaTitle": "Introduction to Machine Learning Course",
    "metaDescription": "Learn machine learning with hands-on projects and expert instruction.",
    "keywords": ["machine learning", "AI", "Python", "data science"],
    "scholarship": true,
    "scholarshipDescription": "Scholarships available for eligible students.",
    "scholarshipQuiz": [
      {
        "_id": "quiz_001",
        "title": "Scholarship Eligibility Quiz",
        "description": "Test your eligibility for a scholarship.",
        "questions": [
          {
            "_id": "question_001",
            "question": "Do you have prior coding experience?",
            "options": [
              {
                "_id": "option_001",
                "option": "Yes"
              },
              {
                "_id": "option_002",
                "option": "No"
              }
            ],
            "correctAnswer": [
              {
                "_id": "option_001",
                "option": "Yes"
              }
            ],
            "timeLimit": 30
          }
        ],
        "passingScore": 80,
        "maxAttempts": 2,
        "createdAt": new Date("2025-07-01T10:00:00Z"),
        "updatedAt": new Date("2025-07-01T10:00:00Z")
      }
    ],
    "discount": {
      "discount": "fixed",
      "value": 20,
      "startDate": new Date("2025-07-01T00:00:00Z"),
      "endDate": new Date("2025-12-31T23:59:59Z"),
      "isActive": true
    },
    "language": "English"
  }
];

// Helper function to get courses by category
export const getCoursesByCategory = (category: string): Course[] => {
  return demoCourses.filter(course => 
    course.category.toLowerCase() === category.toLowerCase()
  );
};

// Helper function to get featured courses
export const getFeaturedCourses = (): Course[] => {
  return demoCourses.filter(course => course.isFeatured);
};

// Helper function to get courses by instructor
export const getCoursesByInstructor = (instructorId: string): Course[] => {
  return demoCourses.filter(course => 
    course.instructor.some(inst => inst._id === instructorId)
  );
};

// Helper function to search courses
export const searchCourses = (query: string): Course[] => {
  const lowercaseQuery = query.toLowerCase();
  return demoCourses.filter(course => 
    course.title.toLowerCase().includes(lowercaseQuery) ||
    course.description.toLowerCase().includes(lowercaseQuery) ||
    course.skills.some(skill => skill.toLowerCase().includes(lowercaseQuery)) ||
    course.category.toLowerCase().includes(lowercaseQuery)
  );
}; 