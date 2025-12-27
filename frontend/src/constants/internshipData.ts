import {
  Briefcase,
  Users,
  BookOpen,
  Award,
  Code,
  Target,
  Zap,
  TrendingUp,
  Clock,
  Network,
  Hand,
  GraduationCap,
  CheckCircle2,
  BadgeCheck,
  Globe,
  UserCog,
  FolderKanban,
  Home,
  Building2,
  Laptop,
  FileCheck,
  LucideIcon,
} from "lucide-react";

export interface InternshipFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface InternshipPerk {
  icon: LucideIcon;
  title: string;
  description: string;
  highlighted?: boolean;
}

export interface WhyJoinItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const internshipFeatures: InternshipFeature[] = [
  {
    icon: Briefcase,
    title: "Real Industry Projects",
    description:
      "Work on actual company-style projects to build real skills and practical experience. You'll work on real scenarios, learn actual workflows, and build a strong portfolio that boosts your confidence and sets you apart from other students.",
  },
  {
    icon: Users,
    title: "Expert Mentor Support",
    description:
      "Learn directly from experienced trainers and industry professionals through guided sessions. Get expert feedback on your work, learn best practices, and receive career advice from experienced mentors who are invested in your success.",
  },
  {
    icon: BookOpen,
    title: "Flexible Learning Modes",
    description:
      "Choose online, offline, or a hybrid format that fits your schedule. Study at your own pace, attend live sessions, and access recorded content whenever you need. Perfect for students balancing academics, work, or other commitments.",
  },
  {
    icon: Award,
    title: "Portfolio Development",
    description:
      "Build a project-based portfolio that strengthens your profile for future opportunities. Create real work samples and projects that help you stand out.",
  },
  {
    icon: Code,
    title: "Hands-On Coding Practice",
    description:
      "Get extensive coding practice with real-world scenarios and problem-solving challenges. You'll work on real scenarios, learn actual workflows, and build a strong portfolio that boosts your confidence and sets you apart from other students.",
  },
  {
    icon: Target,
    title: "Career Goal Alignment",
    description:
      "Align your internship experience with your career goals through personalized guidance. Get expert feedback on your work, learn best practices, and receive career advice from experienced mentors who are invested in your success.",
  },
  {
    icon: Zap,
    title: "Fast-Track Learning",
    description:
      "Accelerate your learning curve with intensive, focused training sessions and workshops. You'll work on real scenarios, learn actual workflows, and build a strong portfolio that boosts your confidence and sets you apart from other students.",
  },
  {
    icon: TrendingUp,
    title: "Skill Enhancement",
    description:
      "Enhance your technical and soft skills through comprehensive training programs. You'll work on real scenarios, learn actual workflows, and build a strong portfolio that boosts your confidence and sets you apart from other students.",
  },
  {
    icon: Clock,
    title: "Flexible Timings",
    description:
      "Learn at your own pace with flexible scheduling that accommodates your commitments. You'll work on real scenarios, learn actual workflows, and build a strong portfolio that boosts your confidence and sets you apart from other students.",
  },
  {
    icon: Network,
    title: "Industry Networking",
    description:
      "Connect with industry professionals and build a strong professional network. You'll work on real scenarios, learn actual workflows, and build a strong portfolio that boosts your confidence and sets you apart from other students.",
  },
];

export const internshipPerks: InternshipPerk[] = [
  {
    icon: Hand,
    title: "Hands-On Learning",
    description:
      "Work on real tasks, practical assignments, and industry-level projects.",
  },
  {
    icon: GraduationCap,
    title: "Training By Mentor",
    description:
      "Learn directly from professionals who guide you step-by-step.",
    highlighted: true,
  },
  {
    icon: BadgeCheck,
    title: "Certification",
    description:
      "Receive a verified internship certificate to boost your resume.",
  },
  {
    icon: Globe,
    title: "Flexible Learning",
    description:
      "Choose online, offline, or hybrid learn at your own convenience.",
  },
  {
    icon: FolderKanban,
    title: "Portfolio & Project Building",
    description:
      "Create real work samples and projects that help you stand out.",
  },
  {
    icon: UserCog,
    title: "Career Support",
    description:
      "Gain access to resume reviews, interview prep, and job guidance.",
  },
];

export const whyJoinItems: WhyJoinItem[] = [
  {
    icon: Home,
    title: "Real-World Projects",
    description:
      "This internship gives you real hands-on experience through industry-level projects and practical assignments. You'll work on real scenarios, learn actual workflows, and build a strong portfolio that boosts your confidence and sets you apart from other students.",
  },
  {
    icon: Building2,
    title: "Expert Mentor Support",
    description:
      "Geared towards businesses and offices, commercial cleaning services focus on maintaining a clean and hygienic work environment, ensuring a professional and healthy workspace for employees and clients.",
  },
  {
    icon: Laptop,
    title: "Flexible Learning Modes",
    description:
      "Deep cleaning goes beyond regular cleaning routines, tackling hard-to-reach or neglected areas. It involves detailed and thorough cleaning of every nook and cranny, from baseboards to appliances, to eliminate deep-seated dirt and grime.",
  },
  {
    icon: FileCheck,
    title: "Verified Certification",
    description:
      "This category includes niche cleaning services tailored to specific needs, such as carpet cleaning to remove stains and odors, window cleaning for sparkling glass surfaces, and post-construction cleaning to eliminate debris and dust after construction or renovation projects.",
  },
  {
    icon: Target,
    title: "Portfolio Development",
    description:
      "These eco-friendly cleaning services use environmentally conscious products and practices to reduce the impact on the environment. They prioritize the use of non-toxic, biodegradable, and sustainable cleaning solutions.",
  }
];

export const internshipDetails = {
  applicationLastDate: "2025-12-17",
  examDate: "2025-12-17",
  internshipStartDate: "2025-12-17",
  whatsappLink: "https://www.whatsapp.com/channel/0029VaIBXP347XeJjHqbNi1X",
  certificate: "Yes",
  mode: "Online/Offline",
  language: "2025-12-17",
  phoneNumber: "+91-8929252575",
};

export const socialLinks = [
  {
    label: "WhatsApp",
    href: "https://www.whatsapp.com/channel/0029VaIBXP347XeJjHqbNi1X",
    color: "text-green-500 hover:text-green-600",
  },
  {
    label: "Telegram",
    href: "https://t.me/+_XxzFosKYOg2M2I9",
    color: "text-blue-500 hover:text-blue-600",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/edulyt_india/",
    color: "text-pink-500 hover:text-pink-600",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/edulytindia/",
    color: "text-blue-600 hover:text-blue-700",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/people/Edulyt-India/100066801796718/",
    color: "text-blue-700 hover:text-blue-800",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@EdulytIndia",
    color: "text-red-500 hover:text-red-600",
  },
];

export const technologyRequirements = [
  "Laptop Or Desktop Computer",
  "Stable Internet Connection",
  "Updated Web Browser",
  "Basic Productivity Tools",
  "Functional Webcam & Microphone",
  "Open To School Students, College Students, And Beginners",
];

export interface MentorProfile {
  name: string;
  specialization: string;
  profileImage: string;
  linkedinUrl?: string;
  curriculumDescription: string;
  rating: number;
}

export const mentorProfiles: MentorProfile[] = [
  {
    name: "Archit Narang",
    specialization: "Artificial Intelligence & Machine Learning",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    linkedinUrl: "https://www.linkedin.com/in/archit-narang",
    curriculumDescription:
      "The curriculum, designed by the faculty of Texas McCombs, Great Learning, and leading industry practitioners,",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    specialization: "Full Stack Development",
    profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
    linkedinUrl: "https://www.linkedin.com/in/priya-sharma",
    curriculumDescription:
      "The curriculum, designed by the faculty of Texas McCombs, Great Learning, and leading industry practitioners,",
    rating: 5,
  },
  {
    name: "Rahul Kumar",
    specialization: "Data Science & Analytics",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    linkedinUrl: "https://www.linkedin.com/in/rahul-kumar",
    curriculumDescription:
      "The curriculum, designed by the faculty of Texas McCombs, Great Learning, and leading industry practitioners,",
    rating: 5,
  },
  {
    name: "Sneha Patel",
    specialization: "Cloud Computing & DevOps",
    profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80",
    linkedinUrl: "https://www.linkedin.com/in/sneha-patel",
    curriculumDescription:
      "The curriculum, designed by the faculty of Texas McCombs, Great Learning, and leading industry practitioners,",
    rating: 5,
  },
  {
    name: "Amit Singh",
    specialization: "Cybersecurity",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    linkedinUrl: "https://www.linkedin.com/in/amit-singh",
    curriculumDescription:
      "The curriculum, designed by the faculty of Texas McCombs, Great Learning, and leading industry practitioners,",
    rating: 5,
  },
];

export interface Statistic {
  value: string;
  label: string;
}

export const learnerStatistics: Statistic[] = [
  {
    value: "50%",
    label: "Average salary hike",
  },
  {
    value: "1000+",
    label: "Hiring Companies",
  },
  {
    value: "3/4",
    label: "Learner in this role",
  },
  {
    value: "1800+",
    label: "Shift to leader",
  },
];

export interface LearnerTestimonial {
  name: string;
  course: string;
  role: string;
  company: string;
  profileImage: string;
  testimonial: string;
}

export const learnerTestimonials: LearnerTestimonial[] = [
  {
    name: "Archit Narang",
    course: "Artificial Intelligence & Machine Learning",
    role: "Data Scientist",
    company: "Private limited LLM",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    testimonial:
      "The curriculum is exceptionally well-structured and guided by experienced mentors. Every module is practical, engaging, and aligned with real industry problems. This program helped me build confidence, improve my technical skills, and understand how AI and Machine Learning are applied in real-world situations.",
  },
  {
    name: "Archit Narang",
    course: "Artificial Intelligence & Machine Learning",
    role: "Data Scientist",
    company: "Private limited LLM",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    testimonial:
      "This program delivers far more than theoretical learning. Every concept is backed by hands-on tasks and real projects, making the journey meaningful and productive. The mentors provide continuous support, ensuring a strong foundation in AI and Machine Learning for career growth.",
  },
  {
    name: "Archit Narang",
    course: "Artificial Intelligence & Machine Learning",
    role: "Data Scientist",
    company: "Private limited LLM",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    testimonial:
      "The program offers a perfect blend of structured learning and real-time application. The assignments and projects mirror actual industry scenarios, helping me develop job-ready skills. I gained clarity, confidence, and strong practical knowledge that genuinely accelerated my journey in AI and Machine Learning.",
  },
  {
    name: "Priya Sharma",
    course: "Full Stack Development",
    role: "Senior Software Engineer",
    company: "Tech Solutions Inc",
    profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
    testimonial:
      "The hands-on approach and real-world projects made all the difference. I transitioned from a beginner to a confident developer, landing my dream job at a top tech company. The mentorship and support throughout the program were exceptional.",
  },
  {
    name: "Rahul Kumar",
    course: "Data Science & Analytics",
    role: "Data Analyst",
    company: "Analytics Pro",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    testimonial:
      "This program transformed my career completely. The practical assignments and industry-relevant curriculum helped me gain the skills needed to excel in data science. The mentors were always available to guide and support my learning journey.",
  },
  {
    name: "Sneha Patel",
    course: "Cloud Computing & DevOps",
    role: "DevOps Engineer",
    company: "CloudTech Solutions",
    profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80",
    testimonial:
      "The comprehensive curriculum and expert guidance helped me master cloud technologies and DevOps practices. I'm now working on exciting projects and have significantly grown in my career. Highly recommend this program!",
  },
  {
    name: "Amit Singh",
    course: "Cybersecurity",
    role: "Security Analyst",
    company: "SecureNet Systems",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    testimonial:
      "The program's focus on practical security scenarios and real-world challenges prepared me perfectly for my role. The mentors' expertise and the hands-on projects were instrumental in my career transformation.",
  },
];

export interface CourseCategory {
  name: string;
  count: string;
  isActive?: boolean;
}

export const courseCategories: CourseCategory[] = [
  {
    name: "Data Science",
    count: "100+",
    isActive: true,
  },
  {
    name: "UI/UX Design",
    count: "50+",
  },
  {
    name: "Full Stack development",
    count: "75+",
  },
  {
    name: "Machine learning",
    count: "60+",
  },
  {
    name: "Artificial Intelligence",
    count: "80+",
  },
];

export interface Course {
  id: string;
  title: string;
  thumbnail: string;
  discount: number;
  isBestSeller: boolean;
  enrolledStudents: number;
  rating: number;
  reviewCount: number;
  instructors: Array<{
    name: string;
    image: string;
  }>;
  originalPrice: number;
  currentPrice: number;
}

export const courses: Course[] = [
  {
    id: "1",
    title: "Data Science: Zero to Hundred",
    thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&q=80",
    discount: 50,
    isBestSeller: true,
    enrolledStudents: 35000,
    rating: 4.5,
    reviewCount: 6000,
    instructors: [
      { name: "John Doe", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" },
      { name: "John Doe", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" },
      { name: "John Doe", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" },
      { name: "John Doe", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" },
    ],
    originalPrice: 1000,
    currentPrice: 500,
  },
  {
    id: "2",
    title: "Data Science: Zero to Hundred",
    thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&q=80",
    discount: 50,
    isBestSeller: true,
    enrolledStudents: 35000,
    rating: 4.5,
    reviewCount: 6000,
    instructors: [
      { name: "John Doe", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" },
      { name: "John Doe", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" },
    ],
    originalPrice: 1000,
    currentPrice: 500,
  },
  {
    id: "3",
    title: "Data Science: Zero to Hundred",
    thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&q=80",
    discount: 50,
    isBestSeller: true,
    enrolledStudents: 35000,
    rating: 4.5,
    reviewCount: 6000,
    instructors: [
      { name: "John Doe", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" },
      { name: "John Doe", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" },
    ],
    originalPrice: 1000,
    currentPrice: 500,
  },
  {
    id: "4",
    title: "Data Science: Zero to Hundred",
    thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&q=80",
    discount: 50,
    isBestSeller: true,
    enrolledStudents: 35000,
    rating: 4.5,
    reviewCount: 6000,
    instructors: [
      { name: "John Doe", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" },
      { name: "John Doe", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" },
    ],
    originalPrice: 1000,
    currentPrice: 500,
  },
];

export interface StudentProfile {
  name: string;
  initial: string;
  color: string;
}

export interface College {
  id: string;
  name: string;
  logo: string;
  studentCount: number;
  students: StudentProfile[];
}

export const colleges: College[] = [
  {
    id: "1",
    name: "National College of Engineering",
    logo: "https://images.unsplash.com/photo-1562774053-701939374585?w=200&q=80",
    studentCount: 90,
    students: [
      { name: "Arjun K", initial: "A", color: "bg-green-700" },
      { name: "Pari S", initial: "P", color: "bg-[#F77124]" },
      { name: "Kishan", initial: "K", color: "bg-purple-600" },
      { name: "Rahul M", initial: "R", color: "bg-blue-600" },
      { name: "Sneha P", initial: "S", color: "bg-pink-600" },
    ],
  },
  {
    id: "2",
    name: "National College of Engineering",
    logo: "https://images.unsplash.com/photo-1562774053-701939374585?w=200&q=80",
    studentCount: 90,
    students: [
      { name: "Arjun K", initial: "A", color: "bg-green-700" },
      { name: "Pari S", initial: "P", color: "bg-[#F77124]" },
      { name: "Kishan", initial: "K", color: "bg-purple-600" },
      { name: "Rahul M", initial: "R", color: "bg-blue-600" },
      { name: "Sneha P", initial: "S", color: "bg-pink-600" },
    ],
  },
  {
    id: "3",
    name: "National College of Engineering",
    logo: "https://images.unsplash.com/photo-1562774053-701939374585?w=200&q=80",
    studentCount: 90,
    students: [
      { name: "Arjun K", initial: "A", color: "bg-green-700" },
      { name: "Pari S", initial: "P", color: "bg-[#F77124]" },
      { name: "Kishan", initial: "K", color: "bg-purple-600" },
      { name: "Rahul M", initial: "R", color: "bg-blue-600" },
      { name: "Sneha P", initial: "S", color: "bg-pink-600" },
    ],
  },
  {
    id: "4",
    name: "National College of Engineering",
    logo: "https://images.unsplash.com/photo-1562774053-701939374585?w=200&q=80",
    studentCount: 90,
    students: [
      { name: "Arjun K", initial: "A", color: "bg-green-700" },
      { name: "Pari S", initial: "P", color: "bg-[#F77124]" },
      { name: "Kishan", initial: "K", color: "bg-purple-600" },
      { name: "Rahul M", initial: "R", color: "bg-blue-600" },
      { name: "Sneha P", initial: "S", color: "bg-pink-600" },
    ],
  },
  {
    id: "5",
    name: "National College of Engineering",
    logo: "https://images.unsplash.com/photo-1562774053-701939374585?w=200&q=80",
    studentCount: 90,
    students: [
      { name: "Arjun K", initial: "A", color: "bg-green-700" },
      { name: "Pari S", initial: "P", color: "bg-[#F77124]" },
      { name: "Kishan", initial: "K", color: "bg-purple-600" },
      { name: "Rahul M", initial: "R", color: "bg-blue-600" },
      { name: "Sneha P", initial: "S", color: "bg-pink-600" },
    ],
  },
  {
    id: "6",
    name: "National College of Engineering",
    logo: "https://images.unsplash.com/photo-1562774053-701939374585?w=200&q=80",
    studentCount: 90,
    students: [
      { name: "Arjun K", initial: "A", color: "bg-green-700" },
      { name: "Pari S", initial: "P", color: "bg-[#F77124]" },
      { name: "Kishan", initial: "K", color: "bg-purple-600" },
      { name: "Rahul M", initial: "R", color: "bg-blue-600" },
      { name: "Sneha P", initial: "S", color: "bg-pink-600" },
    ],
  },
];

export interface Manager {
  id: string;
  name: string;
  title: string;
  description: string;
  profileImage: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
}

export const managers: Manager[] = [
  {
    id: "1",
    name: "John Doe",
    title: "Senior Project Manager",
    description:
      "Specializes in leading high-impact projects, team coordination, and delivering industry-ready training.",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
    socialLinks: {
      facebook: "#",
      twitter: "#",
      github: "#",
      linkedin: "#",
    },
  },
  {
    id: "2",
    name: "John Doe",
    title: "Senior Project Manager",
    description:
      "Specializes in leading high-impact projects, team coordination, and delivering industry-ready training.",
    profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80",
    socialLinks: {
      facebook: "#",
      twitter: "#",
      github: "#",
      linkedin: "#",
    },
  },
  {
    id: "3",
    name: "John Doe",
    title: "Senior Project Manager",
    description:
      "Specializes in leading high-impact projects, team coordination, and delivering industry-ready training.",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80",
    socialLinks: {
      facebook: "#",
      twitter: "#",
      github: "#",
      linkedin: "#",
    },
  },
  {
    id: "4",
    name: "John Doe",
    title: "Senior Project Manager",
    description:
      "Specializes in leading high-impact projects, team coordination, and delivering industry-ready training.",
    profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&q=80",
    socialLinks: {
      facebook: "#",
      twitter: "#",
      github: "#",
      linkedin: "#",
    },
  },
  {
    id: "5",
    name: "John Doe",
    title: "Senior Project Manager",
    description:
      "Specializes in leading high-impact projects, team coordination, and delivering industry-ready training.",
    profileImage: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&q=80",
    socialLinks: {
      facebook: "#",
      twitter: "#",
      github: "#",
      linkedin: "#",
    },
  },
  {
    id: "6",
    name: "John Doe",
    title: "Senior Project Manager",
    description:
      "Specializes in leading high-impact projects, team coordination, and delivering industry-ready training.",
    profileImage: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=300&q=80",
    socialLinks: {
      facebook: "#",
      twitter: "#",
      github: "#",
      linkedin: "#",
    },
  },
];

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export const faqItems: FAQItem[] = [
  {
    id: "1",
    question: "The curriculum, designed by the faculty of Texas McCombs,",
    answer:
      "The curriculum is designed by experienced faculty members from Texas McCombs and industry experts to provide comprehensive learning experience.",
  },
  {
    id: "2",
    question: "The curriculum, designed by the faculty of Texas McCombs,",
    answer:
      "The curriculum is designed by experienced faculty members from Texas McCombs and industry experts to provide comprehensive learning experience.",
  },
  {
    id: "3",
    question: "The curriculum, designed by the faculty of Texas McCombs,",
    answer:
      "The curriculum is designed by experienced faculty members from Texas McCombs and industry experts to provide comprehensive learning experience.",
  },
  {
    id: "4",
    question: "The curriculum, designed by the faculty of Texas McCombs,",
    answer:
      "The curriculum is designed by experienced faculty members from Texas McCombs and industry experts to provide comprehensive learning experience.",
  },
  {
    id: "5",
    question: "The curriculum, designed by the faculty of Texas McCombs,",
    answer:
      "The curriculum is designed by experienced faculty members from Texas McCombs and industry experts to provide comprehensive learning experience.",
  },
];

export interface InternshipJourneyStep {
  id: number;
  title: string;
  description: string;
  icon: string; // Icon name or component identifier
  position: "left" | "right";
}

export const internshipJourneySteps: InternshipJourneyStep[] = [
  {
    id: 1,
    title: "Apply",
    description:
      "Fill out the application form and submit your basic details to begin your internship journey.",
    icon: "apply",
    position: "right",
  },
  {
    id: 2,
    title: "Entrance Test",
    description:
      "Complete a short test designed to check your basic knowledge and enthusiasm for the role.",
    icon: "test",
    position: "left",
  },
  {
    id: 3,
    title: "Test Result",
    description:
      "Once evaluated, you'll receive your test result along with feedback on your performance.",
    icon: "result",
    position: "right",
  },
  {
    id: 4,
    title: "Offer Letter",
    description:
      "If you pass, you'll be issued an official internship offer letter with all details and next steps.",
    icon: "offer",
    position: "left",
  },
  {
    id: 5,
    title: "Joining",
    description:
      "Begin your internship, attend sessions, complete weekly assignments, and work on real projects under mentor guidance.",
    icon: "joining",
    position: "right",
  },
  {
    id: 6,
    title: "Certificate",
    description:
      "After successfully completing all tasks and final evaluation, you will receive your verified internship certificate.",
    icon: "certificate",
    position: "left",
  },
];