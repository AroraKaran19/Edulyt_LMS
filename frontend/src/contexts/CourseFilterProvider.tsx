"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Course, Filter } from "@/types";

interface CourseFilterContextType {
  courses: Course[];
  setCourses: (courses: Course[]) => void;
  isFetching: boolean;
  setIsFetching: (isFetching: boolean) => void;
  search: string;
  setSearch: (search: string) => void;
  filters: Filter[];
  setFilters: (filters: Filter[]) => void;
  selectedFilter: Filter[];
  setSelectedFilter: (selectedFilter: Filter[]) => void;
  handleFilterClick: (filter: Filter) => void;
}

const CourseFilterContext = createContext<CourseFilterContextType | null>(null);

const CourseFilterProvider = ({ children }: { children: React.ReactNode }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filter[]>([
    {
      label: "All",
      value: "all",
    },
    {
      label: "Data Science",
      value: "data-science",
      featureBox: {
        value: "100+",
      },
    },
    {
      label: "Machine Learning",
      value: "machine-learning",
    },
    {
      label: "AI",
      value: "ai",
      featureBox: {
        value: "200+",
      },
    },
    {
      label: "Web Development",
      value: "web-development",
    },
  ]);
  const [selectedFilter, setSelectedFilter] = useState<
    { label: string; value: string }[]
  >([
    {
      label: "All",
      value: "all",
    },
  ]);

  const handleFilterClick = (filter: Filter) => {
    if (filter.value === "all") {
      setSelectedFilter([filters[0]]);
    } else {
      const isCurrentlySelected = selectedFilter.some(
        (f) => f.value === filter.value
      );

      if (isCurrentlySelected) {
        const newSelection = selectedFilter.filter(
          (f) => f.value !== filter.value
        );
        setSelectedFilter(
          newSelection.length === 0 ? [filters[0]] : newSelection
        );
      } else {
        // If clicking on a new filter, add it and remove "All" if present
        const withoutAll = selectedFilter.filter((f) => f.value !== "all");
        setSelectedFilter([...withoutAll, filter]);
      }
    }
  };

  useEffect(() => {
    setIsFetching(true);
    setTimeout(() => {
      setCourses([
        {
          id: "1",
          title: "Complete Python Data Science Bootcamp",
          subtitle: "Master Python, Pandas, NumPy, and Machine Learning",
          description: "Comprehensive course covering Python fundamentals, data manipulation, visualization, and machine learning algorithms. Perfect for beginners and intermediate learners.",
          shortDescription: "Learn Python for data science from scratch",
          category: "Data Science",
          subcategory: "Python",
          thumbnail: "/CourseCardDemo.jpg",
          previewVideoUrl: "/courseVideoDemoPoster.png",
          isFeatured: true,
          isCertified: true,
          totalRatings: 4.8,
          enrolledCount: 15420,
          totalLectures: 120,
          language: "English",
          skillLevel: "Beginner",
          duration: "45 hours",
          lastUpdated: new Date("2024-01-15"),
          modules: [
            {
              id: "m1",
              title: "Python Fundamentals",
              duration: "8 hours",
              lessons: [
                {
                  id: "l1",
                  title: "Introduction to Python",
                  duration: "45min",
                  completed: true,
                  isForCollegeStudent: true
                }
              ]
            }
          ],
          whatYouWillLearn: [
            "Python programming fundamentals",
            "Data manipulation with Pandas",
            "Data visualization with Matplotlib",
            "Machine learning basics"
          ],
          whoShouldJoin: "Anyone interested in data science and Python programming",
          prerequisites: ["Basic computer knowledge"],
          instructor: [
            {
              id: "i1",
              name: "Dr. Sarah Johnson",
              profileImage: "/courseDefaultTestimonial.png",
              experience: "8 years of Experience",
              rating: 4.9,
              totalStudents: 25000,
              totalCourses: 12,
              bio: "Data Science expert with PhD in Computer Science",
              currentPosition: "Senior Data Scientist at Google",
              linkedinUrl: "https://linkedin.com/in/sarah-johnson"
            }
          ],
          plan: {
            professionals: {
              price: 299,
              features: ["Full course access", "Certificate", "1-on-1 mentoring"]
            },
            collegeStudents: {
              price: 199,
              features: ["Full course access", "Certificate"]
            }
          },
          featuredReviews: [
            {
              id: "r1",
              studentName: "John Doe",
              rating: 5,
              comment: "Excellent course! Very comprehensive.",
              date: new Date("2024-01-10"),
              verified: true
            }
          ],
          features: ["Lifetime access", "Mobile and TV access", "Certificate of completion"],
          faqs: [
            {
              id: "f1",
              question: "Is this suitable for beginners?",
              answer: "Yes, this course is designed for complete beginners.",
              order: 1
            }
          ],
          isActive: true,
          createdAt: new Date("2023-12-01"),
          updatedAt: new Date("2024-01-15"),
          createdBy: "admin",
          tags: ["python", "data-science", "machine-learning"],
          discount: 20,
          discountEndDate: new Date("2024-02-28"),
          slug: "complete-python-data-science-bootcamp",
          scholarship: true,
          scholarshipDescription: "Get 50% off your course with our scholarship program.",
        },
        {
          id: "2",
          title: "Advanced Machine Learning with TensorFlow",
          subtitle: "Deep Learning and Neural Networks Masterclass",
          description: "Advanced course covering deep learning, neural networks, and TensorFlow implementation. Build real-world AI applications.",
          shortDescription: "Master deep learning with TensorFlow",
          category: "Machine Learning",
          subcategory: "Deep Learning",
          thumbnail: "/CourseCardDemo.jpg",
          previewVideoUrl: "/courseVideoDemoPoster.png",
          isFeatured: false,
          isCertified: true,
          totalRatings: 4.7,
          enrolledCount: 8900,
          totalLectures: 95,
          language: "English",
          skillLevel: "Intermediate",
          duration: "38 hours",
          lastUpdated: new Date("2024-01-10"),
          modules: [
            {
              id: "m2",
              title: "Neural Networks Fundamentals",
              duration: "12 hours",
              lessons: [
                {
                  id: "l2",
                  title: "Introduction to Neural Networks",
                  duration: "60min",
                  completed: true,
                  isForCollegeStudent: true
                }
              ]
            }
          ],
          whatYouWillLearn: [
            "Deep learning concepts",
            "TensorFlow implementation",
            "Neural network architectures",
            "Computer vision applications"
          ],
          whoShouldJoin: "Data scientists and ML engineers looking to advance their skills",
          prerequisites: ["Python knowledge", "Basic machine learning understanding"],
          instructor: [
            {
              id: "i2",
              name: "Prof. Michael Chen",
              profileImage: "/courseDefaultTestimonial.png",
              experience: "12 years of Experience",
              rating: 4.8,
              totalStudents: 18000,
              totalCourses: 8,
              bio: "AI researcher and professor specializing in deep learning",
              currentPosition: "AI Research Director at Microsoft",
              linkedinUrl: "https://linkedin.com/in/michael-chen"
            }
          ],
          plan: {
            professionals: {
              price: 399,
              features: ["Full course access", "Certificate", "Project reviews"]
            },
            collegeStudents: {
              price: 249,
              features: ["Full course access", "Certificate"]
            }
          },
          featuredReviews: [
            {
              id: "r2",
              studentName: "Alice Smith",
              rating: 5,
              comment: "Amazing depth and practical examples!",
              date: new Date("2024-01-08"),
              verified: true
            }
          ],
          features: ["Hands-on projects", "GPU access", "Industry case studies"],
          faqs: [
            {
              id: "f2",
              question: "Do I need GPU for this course?",
              answer: "We provide cloud GPU access for all students.",
              order: 1
            }
          ],
          isActive: true,
          createdAt: new Date("2023-11-15"),
          updatedAt: new Date("2024-01-10"),
          createdBy: "admin",
          tags: ["tensorflow", "deep-learning", "ai"],
          discount: 15,
          discountEndDate: new Date("2024-02-15"),
          slug: "advanced-machine-learning-tensorflow",
          scholarship: true,
          scholarshipDescription: "Get 50% off your course with our scholarship program.",
        },
        {
          id: "3",
          title: "Full Stack Web Development with React & Node.js",
          subtitle: "Build Modern Web Applications from Scratch",
          description: "Complete full-stack development course covering React, Node.js, Express, and MongoDB. Create production-ready web applications.",
          shortDescription: "Master full-stack web development",
          category: "Web Development",
          subcategory: "Full Stack",
          thumbnail: "/CourseCardDemo.jpg",
          previewVideoUrl: "/courseVideoDemoPoster.png",
          isFeatured: true,
          isCertified: true,
          totalRatings: 4.9,
          enrolledCount: 22000,
          totalLectures: 150,
          language: "English",
          skillLevel: "Beginner",
          duration: "55 hours",
          lastUpdated: new Date("2024-01-20"),
          modules: [
            {
              id: "m3",
              title: "React Fundamentals",
              duration: "15 hours",
              lessons: [
                {
                  id: "l3",
                  title: "Introduction to React",
                  duration: "50min",
                  completed: true,
                  isForCollegeStudent: true
                }
              ]
            }
          ],
          whatYouWillLearn: [
            "React development",
            "Node.js backend development",
            "Database design with MongoDB",
            "API development and integration"
          ],
          whoShouldJoin: "Aspiring web developers and career changers",
          prerequisites: ["Basic HTML, CSS, JavaScript knowledge"],
          instructor: [
            {
              id: "i3",
              name: "David Rodriguez",
              profileImage: "/courseDefaultTestimonial.png",
              experience: "10 years of Experience",
              rating: 4.9,
              totalStudents: 35000,
              totalCourses: 15,
              bio: "Full-stack developer and tech entrepreneur",
              currentPosition: "CTO at TechStartup Inc.",
              linkedinUrl: "https://linkedin.com/in/david-rodriguez"
            }
          ],
          plan: {
            professionals: {
              price: 349,
              features: ["Full course access", "Certificate", "Code reviews", "Job assistance"]
            },
            collegeStudents: {
              price: 229,
              features: ["Full course access", "Certificate", "Code reviews"]
            }
          },
          featuredReviews: [
            {
              id: "r3",
              studentName: "Emma Wilson",
              rating: 5,
              comment: "Best web development course I've ever taken!",
              date: new Date("2024-01-18"),
              verified: true
            }
          ],
          features: ["Real-world projects", "Career guidance", "Community access"],
          faqs: [
            {
              id: "f3",
              question: "Will I be job-ready after this course?",
              answer: "Yes, this course includes job preparation and portfolio building.",
              order: 1
            }
          ],
          isActive: true,
          createdAt: new Date("2023-10-01"),
          updatedAt: new Date("2024-01-20"),
          createdBy: "admin",
          tags: ["react", "nodejs", "fullstack", "mongodb"],
          discount: 25,
          discountEndDate: new Date("2024-03-01"),
          slug: "full-stack-web-development-react-nodejs",
          scholarship: true,
          scholarshipDescription: "Get 50% off your course with our scholarship program.",
        },
        {
          id: "4",
          title: "Artificial Intelligence for Business Leaders",
          subtitle: "Strategic AI Implementation and Leadership",
          description: "Executive-level course on AI strategy, implementation, and leadership. Learn to drive AI transformation in your organization.",
          shortDescription: "AI strategy for business leaders",
          category: "AI",
          subcategory: "Business Strategy",
          thumbnail: "/CourseCardDemo.jpg",
          previewVideoUrl: "/courseVideoDemoPoster.png",
          isFeatured: false,
          isCertified: true,
          totalRatings: 4.6,
          enrolledCount: 5200,
          totalLectures: 60,
          language: "English",
          skillLevel: "Intermediate",
          duration: "25 hours",
          lastUpdated: new Date("2024-01-12"),
          modules: [
            {
              id: "m4",
              title: "AI Strategy Fundamentals",
              duration: "6 hours",
              lessons: [
                {
                  id: "l4",
                  title: "AI in Business Context",
                  duration: "40min",
                  completed: true,
                  isForCollegeStudent: false
                }
              ]
            }
          ],
          whatYouWillLearn: [
            "AI strategy development",
            "Change management for AI",
            "ROI measurement for AI projects",
            "Ethical AI implementation"
          ],
          whoShouldJoin: "Business leaders, executives, and managers",
          prerequisites: ["Business management experience"],
          instructor: [
            {
              id: "i4",
              name: "Dr. Jennifer Park",
              profileImage: "/courseDefaultTestimonial.png",
              experience: "15 years of Experience",
              rating: 4.7,
              totalStudents: 12000,
              totalCourses: 6,
              bio: "AI consultant and former McKinsey partner",
              currentPosition: "CEO at AI Strategy Consulting",
              linkedinUrl: "https://linkedin.com/in/jennifer-park"
            }
          ],
          plan: {
            professionals: {
              price: 599,
              features: ["Executive-level content", "Certificate", "1-on-1 strategy session"]
            },
            collegeStudents: {
              price: 399,
              features: ["Full course access", "Certificate"]
            }
          },
          featuredReviews: [
            {
              id: "r4",
              studentName: "Robert Johnson",
              rating: 5,
              comment: "Transformed how I think about AI in business.",
              date: new Date("2024-01-05"),
              verified: true
            }
          ],
          features: ["Case studies", "Strategic frameworks", "Executive networking"],
          faqs: [
            {
              id: "f4",
              question: "Is this technical or business-focused?",
              answer: "This is business-focused with minimal technical content.",
              order: 1
            }
          ],
          isActive: true,
          createdAt: new Date("2023-11-20"),
          updatedAt: new Date("2024-01-12"),
          createdBy: "admin",
          tags: ["ai", "business-strategy", "leadership"],
          discount: 10,
          discountEndDate: new Date("2024-02-20"),
          slug: "ai-for-business-leaders",
          scholarship: true,
          scholarshipDescription: "Get 50% off your course with our scholarship program.",
        },
        {
          id: "5",
          title: "Advanced Data Visualization with D3.js",
          subtitle: "Create Interactive and Beautiful Data Visualizations",
          description: "Master D3.js to create stunning, interactive data visualizations. Learn advanced techniques for web-based data storytelling.",
          shortDescription: "Master D3.js for data visualization",
          category: "Data Science",
          subcategory: "Visualization",
          thumbnail: "/CourseCardDemo.jpg",
          previewVideoUrl: "/courseVideoDemoPoster.png",
          isFeatured: false,
          isCertified: true,
          totalRatings: 4.5,
          enrolledCount: 6800,
          totalLectures: 85,
          language: "English",
          skillLevel: "Intermediate",
          duration: "32 hours",
          lastUpdated: new Date("2024-01-08"),
          modules: [
            {
              id: "m5",
              title: "D3.js Fundamentals",
              duration: "10 hours",
              lessons: [
                {
                  id: "l5",
                  title: "Introduction to D3.js",
                  duration: "55min",
                  completed: true,
                  isForCollegeStudent: true
                }
              ]
            }
          ],
          whatYouWillLearn: [
            "D3.js library mastery",
            "Interactive visualizations",
            "Data binding and manipulation",
            "Advanced animation techniques"
          ],
          whoShouldJoin: "Data analysts, web developers, and designers",
          prerequisites: ["JavaScript knowledge", "Basic HTML/CSS"],
          instructor: [
            {
              id: "i5",
              name: "Lisa Thompson",
              profileImage: "/courseDefaultTestimonial.png",
              experience: "9 years of Experience",
              rating: 4.6,
              totalStudents: 14000,
              totalCourses: 7,
              bio: "Data visualization specialist and UX designer",
              currentPosition: "Lead Data Visualization Engineer at Netflix",
              linkedinUrl: "https://linkedin.com/in/lisa-thompson"
            }
          ],
          plan: {
            professionals: {
              price: 279,
              features: ["Full course access", "Certificate", "Portfolio projects"]
            },
            collegeStudents: {
              price: 179,
              features: ["Full course access", "Certificate"]
            }
          },
          featuredReviews: [
            {
              id: "r5",
              studentName: "Mark Davis",
              rating: 4,
              comment: "Great course, very detailed explanations.",
              date: new Date("2024-01-03"),
              verified: true
            }
          ],
          features: ["Interactive projects", "Portfolio building", "Industry examples"],
          faqs: [
            {
              id: "f5",
              question: "Do I need design experience?",
              answer: "No, we cover design principles as part of the course.",
              order: 1
            }
          ],
          isActive: true,
          createdAt: new Date("2023-12-10"),
          updatedAt: new Date("2024-01-08"),
          createdBy: "admin",
          tags: ["d3js", "visualization", "javascript"],
          slug: "advanced-data-visualization-d3js",
          scholarship: true,
          scholarshipDescription: "Get 50% off your course with our scholarship program.",
        },
        {
          id: "6",
          title: "Cybersecurity Fundamentals for Developers",
          subtitle: "Secure Coding Practices and Threat Prevention",
          description: "Essential cybersecurity course for developers. Learn secure coding practices, threat modeling, and vulnerability assessment.",
          shortDescription: "Learn cybersecurity for developers",
          category: "Web Development",
          subcategory: "Security",
          thumbnail: "/CourseCardDemo.jpg",
          previewVideoUrl: "/courseVideoDemoPoster.png",
          isFeatured: false,
          isCertified: true,
          totalRatings: 4.7,
          enrolledCount: 9500,
          totalLectures: 75,
          language: "English",
          skillLevel: "Intermediate",
          duration: "28 hours",
          lastUpdated: new Date("2024-01-14"),
          modules: [
            {
              id: "m6",
              title: "Security Fundamentals",
              duration: "8 hours",
              lessons: [
                {
                  id: "l6",
                  title: "Introduction to Cybersecurity",
                  duration: "45min",
                  completed: true,
                  isForCollegeStudent: true
                }
              ]
            }
          ],
          whatYouWillLearn: [
            "Secure coding practices",
            "Threat modeling",
            "Vulnerability assessment",
            "Incident response planning"
          ],
          whoShouldJoin: "Software developers and security professionals",
          prerequisites: ["Programming experience", "Basic networking knowledge"],
          instructor: [
            {
              id: "i6",
              name: "Alex Kumar",
              profileImage: "/courseDefaultTestimonial.png",
              experience: "11 years of Experience",
              rating: 4.8,
              totalStudents: 16000,
              totalCourses: 9,
              bio: "Cybersecurity expert and ethical hacker",
              currentPosition: "Security Architect at CyberTech Solutions",
              linkedinUrl: "https://linkedin.com/in/alex-kumar"
            }
          ],
          plan: {
            professionals: {
              price: 329,
              features: ["Full course access", "Certificate", "Security tools access"]
            },
            collegeStudents: {
              price: 219,
              features: ["Full course access", "Certificate"]
            }
          },
          featuredReviews: [
            {
              id: "r6",
              studentName: "Sarah Lee",
              rating: 5,
              comment: "Excellent practical approach to security!",
              date: new Date("2024-01-12"),
              verified: true
            }
          ],
          features: ["Hands-on labs", "Real-world scenarios", "Security certifications prep"],
          faqs: [
            {
              id: "f6",
              question: "Is this suitable for beginners?",
              answer: "You need basic programming knowledge to get the most out of this course.",
              order: 1
            }
          ],
          isActive: true,
          createdAt: new Date("2023-11-30"),
          updatedAt: new Date("2024-01-14"),
          createdBy: "admin",
          tags: ["cybersecurity", "security", "development"],
          discount: 18,
          discountEndDate: new Date("2024-02-25"),
          slug: "cybersecurity-fundamentals-developers",
          scholarship: true,
          scholarshipDescription: "Get 50% off your course with our scholarship program.",
        },
        {
          id: "7",
          title: "Cloud Computing with AWS",
          subtitle: "Master Amazon Web Services for Modern Applications",
          description: "Comprehensive AWS course covering EC2, S3, Lambda, and more. Build scalable cloud applications and prepare for AWS certifications.",
          shortDescription: "Master AWS cloud computing",
          category: "Web Development",
          subcategory: "Cloud Computing",
          thumbnail: "/CourseCardDemo.jpg",
          previewVideoUrl: "/courseVideoDemoPoster.png",
          isFeatured: true,
          isCertified: true,
          totalRatings: 4.8,
          enrolledCount: 13500,
          totalLectures: 110,
          language: "English",
          skillLevel: "Beginner",
          duration: "42 hours",
          lastUpdated: new Date("2024-01-18"),
          modules: [
            {
              id: "m7",
              title: "AWS Fundamentals",
              duration: "12 hours",
              lessons: [
                {
                  id: "l7",
                  title: "Introduction to AWS",
                  duration: "50min",
                  completed: true,
                  isForCollegeStudent: true
                }
              ]
            }
          ],
          whatYouWillLearn: [
            "AWS core services",
            "Cloud architecture design",
            "Serverless computing",
            "DevOps with AWS"
          ],
          whoShouldJoin: "Developers, system administrators, and cloud enthusiasts",
          prerequisites: ["Basic programming knowledge"],
          instructor: [
            {
              id: "i7",
              name: "Ryan Mitchell",
              profileImage: "/courseDefaultTestimonial.png",
              experience: "13 years of Experience",
              rating: 4.9,
              totalStudents: 28000,
              totalCourses: 11,
              bio: "AWS Solutions Architect and cloud consultant",
              currentPosition: "Principal Cloud Architect at Amazon",
              linkedinUrl: "https://linkedin.com/in/ryan-mitchell"
            }
          ],
          plan: {
            professionals: {
              price: 379,
              features: ["Full course access", "Certificate", "AWS credits", "Exam prep"]
            },
            collegeStudents: {
              price: 249,
              features: ["Full course access", "Certificate", "AWS credits"]
            }
          },
          featuredReviews: [
            {
              id: "r7",
              studentName: "Tom Wilson",
              rating: 5,
              comment: "Perfect for AWS certification prep!",
              date: new Date("2024-01-16"),
              verified: true
            }
          ],
          features: ["AWS free tier usage", "Certification preparation", "Real projects"],
          faqs: [
            {
              id: "f7",
              question: "Will I get AWS credits?",
              answer: "Yes, we provide AWS credits for hands-on practice.",
              order: 1
            }
          ],
          isActive: true,
          createdAt: new Date("2023-10-15"),
          updatedAt: new Date("2024-01-18"),
          createdBy: "admin",
          tags: ["aws", "cloud-computing", "devops"],
          discount: 22,
          discountEndDate: new Date("2024-03-05"),
          slug: "cloud-computing-aws",
          scholarship: true,
          scholarshipDescription: "Get 50% off your course with our scholarship program.",
        },
        {
          id: "8",
          title: "Mobile App Development with React Native",
          subtitle: "Build Cross-Platform Mobile Apps",
          description: "Learn to build native mobile apps for iOS and Android using React Native. Create real-world applications with modern mobile development practices.",
          shortDescription: "Build mobile apps with React Native",
          category: "Web Development",
          subcategory: "Mobile Development",
          thumbnail: "/CourseCardDemo.jpg",
          previewVideoUrl: "/courseVideoDemoPoster.png",
          isFeatured: false,
          isCertified: true,
          totalRatings: 4.6,
          enrolledCount: 11200,
          totalLectures: 95,
          language: "English",
          skillLevel: "Intermediate",
          duration: "36 hours",
          lastUpdated: new Date("2024-01-16"),
          modules: [
            {
              id: "m8",
              title: "React Native Basics",
              duration: "10 hours",
              lessons: [
                {
                  id: "l8",
                  title: "Setting up React Native",
                  duration: "40min",
                  completed: true,
                  isForCollegeStudent: true
                }
              ]
            }
          ],
          whatYouWillLearn: [
            "React Native development",
            "Native device features",
            "App store deployment",
            "Performance optimization"
          ],
          whoShouldJoin: "Web developers looking to build mobile apps",
          prerequisites: ["React knowledge", "JavaScript proficiency"],
          instructor: [
            {
              id: "i8",
              name: "Maria Garcia",
              profileImage: "/courseDefaultTestimonial.png",
              experience: "7 years of Experience",
              rating: 4.7,
              totalStudents: 19000,
              totalCourses: 8,
              bio: "Mobile development specialist and React Native expert",
              currentPosition: "Senior Mobile Developer at Uber",
              linkedinUrl: "https://linkedin.com/in/maria-garcia"
            }
          ],
          plan: {
            professionals: {
              price: 299,
              features: ["Full course access", "Certificate", "App store guidance"]
            },
            collegeStudents: {
              price: 199,
              features: ["Full course access", "Certificate"]
            }
          },
          featuredReviews: [
            {
              id: "r8",
              studentName: "Kevin Brown",
              rating: 5,
              comment: "Great course for learning mobile development!",
              date: new Date("2024-01-14"),
              verified: true
            }
          ],
          features: ["Mobile projects", "App store submission", "Cross-platform development"],
          faqs: [
            {
              id: "f8",
              question: "Can I publish apps after this course?",
              answer: "Yes, we cover the complete app development and publishing process.",
              order: 1
            }
          ],
          isActive: true,
          createdAt: new Date("2023-12-05"),
          updatedAt: new Date("2024-01-16"),
          createdBy: "admin",
          tags: ["react-native", "mobile-development", "cross-platform"],
          discount: 20,
          discountEndDate: new Date("2024-02-29"),
          slug: "mobile-app-development-react-native",
          scholarship: true,
          scholarshipDescription: "Get 50% off your course with our scholarship program.",
        }
      ]);
      setIsFetching(false);
    }, 3000);
  }, []);

  return (
    <CourseFilterContext.Provider
      value={{
        isFetching,
        setIsFetching,
        courses,
        setCourses,
        search,
        setSearch,
        filters,
        setFilters,
        selectedFilter,
        setSelectedFilter,
        handleFilterClick,
      }}
    >
      {children}
    </CourseFilterContext.Provider>
  );
};

export const useCourseFilter = () => {
  const context = useContext(CourseFilterContext);
  if (!context) {
    throw new Error(
      "useCourseFilter must be used within a CourseFilterProvider"
    );
  }
  return context;
};

export default CourseFilterProvider;
