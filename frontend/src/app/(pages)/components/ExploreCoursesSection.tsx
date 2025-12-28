"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import CourseSearchBar from "../courses/components/CourseSearchBar";
import FilterContainer from "../courses/components/FilterContainer";
import CourseCard from "../courses/components/CourseCard";
import { Course, Instructor } from "@/types";
import { Filter } from "@/types";

// Mock courses data
const mockCourses: Course[] = [
  {
    _id: "1",
    title: "Data Science: Zero to Hundred",
    description: "Comprehensive data science course covering all fundamentals",
    shortDescription: "Learn data science from scratch",
    category: [],
    thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&q=80",
    whatYouWillLearn: "Data analysis, machine learning, statistics",
    skills: ["Python", "SQL", "Machine Learning"],
    highlights: [],
    careerPaths: ["Data Scientist", "Data Analyst"],
    skillLevel: "Beginner",
    whoShouldJoin: "Anyone interested in data science",
    duration: "3 months",
    instructor: [
      {
        _id: "instructor-1",
        firstName: "John",
        lastName: "Doe",
        profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
        email: "john.doe@example.com",
        password: "",
        userType: "instructor",
        provider: "credentials",
        status: "active",
        accounts: {},
        permissions: [],
        refreshTokens: [],
        rating: 4.8,
        totalStudents: 5000,
        reviews: [],
        ownedCourses: [],
      },
      {
        _id: "instructor-2",
        firstName: "Jane",
        lastName: "Smith",
        profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
        email: "jane.smith@example.com",
        password: "",
        userType: "instructor",
        provider: "credentials",
        status: "active",
        accounts: {},
        permissions: [],
        refreshTokens: [],
        rating: 4.7,
        totalStudents: 3500,
        reviews: [],
        ownedCourses: [],
      },
      {
        _id: "instructor-3",
        firstName: "Mike",
        lastName: "Johnson",
        profilePicture: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
        email: "mike.johnson@example.com",
        password: "",
        userType: "instructor",
        provider: "credentials",
        status: "active",
        accounts: {},
        permissions: [],
        refreshTokens: [],
        rating: 4.9,
        totalStudents: 6000,
        reviews: [],
        ownedCourses: [],
      },
    ] as Instructor[],
    plans: {
      essential: {
        title: "Essential Plan",
        type: "essential",
        price: 500,
        discount: {
          discount: "percentage",
          value: 50,
          isActive: true,
        },
        features: [],
      },
    },
    discount: {
      discount: "percentage",
      value: 50,
      startTime: "00:00",
      endTime: "23:59",
      isActive: true,
    },
    reviews: [],
    testimonials: [],
    faqs: [],
    isActive: true,
    createdBy: null,
    audience: "college-students",
    slug: "data-science-zero-to-hundred",
    language: "English",
    isFeatured: true,
    analytics: {
      totalRatings: 4.5,
      totalReviews: 6000,
      totalEnrollments: 35000,
      activeEnrollments: 25000,
      completionRate: 75,
      averageRating: 4.5,
      averageCompletionTime: 90,
      dropoffPoints: [],
    },
  },
  {
    _id: "2",
    title: "Full Stack Web Development",
    description: "Master full stack development with modern technologies",
    shortDescription: "Build complete web applications",
    category: [],
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80",
    whatYouWillLearn: "React, Node.js, MongoDB, Express",
    skills: ["JavaScript", "React", "Node.js"],
    highlights: [],
    careerPaths: ["Full Stack Developer", "Web Developer"],
    skillLevel: "Intermediate",
    whoShouldJoin: "Developers looking to expand their skills",
    duration: "4 months",
    instructor: [
      {
        _id: "instructor-4",
        firstName: "Sarah",
        lastName: "Williams",
        profilePicture: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
        email: "sarah.williams@example.com",
        password: "",
        userType: "instructor",
        provider: "credentials",
        status: "active",
        accounts: {},
        permissions: [],
        refreshTokens: [],
        rating: 4.6,
        totalStudents: 4200,
        reviews: [],
        ownedCourses: [],
      },
      {
        _id: "instructor-5",
        firstName: "David",
        lastName: "Brown",
        profilePicture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
        email: "david.brown@example.com",
        password: "",
        userType: "instructor",
        provider: "credentials",
        status: "active",
        accounts: {},
        permissions: [],
        refreshTokens: [],
        rating: 4.8,
        totalStudents: 5500,
        reviews: [],
        ownedCourses: [],
      },
    ] as Instructor[],
    plans: {
      essential: {
        title: "Essential Plan",
        type: "essential",
        price: 600,
        discount: {
          discount: "percentage",
          value: 40,
          isActive: true,
        },
        features: [],
      },
    },
    discount: {
      discount: "percentage",
      value: 40,
      startTime: "00:00",
      endTime: "23:59",
      isActive: true,
    },
    reviews: [],
    testimonials: [],
    faqs: [],
    isActive: true,
    createdBy: null,
    audience: "college-students",
    slug: "full-stack-web-development",
    language: "English",
    isFeatured: true,
    analytics: {
      totalRatings: 4.7,
      totalReviews: 8000,
      totalEnrollments: 42000,
      activeEnrollments: 30000,
      completionRate: 80,
      averageRating: 4.7,
      averageCompletionTime: 120,
      dropoffPoints: [],
    },
  },
  {
    _id: "3",
    title: "Machine Learning & AI",
    description: "Advanced machine learning and artificial intelligence course",
    shortDescription: "Deep dive into ML and AI",
    category: [],
    thumbnail: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&q=80",
    whatYouWillLearn: "Neural networks, deep learning, AI algorithms",
    skills: ["Python", "TensorFlow", "PyTorch"],
    highlights: [],
    careerPaths: ["ML Engineer", "AI Researcher"],
    skillLevel: "Advanced",
    whoShouldJoin: "Experienced developers and data scientists",
    duration: "6 months",
    instructor: [
      {
        _id: "instructor-6",
        firstName: "Emily",
        lastName: "Davis",
        profilePicture: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80",
        email: "emily.davis@example.com",
        password: "",
        userType: "instructor",
        provider: "credentials",
        status: "active",
        accounts: {},
        permissions: [],
        refreshTokens: [],
        rating: 4.9,
        totalStudents: 7000,
        reviews: [],
        ownedCourses: [],
      },
      {
        _id: "instructor-7",
        firstName: "Robert",
        lastName: "Miller",
        profilePicture: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80",
        email: "robert.miller@example.com",
        password: "",
        userType: "instructor",
        provider: "credentials",
        status: "active",
        accounts: {},
        permissions: [],
        refreshTokens: [],
        rating: 4.7,
        totalStudents: 4800,
        reviews: [],
        ownedCourses: [],
      },
      {
        _id: "instructor-8",
        firstName: "Lisa",
        lastName: "Anderson",
        profilePicture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80",
        email: "lisa.anderson@example.com",
        password: "",
        userType: "instructor",
        provider: "credentials",
        status: "active",
        accounts: {},
        permissions: [],
        refreshTokens: [],
        rating: 4.8,
        totalStudents: 5200,
        reviews: [],
        ownedCourses: [],
      },
    ] as Instructor[],
    plans: {
      essential: {
        title: "Essential Plan",
        type: "essential",
        price: 800,
        discount: {
          discount: "percentage",
          value: 30,
          isActive: true,
        },
        features: [],
      },
    },
    discount: {
      discount: "percentage",
      value: 30,
      startTime: "00:00",
      endTime: "23:59",
      isActive: true,
    },
    reviews: [],
    testimonials: [],
    faqs: [],
    isActive: true,
    createdBy: null,
    audience: "professionals",
    slug: "machine-learning-ai",
    language: "English",
    isFeatured: false,
    analytics: {
      totalRatings: 4.8,
      totalReviews: 5000,
      totalEnrollments: 20000,
      activeEnrollments: 15000,
      completionRate: 70,
      averageRating: 4.8,
      averageCompletionTime: 180,
      dropoffPoints: [],
    },
  },
  {
    _id: "4",
    title: "UI/UX Design Masterclass",
    description: "Complete UI/UX design course for modern applications",
    shortDescription: "Design beautiful user interfaces",
    category: [],
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&q=80",
    whatYouWillLearn: "Design principles, Figma, user research",
    skills: ["Figma", "Adobe XD", "Prototyping"],
    highlights: [],
    careerPaths: ["UI/UX Designer", "Product Designer"],
    skillLevel: "Beginner",
    whoShouldJoin: "Aspiring designers and developers",
    duration: "3 months",
    instructor: [
      {
        _id: "instructor-9",
        firstName: "Alex",
        lastName: "Martinez",
        profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
        email: "alex.martinez@example.com",
        password: "",
        userType: "instructor",
        provider: "credentials",
        status: "active",
        accounts: {},
        permissions: [],
        refreshTokens: [],
        rating: 4.5,
        totalStudents: 3000,
        reviews: [],
        ownedCourses: [],
      },
      {
        _id: "instructor-10",
        firstName: "Maria",
        lastName: "Garcia",
        profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
        email: "maria.garcia@example.com",
        password: "",
        userType: "instructor",
        provider: "credentials",
        status: "active",
        accounts: {},
        permissions: [],
        refreshTokens: [],
        rating: 4.6,
        totalStudents: 3800,
        reviews: [],
        ownedCourses: [],
      },
    ] as Instructor[],
    plans: {
      essential: {
        title: "Essential Plan",
        type: "essential",
        price: 450,
        discount: {
          discount: "percentage",
          value: 25,
          isActive: true,
        },
        features: [],
      },
    },
    discount: {
      discount: "percentage",
      value: 25,
      startTime: "00:00",
      endTime: "23:59",
      isActive: true,
    },
    reviews: [],
    testimonials: [],
    faqs: [],
    isActive: true,
    createdBy: null,
    audience: "college-students",
    slug: "ui-ux-design-masterclass",
    language: "English",
    isFeatured: false,
    analytics: {
      totalRatings: 4.6,
      totalReviews: 4500,
      totalEnrollments: 28000,
      activeEnrollments: 20000,
      completionRate: 78,
      averageRating: 4.6,
      averageCompletionTime: 90,
      dropoffPoints: [],
    },
  },
  {
    _id: "5",
    title: "Cloud Computing & DevOps",
    description: "Master cloud platforms and DevOps practices",
    shortDescription: "Learn cloud and DevOps",
    category: [],
    thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80",
    whatYouWillLearn: "AWS, Docker, Kubernetes, CI/CD",
    skills: ["AWS", "Docker", "Kubernetes"],
    highlights: [],
    careerPaths: ["DevOps Engineer", "Cloud Architect"],
    skillLevel: "Intermediate",
    whoShouldJoin: "Developers and system administrators",
    duration: "4 months",
    instructor: [
      {
        _id: "instructor-11",
        firstName: "James",
        lastName: "Wilson",
        profilePicture: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
        email: "james.wilson@example.com",
        password: "",
        userType: "instructor",
        provider: "credentials",
        status: "active",
        accounts: {},
        permissions: [],
        refreshTokens: [],
        rating: 4.7,
        totalStudents: 4500,
        reviews: [],
        ownedCourses: [],
      },
      {
        _id: "instructor-12",
        firstName: "Rachel",
        lastName: "Garcia",
        profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
        email: "rachel.garcia@example.com",
        password: "",
        userType: "instructor",
        provider: "credentials",
        status: "active",
        accounts: {},
        permissions: [],
        refreshTokens: [],
        rating: 4.8,
        totalStudents: 5000,
        reviews: [],
        ownedCourses: [],
      },
      {
        _id: "instructor-13",
        firstName: "Chris",
        lastName: "Taylor",
        profilePicture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
        email: "chris.taylor@example.com",
        password: "",
        userType: "instructor",
        provider: "credentials",
        status: "active",
        accounts: {},
        permissions: [],
        refreshTokens: [],
        rating: 4.6,
        totalStudents: 4000,
        reviews: [],
        ownedCourses: [],
      },
    ] as Instructor[],
    plans: {
      essential: {
        title: "Essential Plan",
        type: "essential",
        price: 700,
        discount: {
          discount: "percentage",
          value: 35,
          isActive: true,
        },
        features: [],
      },
    },
    discount: {
      discount: "percentage",
      value: 35,
      startTime: "00:00",
      endTime: "23:59",
      isActive: true,
    },
    reviews: [],
    testimonials: [],
    faqs: [],
    isActive: true,
    createdBy: null,
    audience: "professionals",
    slug: "cloud-computing-devops",
    language: "English",
    isFeatured: true,
    analytics: {
      totalRatings: 4.7,
      totalReviews: 5500,
      totalEnrollments: 30000,
      activeEnrollments: 22000,
      completionRate: 72,
      averageRating: 4.7,
      averageCompletionTime: 120,
      dropoffPoints: [],
    },
  },
  {
    _id: "6",
    title: "Cybersecurity Fundamentals",
    description: "Learn essential cybersecurity skills and practices",
    shortDescription: "Protect systems from threats",
    category: [],
    thumbnail: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80",
    whatYouWillLearn: "Network security, ethical hacking, cryptography",
    skills: ["Network Security", "Penetration Testing", "Cryptography"],
    highlights: [],
    careerPaths: ["Security Analyst", "Ethical Hacker"],
    skillLevel: "Beginner",
    whoShouldJoin: "IT professionals and security enthusiasts",
    duration: "5 months",
    instructor: [
      {
        _id: "instructor-14",
        firstName: "Patricia",
        lastName: "Moore",
        profilePicture: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80",
        email: "patricia.moore@example.com",
        password: "",
        userType: "instructor",
        provider: "credentials",
        status: "active",
        accounts: {},
        permissions: [],
        refreshTokens: [],
        rating: 4.5,
        totalStudents: 3200,
        reviews: [],
        ownedCourses: [],
      },
      {
        _id: "instructor-15",
        firstName: "Michael",
        lastName: "Jackson",
        profilePicture: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80",
        email: "michael.jackson@example.com",
        password: "",
        userType: "instructor",
        provider: "credentials",
        status: "active",
        accounts: {},
        permissions: [],
        refreshTokens: [],
        rating: 4.7,
        totalStudents: 4100,
        reviews: [],
        ownedCourses: [],
      },
    ] as Instructor[],
    plans: {
      essential: {
        title: "Essential Plan",
        type: "essential",
        price: 650,
        discount: {
          discount: "percentage",
          value: 20,
          isActive: true,
        },
        features: [],
      },
    },
    discount: {
      discount: "percentage",
      value: 20,
      startTime: "00:00",
      endTime: "23:59",
      isActive: true,
    },
    reviews: [],
    testimonials: [],
    faqs: [],
    isActive: true,
    createdBy: null,
    audience: "professionals",
    slug: "cybersecurity-fundamentals",
    language: "English",
    isFeatured: false,
    analytics: {
      totalRatings: 4.5,
      totalReviews: 3500,
      totalEnrollments: 18000,
      activeEnrollments: 13000,
      completionRate: 68,
      averageRating: 4.5,
      averageCompletionTime: 150,
      dropoffPoints: [],
    },
  },
  {
    _id: "7",
    title: "Mobile App Development",
    description: "Build native and cross-platform mobile applications",
    shortDescription: "Create mobile apps for iOS and Android",
    category: [],
    thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=80",
    whatYouWillLearn: "React Native, Flutter, mobile UI/UX",
    skills: ["React Native", "Flutter", "Swift"],
    highlights: [],
    careerPaths: ["Mobile Developer", "App Developer"],
    skillLevel: "Intermediate",
    whoShouldJoin: "Developers interested in mobile development",
    duration: "4 months",
    instructor: [
      {
        _id: "instructor-16",
        firstName: "Jennifer",
        lastName: "Lee",
        profilePicture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80",
        email: "jennifer.lee@example.com",
        password: "",
        userType: "instructor",
        provider: "credentials",
        status: "active",
        accounts: {},
        permissions: [],
        refreshTokens: [],
        rating: 4.6,
        totalStudents: 3600,
        reviews: [],
        ownedCourses: [],
      },
      {
        _id: "instructor-17",
        firstName: "Daniel",
        lastName: "White",
        profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
        email: "daniel.white@example.com",
        password: "",
        userType: "instructor",
        provider: "credentials",
        status: "active",
        accounts: {},
        permissions: [],
        refreshTokens: [],
        rating: 4.8,
        totalStudents: 4800,
        reviews: [],
        ownedCourses: [],
      },
      {
        _id: "instructor-18",
        firstName: "Amanda",
        lastName: "Harris",
        profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
        email: "amanda.harris@example.com",
        password: "",
        userType: "instructor",
        provider: "credentials",
        status: "active",
        accounts: {},
        permissions: [],
        refreshTokens: [],
        rating: 4.7,
        totalStudents: 4200,
        reviews: [],
        ownedCourses: [],
      },
    ] as Instructor[],
    plans: {
      essential: {
        title: "Essential Plan",
        type: "essential",
        price: 600,
        discount: {
          discount: "percentage",
          value: 30,
          isActive: true,
        },
        features: [],
      },
    },
    discount: {
      discount: "percentage",
      value: 30,
      startTime: "00:00",
      endTime: "23:59",
      isActive: true,
    },
    reviews: [],
    testimonials: [],
    faqs: [],
    isActive: true,
    createdBy: null,
    audience: "college-students",
    slug: "mobile-app-development",
    language: "English",
    isFeatured: true,
    analytics: {
      totalRatings: 4.6,
      totalReviews: 7000,
      totalEnrollments: 38000,
      activeEnrollments: 28000,
      completionRate: 76,
      averageRating: 4.6,
      averageCompletionTime: 120,
      dropoffPoints: [],
    },
  },
  {
    _id: "8",
    title: "Blockchain Development",
    description: "Learn blockchain technology and smart contract development",
    shortDescription: "Master blockchain and cryptocurrencies",
    category: [],
    thumbnail: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&q=80",
    whatYouWillLearn: "Solidity, Ethereum, smart contracts, DeFi",
    skills: ["Solidity", "Ethereum", "Smart Contracts"],
    highlights: [],
    careerPaths: ["Blockchain Developer", "Smart Contract Developer"],
    skillLevel: "Advanced",
    whoShouldJoin: "Experienced developers",
    duration: "5 months",
    instructor: [
      {
        _id: "instructor-19",
        firstName: "Kevin",
        lastName: "Martin",
        profilePicture: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
        email: "kevin.martin@example.com",
        password: "",
        userType: "instructor",
        provider: "credentials",
        status: "active",
        accounts: {},
        permissions: [],
        refreshTokens: [],
        rating: 4.4,
        totalStudents: 2800,
        reviews: [],
        ownedCourses: [],
      },
      {
        _id: "instructor-20",
        firstName: "Nicole",
        lastName: "Thompson",
        profilePicture: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80",
        email: "nicole.thompson@example.com",
        password: "",
        userType: "instructor",
        provider: "credentials",
        status: "active",
        accounts: {},
        permissions: [],
        refreshTokens: [],
        rating: 4.5,
        totalStudents: 3100,
        reviews: [],
        ownedCourses: [],
      },
    ] as Instructor[],
    plans: {
      essential: {
        title: "Essential Plan",
        type: "essential",
        price: 900,
        discount: {
          discount: "percentage",
          value: 15,
          isActive: true,
        },
        features: [],
      },
    },
    discount: {
      discount: "percentage",
      value: 15,
      startTime: "00:00",
      endTime: "23:59",
      isActive: true,
    },
    reviews: [],
    testimonials: [],
    faqs: [],
    isActive: true,
    createdBy: null,
    audience: "professionals",
    slug: "blockchain-development",
    language: "English",
    isFeatured: false,
    analytics: {
      totalRatings: 4.4,
      totalReviews: 2500,
      totalEnrollments: 12000,
      activeEnrollments: 9000,
      completionRate: 65,
      averageRating: 4.4,
      averageCompletionTime: 150,
      dropoffPoints: [],
    },
  },
];

// Mock filters
const mockFilters: Filter[] = [
  { label: "All", value: "all" },
  { label: "Data Science", value: "data-science" },
  { label: "Web Development", value: "web-development" },
  { label: "Machine Learning", value: "machine-learning" },
  { label: "UI/UX Design", value: "ui-ux" },
  { label: "Cloud Computing", value: "cloud" },
];

const ExploreCoursesSection = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<Filter[]>([
    { label: "All", value: "all" },
  ]);
  const [filterShown, setFilterShown] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [filters] = useState<Filter[]>(mockFilters);

  // Client-side filtering and searching
  const filteredCourses = useMemo(() => {
    let result = [...mockCourses];

    // Apply search filter
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter(
        (course) =>
          course.title.toLowerCase().includes(searchLower) ||
          course.description.toLowerCase().includes(searchLower) ||
          course.skills.some((skill) =>
            skill.toLowerCase().includes(searchLower)
          )
      );
    }

    // Apply category filter (simplified - just limit to 8 courses for now)
    // In a real scenario, you'd filter by actual category IDs
    if (
      selectedFilter.length > 0 &&
      !selectedFilter.some((f) => f.value === "all")
    ) {
      // For now, just limit results - you can add proper category filtering later
      result = result.slice(0, 8);
    } else {
      result = result.slice(0, 8);
    }

    return result;
  }, [debouncedSearch, selectedFilter]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth === 0 ? true : windowWidth <= 1046;

  const handleFilterClick = useCallback((filter: Filter) => {
    setSelectedFilter((prev) => {
      if (filter.value === "all") {
        return [filter];
      }

      const withoutAll = prev.filter((f) => f.value !== "all");

      const isSelected = withoutAll.some((f) => f.value === filter.value);

      if (isSelected) {
        const newFilters = withoutAll.filter((f) => f.value !== filter.value);
        return newFilters.length === 0
          ? [{ label: "All", value: "all" }]
          : newFilters;
      } else {
        return [...withoutAll, filter];
      }
    });
  }, []);

  const handleSearchChange = useCallback((newSearch: string) => {
    setSearch(newSearch);
  }, []);

  const handleDebouncedSearch = useCallback((debouncedValue: string) => {
    setDebouncedSearch(debouncedValue);
  }, []);

  const renderContent = () => {
    if (filteredCourses.length === 0) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-8 sm:py-12 px-4">
          <p className="text-xl sm:text-2xl font-bold text-text-primary font-coolvetica mb-2">
            No courses found
          </p>
          <p className="text-base sm:text-lg text-text-primary/70 text-center wrap-break-words overflow-wrap-anywhere max-w-full">
            {debouncedSearch ? (
              <>
                No results found for &quot;
                <span className="font-medium break-all inline-block max-w-full">
                  {debouncedSearch.length > 50
                    ? `${debouncedSearch.substring(0, 50)}...`
                    : debouncedSearch}
                </span>
                &quot;
              </>
            ) : (
              "No courses match the selected filters"
            )}
          </p>
          <p className="text-xs sm:text-sm text-text-primary/50 text-center mt-2">
            Try adjusting your search terms or filters
          </p>
        </div>
      );
    }

    return (
      <div className="w-full h-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 auto-rows-fr">
          {filteredCourses.map((course: Course, index: number) => (
            <CourseCard
              key={`${course._id || course.slug}-${index}`}
              course={course}
              className="opacity-0 animate-course-card-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-12 mt-12 sm:mt-16 lg:mt-24 bg-[#fffbf8] py-8 sm:py-12">
      {/* Title Section */}
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 font-coolvetica">
          <span className="text-gray-900 font-extrabold">Explore more</span>{" "}
          <span className="text-[#F77124] font-extrabold">Courses</span>
        </h2>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-6xl mx-auto mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <CourseSearchBar
            search={search}
            onSearchChange={handleSearchChange}
            onDebouncedSearch={handleDebouncedSearch}
            debounceDelay={500}
            className="flex-1"
          />
          <div
            className="courses-filter w-full sm:w-auto md:max-w-[190px] shrink-0 flex gap-2 items-center justify-center border border-black/10 rounded-lg sm:rounded-xl p-2 sm:p-2 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.2)] px-4 sm:px-8 relative cursor-pointer"
            onClick={() => setFilterShown(!filterShown)}
          >
            <span className="text-sm sm:text-[16px] font-bold text-text-primary select-none">
              Filter{" "}
              {selectedFilter?.some((f) => f.value === "all")
                ? ""
                : selectedFilter?.length
                ? `(${selectedFilter.length})`
                : ""}
            </span>
            <ChevronDown
              className={cn(
                "size-3 sm:size-4 text-text-primary transition-transform duration-300 ease-in-out",
                filterShown ? "rotate-180" : ""
              )}
            />
          </div>
        </div>

        {filterShown && (
          <FilterContainer
            filters={filters}
            selectedFilter={selectedFilter}
            isMobile={isMobile}
            handleFilterClick={handleFilterClick}
          />
        )}
      </div>

      {/* Course Cards Grid */}
      <div className="max-w-7xl mx-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default ExploreCoursesSection;
