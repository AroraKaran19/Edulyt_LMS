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
      "Work on actual company-style projects to build real skills and practical experience",
  },
  {
    icon: Users,
    title: "Expert Mentor Support",
    description:
      "Learn directly from experienced trainers and industry professionals through guided sessions.",
  },
  {
    icon: BookOpen,
    title: "Flexible Learning Modes",
    description:
      "Choose online, offline, or a hybrid format that fits your schedule.",
  },
  {
    icon: Award,
    title: "Portfolio Development",
    description:
      "Build a project-based portfolio that strengthens your profile for future opportunities.",
  },
  {
    icon: Code,
    title: "Hands-On Coding Practice",
    description:
      "Get extensive coding practice with real-world scenarios and problem-solving challenges.",
  },
  {
    icon: Target,
    title: "Career Goal Alignment",
    description:
      "Align your internship experience with your career goals through personalized guidance.",
  },
  {
    icon: Zap,
    title: "Fast-Track Learning",
    description:
      "Accelerate your learning curve with intensive, focused training sessions and workshops.",
  },
  {
    icon: TrendingUp,
    title: "Skill Enhancement",
    description:
      "Enhance your technical and soft skills through comprehensive training programs.",
  },
  {
    icon: Clock,
    title: "Flexible Timings",
    description:
      "Learn at your own pace with flexible scheduling that accommodates your commitments.",
  },
  {
    icon: Network,
    title: "Industry Networking",
    description:
      "Connect with industry professionals and build a strong professional network.",
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
    icon: CheckCircle2,
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
      "Learn directly from industry professionals who provide personalized guidance and mentorship. Get expert feedback on your work, learn best practices, and receive career advice from experienced mentors who are invested in your success.",
  },
  {
    icon: Laptop,
    title: "Flexible Learning Modes",
    description:
      "Choose the learning mode that works best for you - online, offline, or hybrid. Study at your own pace, attend live sessions, and access recorded content whenever you need. Perfect for students balancing academics, work, or other commitments.",
  },
  {
    icon: FileCheck,
    title: "Verified Certification",
    description:
      "Receive a verified internship certificate upon successful completion that validates your skills and experience. This industry-recognized certification enhances your resume and demonstrates your commitment to professional development.",
  },
  {
    icon: Target,
    title: "Portfolio Development",
    description:
      "Build a comprehensive portfolio showcasing your real-world projects and achievements. Create work samples that demonstrate your skills to potential employers and stand out in job applications and interviews.",
  },
  {
    icon: TrendingUp,
    title: "Career Growth",
    description:
      "Accelerate your career growth with industry exposure, networking opportunities, and skill development. Gain the practical experience and confidence needed to excel in your chosen field and advance your professional journey.",
  },
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
