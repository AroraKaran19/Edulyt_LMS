import { Course } from "@/types";

export const demoCourses: Course[] = [
  {
    _id: "course-001",
    title: "Complete Python Programming Bootcamp",
    subtitle: "From Zero to Hero in Python Development",
    description: "Master Python programming from fundamentals to advanced concepts. Build real-world projects, learn data structures, web development with Django, and prepare for a career in Python development.",
    shortDescription: "Comprehensive Python course covering fundamentals to advanced topics with hands-on projects.",
    category: "Programming",
    subcategory: "Python",
    thumbnail: "/CourseCardDemo.jpg",
    images: ["/CourseCardDemo.jpg"],
    previewVideoUrl: "/demoVideo.mp4",
    
    isFeatured: true,
    isCertified: true,
    
    enrolledCount: 15420,
    totalRatings: 4.8,
    totalLectures: 125,
    duration: "40 hours",
    
    whatYouWillLearn: "Build professional Python applications, understand object-oriented programming, work with databases, create web applications with Django, implement data analysis with pandas, and develop problem-solving skills.",
    skills: ["Python Programming", "Django Framework", "Data Analysis", "Web Development", "Object-Oriented Programming", "Database Management"],
    keyFeatures: [
      {
        title: "Hands-on Projects",
        description: "Build 8+ real-world projects including a web scraper, REST API, and full-stack web application"
      },
      {
        title: "Industry-Ready Skills",
        description: "Learn the exact skills and tools used by professional Python developers in the industry"
      },
      {
        title: "Career Support",
        description: "Get resume review, interview preparation, and job placement assistance"
      }
    ],
    features: ["Lifetime Access", "Mobile Learning", "Certificate of Completion", "24/7 Support"],
    careerPaths: ["Python Developer", "Backend Developer", "Data Analyst", "Full-Stack Developer", "DevOps Engineer"],
    skillLevel: "Beginner to Advanced",
    whoShouldJoin: "Anyone interested in learning Python programming, from complete beginners to developers wanting to enhance their skills.",
    prerequisites: ["Basic computer skills", "No prior programming experience required"],
    
    modules: [
      {
        _id: "module-001",
        title: "Python Fundamentals",
        thumbnailUrl: "/CourseCardDemo.jpg",
        description: "Learn the basics of Python programming including syntax, variables, and control structures.",
        order: 1,
        isCompleted: false,
        isLocked: false,
        lessons: [
          {
            _id: "lesson-001",
            title: "Introduction to Python",
            description: "Get started with Python programming and understand why it's popular.",
            order: 1,
            isCompleted: false,
            isLocked: false,
            content: [
              {
                _id: "content-001",
                title: "What is Python?",
                description: "Understanding Python and its applications",
                type: "video",
                order: 1,
                content: [
                  {
                    _id: "video-001",
                    sources: [
                      {
                        _id: "quality-001",
                        quality: "1080p",
                        videoUrl: "/demoVideo.mp4"
                      },
                      {
                        _id: "quality-002",
                        quality: "720p",
                        videoUrl: "/demoVideo.mp4"
                      }
                    ],
                    thumbnailUrl: "/courseVideoDemoPoster.png",
                    duration: 900,
                    order: 1
                  }
                ],
                createdAt: new Date("2024-01-01"),
                updatedAt: new Date("2024-01-01")
              },
              {
                _id: "content-002",
                title: "Python Installation & Setup",
                description: "How to install and set up Python development environment",
                type: "video",
                order: 2,
                content: [
                  {
                    _id: "video-002",
                    sources: [
                      {
                        _id: "quality-003",
                        quality: "1080p",
                        videoUrl: "/demoVideo.mp4"
                      }
                    ],
                    thumbnailUrl: "/courseVideoDemoPoster.png",
                    duration: 720,
                    order: 1
                  }
                ],
                createdAt: new Date("2024-01-01"),
                updatedAt: new Date("2024-01-01")
              }
            ],
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01")
          }
        ],
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01")
      },
      {
        _id: "module-002",
        title: "Advanced Python Concepts",
        thumbnailUrl: "/CourseCardDemo.jpg",
        description: "Dive deep into advanced Python topics including decorators, generators, and metaclasses.",
        order: 2,
        isCompleted: false,
        isLocked: true,
        lessons: [],
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01")
      }
    ],
    
    instructor: [
      {
        _id: "instructor-001",
        name: "Dr. Sarah Johnson",
        profileImage: "/courseDefaultTestimonial.png",
        experience: "8+ years",
        rating: 4.9,
        totalStudents: 50000,
        totalCourses: 12,
        bio: "Senior Software Engineer at Google with extensive experience in Python development and machine learning.",
        currentPosition: "Senior Software Engineer at Google",
        previousExperience: ["Python Developer at Microsoft", "Data Scientist at Facebook"],
        education: ["PhD in Computer Science - Stanford University", "MS in Software Engineering - MIT"],
        linkedinUrl: "https://linkedin.com/in/sarah-johnson"
      }
    ],
    
    plans: {
      essential: [
        {
          _id: "plan-001",
          title: "Essential",
          type: "essential",
          price: 2999,
          billingPeriod: "lifetime",
          features: [
            { title: "Lifetime Access", provided: true, description: "Access course forever", order: 1 },
            { title: "Mobile Learning", provided: true, description: "Learn on any device", order: 2 },
            { title: "Basic Support", provided: true, description: "Email support", order: 3 },
            { title: "Certificate", provided: false, description: "Course completion certificate", order: 4 },
            { title: "1-on-1 Mentoring", provided: false, description: "Personal guidance", order: 5 }
          ],
          isPopular: false,
          isActive: true,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01")
        }
      ],
      elite: [
        {
          _id: "plan-002",
          title: "Elite",
          type: "elite",
          price: 4999,
          billingPeriod: "lifetime",
          features: [
            { title: "Lifetime Access", provided: true, description: "Access course forever", order: 1 },
            { title: "Mobile Learning", provided: true, description: "Learn on any device", order: 2 },
            { title: "Priority Support", provided: true, description: "24/7 priority support", order: 3 },
            { title: "Certificate", provided: true, description: "Course completion certificate", order: 4 },
            { title: "1-on-1 Mentoring", provided: true, description: "Personal guidance sessions", order: 5 }
          ],
          isPopular: true,
          isActive: true,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01")
        }
      ]
    },
    
    reviews: [
      {
        _id: "review-001",
        name: "Alex Kumar",
        rating: 5,
        comment: "Excellent course! The instructor explains complex concepts in a very simple way. Highly recommended for anyone wanting to learn Python.",
        date: new Date("2024-01-15"),
        isActive: true,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15")
      },
      {
        _id: "review-002",
        name: "Maria Garcia",
        rating: 4,
        comment: "Great content and well-structured lessons. The projects are really helpful for understanding concepts practically.",
        date: new Date("2024-01-10"),
        isActive: true,
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-10")
      }
    ],
    
    featuredReviews: [
      {
        _id: "featured-001",
        name: "David Chen",
        rating: 5,
        comment: "This course changed my career! Got a Python developer job within 3 months of completing it.",
        date: new Date("2024-01-20"),
        verified: true,
        isActive: true,
        createdAt: new Date("2024-01-20"),
        updatedAt: new Date("2024-01-20")
      }
    ],
    
    faqs: [
      {
        _id: "faq-001",
        question: "Do I need any prior programming experience?",
        answer: "No, this course is designed for complete beginners. We start from the very basics and gradually build up to advanced concepts.",
        order: 1
      },
      {
        _id: "faq-002",
        question: "How long does it take to complete the course?",
        answer: "The course contains 40 hours of content. With consistent practice (2-3 hours per day), you can complete it in 3-4 weeks.",
        order: 2
      },
      {
        _id: "faq-003",
        question: "Will I get a certificate upon completion?",
        answer: "Yes, you'll receive a certificate of completion that you can add to your LinkedIn profile and resume.",
        order: 3
      }
    ],
    
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-15"),
    createdBy: "admin-001",
    tags: ["python", "programming", "backend", "web-development"],
    audience: "professionals",
    
    slug: "complete-python-programming-bootcamp",
    metaTitle: "Complete Python Programming Bootcamp - Learn Python from Scratch",
    metaDescription: "Master Python programming with our comprehensive bootcamp. Build real projects, learn Django, and advance your career.",
    keywords: ["python", "programming", "bootcamp", "django", "web development"],
    
    scholarship: true,
    scholarshipDescription: "Need based scholarships available for students. Apply with your academic transcripts and financial need documentation.",
    
    discount: {
      discount: "percentage",
      value: 30,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-02-01"),
      isActive: true
    }
  },
  
  {
    _id: "course-002",
    title: "Data Science with Machine Learning",
    subtitle: "Complete Guide to Data Science and ML",
    description: "Comprehensive data science course covering Python, statistics, machine learning algorithms, and real-world projects. Learn to analyze data and build predictive models.",
    shortDescription: "Master data science and machine learning with hands-on projects and industry tools.",
    category: "Data Science",
    subcategory: "Machine Learning",
    thumbnail: "/CourseCardDemo.jpg",
    images: ["/CourseCardDemo.jpg"],
    previewVideoUrl: "/demoVideo.mp4",
    
    isFeatured: false,
    isCertified: true,
    
    enrolledCount: 8750,
    totalRatings: 4.7,
    totalLectures: 95,
    duration: "35 hours",
    
    whatYouWillLearn: "Perform data analysis, implement machine learning algorithms, work with pandas and scikit-learn, create data visualizations, and build end-to-end ML projects.",
    skills: ["Data Analysis", "Machine Learning", "Python", "Pandas", "Scikit-learn", "Data Visualization"],
    keyFeatures: [
      {
        title: "Real-world Projects",
        description: "Work on 5+ industry-standard data science projects"
      },
      {
        title: "Industry Tools",
        description: "Learn tools actually used by data scientists in companies"
      }
    ],
    features: ["Lifetime Access", "Downloadable Resources", "Certificate", "Community Access"],
    careerPaths: ["Data Scientist", "ML Engineer", "Data Analyst", "Research Analyst"],
    skillLevel: "Intermediate",
    whoShouldJoin: "Professionals with basic Python knowledge who want to transition into data science.",
    prerequisites: ["Basic Python programming", "High school mathematics"],
    
    modules: [
      {
        _id: "module-003",
        title: "Data Analysis Fundamentals",
        thumbnailUrl: "/CourseCardDemo.jpg",
        description: "Learn the basics of data analysis using Python and pandas.",
        order: 1,
        isCompleted: false,
        isLocked: false,
        lessons: [],
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01")
      }
    ],
    
    instructor: [
      {
        _id: "instructor-002",
        name: "Prof. Michael Zhang",
        profileImage: "/courseDefaultTestimonial.png",
        experience: "12+ years",
        rating: 4.8,
        totalStudents: 35000,
        totalCourses: 8,
        bio: "Data Science Lead at Netflix with PhD in Statistics and extensive industry experience.",
        currentPosition: "Data Science Lead at Netflix",
        previousExperience: ["Senior Data Scientist at Uber", "ML Engineer at Amazon"],
        education: ["PhD in Statistics - UC Berkeley", "MS in Computer Science - Carnegie Mellon"],
        linkedinUrl: "https://linkedin.com/in/michael-zhang"
      }
    ],
    
    plans: {
      essential: [
        {
          _id: "plan-003",
          title: "Essential",
          type: "essential",
          price: 3999,
          billingPeriod: "lifetime",
          features: [
            { title: "Course Access", provided: true, description: "Full course content", order: 1 },
            { title: "Basic Support", provided: true, description: "Email support", order: 2 },
            { title: "Certificate", provided: false, description: "Completion certificate", order: 3 }
          ],
          isPopular: false,
          isActive: true,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01")
        }
      ],
      elite: [
        {
          _id: "plan-004",
          title: "Elite",
          type: "elite",
          price: 5999,
          billingPeriod: "lifetime",
          features: [
            { title: "Course Access", provided: true, description: "Full course content", order: 1 },
            { title: "Priority Support", provided: true, description: "24/7 priority support", order: 2 },
            { title: "Certificate", provided: true, description: "Verified certificate", order: 3 },
            { title: "Job Assistance", provided: true, description: "Career guidance", order: 4 }
          ],
          isPopular: true,
          isActive: true,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01")
        }
      ]
    },
    
    reviews: [
      {
        _id: "review-003",
        name: "Jennifer Lee",
        rating: 5,
        comment: "Amazing course! The practical approach really helped me understand complex ML concepts.",
        date: new Date("2024-01-12"),
        isActive: true,
        createdAt: new Date("2024-01-12"),
        updatedAt: new Date("2024-01-12")
      }
    ],
    
    featuredReviews: [
      {
        _id: "featured-002",
        name: "Robert Smith",
        rating: 5,
        comment: "Transitioned from software engineer to data scientist after this course. Excellent content!",
        date: new Date("2024-01-18"),
        verified: true,
        isActive: true,
        createdAt: new Date("2024-01-18"),
        updatedAt: new Date("2024-01-18")
      }
    ],
    
    faqs: [
      {
        _id: "faq-004",
        question: "What programming experience do I need?",
        answer: "You should have basic Python programming knowledge. If you're new to Python, we recommend taking our Python course first.",
        order: 1
      },
      {
        _id: "faq-005",
        question: "What tools will I learn?",
        answer: "You'll learn Python, Pandas, NumPy, Scikit-learn, Matplotlib, Seaborn, and Jupyter Notebooks.",
        order: 2
      }
    ],
    
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-12"),
    createdBy: "admin-001",
    tags: ["data-science", "machine-learning", "python", "analytics"],
    audience: "professionals",
    
    slug: "data-science-machine-learning-course",
    metaTitle: "Data Science with Machine Learning Course - Complete Guide",
    metaDescription: "Learn data science and machine learning with Python. Build real projects and advance your career.",
    keywords: ["data science", "machine learning", "python", "analytics", "AI"],
    
    scholarship: false
  },
  
  {
    _id: "course-003",
    title: "Web Development with React & Node.js",
    subtitle: "Build Modern Full-Stack Applications",
    description: "Learn to build modern web applications using React for frontend and Node.js for backend. Master the MERN stack and deploy production-ready applications.",
    shortDescription: "Complete full-stack web development course using React, Node.js, and MongoDB.",
    category: "Web Development",
    subcategory: "Full Stack",
    thumbnail: "/CourseCardDemo.jpg",
    images: ["/CourseCardDemo.jpg"],
    previewVideoUrl: "/demoVideo.mp4",
    
    isFeatured: true,
    isCertified: true,
    
    enrolledCount: 12300,
    totalRatings: 4.9,
    totalLectures: 110,
    duration: "45 hours",
    
    whatYouWillLearn: "Build responsive React applications, create RESTful APIs with Node.js, work with MongoDB databases, implement authentication, and deploy applications to production.",
    skills: ["React", "Node.js", "MongoDB", "Express.js", "JavaScript", "API Development"],
    keyFeatures: [
      {
        title: "Modern Stack",
        description: "Learn the latest versions of React, Node.js, and MongoDB"
      },
      {
        title: "Production Deployment",
        description: "Deploy your applications to AWS and Vercel"
      }
    ],
    features: ["Lifetime Access", "Source Code", "Certificate", "Job Support"],
    careerPaths: ["Full-Stack Developer", "Frontend Developer", "Backend Developer", "MERN Stack Developer"],
    skillLevel: "Intermediate",
    whoShouldJoin: "Developers with basic JavaScript knowledge who want to learn modern full-stack development.",
    prerequisites: ["HTML, CSS, JavaScript fundamentals", "Basic understanding of programming concepts"],
    
    modules: [
      {
        _id: "module-004",
        title: "React Fundamentals",
        thumbnailUrl: "/CourseCardDemo.jpg",
        description: "Learn React from basics to advanced concepts including hooks and context.",
        order: 1,
        isCompleted: false,
        isLocked: false,
        lessons: [],
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01")
      }
    ],
    
    instructor: [
      {
        _id: "instructor-003",
        name: "Emma Wilson",
        profileImage: "/courseDefaultTestimonial.png",
        experience: "6+ years",
        rating: 4.9,
        totalStudents: 28000,
        totalCourses: 6,
        bio: "Senior Frontend Engineer at Airbnb with expertise in React and modern web technologies.",
        currentPosition: "Senior Frontend Engineer at Airbnb",
        previousExperience: ["Frontend Developer at Spotify", "Web Developer at Shopify"],
        education: ["BS in Computer Science - University of Washington", "Full Stack Bootcamp - App Academy"],
        linkedinUrl: "https://linkedin.com/in/emma-wilson"
      }
    ],
    
    plans: {
      essential: [
        {
          _id: "plan-005",
          title: "Essential",
          type: "essential",
          price: 3499,
          billingPeriod: "lifetime",
          features: [
            { title: "Course Access", provided: true, description: "Full course content", order: 1 },
            { title: "Source Code", provided: true, description: "All project source code", order: 2 },
            { title: "Basic Support", provided: true, description: "Community support", order: 3 },
            { title: "Certificate", provided: false, description: "Completion certificate", order: 4 }
          ],
          isPopular: false,
          isActive: true,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01")
        }
      ],
      elite: [
        {
          _id: "plan-006",
          title: "Elite",
          type: "elite",
          price: 5499,
          billingPeriod: "lifetime",
          features: [
            { title: "Course Access", provided: true, description: "Full course content", order: 1 },
            { title: "Source Code", provided: true, description: "All project source code", order: 2 },
            { title: "Priority Support", provided: true, description: "Direct instructor access", order: 3 },
            { title: "Certificate", provided: true, description: "Verified certificate", order: 4 },
            { title: "Code Reviews", provided: true, description: "Personal code reviews", order: 5 }
          ],
          isPopular: true,
          isActive: true,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01")
        }
      ]
    },
    
    reviews: [
      {
        _id: "review-004",
        name: "Carlos Rodriguez",
        rating: 5,
        comment: "Best full-stack course I've taken! The projects are really practical and industry-relevant.",
        date: new Date("2024-01-14"),
        isActive: true,
        createdAt: new Date("2024-01-14"),
        updatedAt: new Date("2024-01-14")
      }
    ],
    
    featuredReviews: [
      {
        _id: "featured-003",
        name: "Lisa Thompson",
        rating: 5,
        comment: "Got hired as a full-stack developer after completing this course. The portfolio projects were key!",
        date: new Date("2024-01-19"),
        verified: true,
        isActive: true,
        createdAt: new Date("2024-01-19"),
        updatedAt: new Date("2024-01-19")
      }
    ],
    
    faqs: [
      {
        _id: "faq-006",
        question: "Is this course suitable for beginners?",
        answer: "This course is designed for those with basic JavaScript knowledge. If you're completely new to programming, we recommend starting with our JavaScript fundamentals course.",
        order: 1
      },
      {
        _id: "faq-007",
        question: "What projects will I build?",
        answer: "You'll build 3 major projects: a social media app, an e-commerce platform, and a task management system.",
        order: 2
      }
    ],
    
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-14"),
    createdBy: "admin-001",
    tags: ["react", "nodejs", "javascript", "fullstack", "mern"],
    audience: "professionals",
    
    slug: "react-nodejs-fullstack-course",
    metaTitle: "Full-Stack Web Development with React & Node.js",
    metaDescription: "Master full-stack development with React and Node.js. Build modern web applications and advance your career.",
    keywords: ["react", "nodejs", "fullstack", "javascript", "web development"],
    
    scholarship: true,
    scholarshipDescription: "Merit-based scholarships available for top performers in our assessment test."
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