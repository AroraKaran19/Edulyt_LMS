import { Affiliate, Course, Review, PaymentOrder, Enrollment } from ".";

export interface Collaborator extends User {
  totalReferrals: number;
  totalEarnings: number;
}

export interface Instructor extends User {
  slug?: string;
  industry?: string;
  /** Company / workplace image URLs (logos, etc.) */
  companyImages?: string[];
  rating: number;
  totalStudents: number;
  bio?: string;
  field?: string;
  currentPosition?: string;
  currentCompany?: string;
  previousExperience?: {
    companyName: string;
    position: string;
    duration: {
      from: Date;
      to: Date;
    };
    description: string;
  }[];
  linkedinUrl?: string;
  reviews: Review[] | string[];
  ownedCourses: Course[] | string[];
}

export interface Student extends User {
  enrollments: Enrollment[] | string[];
  collegeName?: string;
  degreeName?: string;
  fatherOccupation?: string;
  experienceLevel?: string;
  passingYear?: number;
  areaOfInterest?: string;
  experience?: {
    companyName: string;
    position: string;
    duration: {
      from: Date;
      to: Date;
    };
    description: string;
  }[];

  currentPosition?: string;
  currentCompany?: string;
  domain?: string;

  portfolio?: string;

  accounts: SocialProfiles;

  // Joining info
  joinSource?: "direct" | "affiliate" | "promotion";
  affiliation?: {
    isAffiliate: boolean; // if user has been referred by an affiliate
    affiliate: Affiliate;
  };

  // Orders
  orders: PaymentOrder[] | string[];

  // Pending payments
  pendingPayments: PaymentOrder[] | string[];
}

export interface SocialProfiles {
  google?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
    email_verified?: boolean;
    access_token?: string;
  };
  linkedin?: {
    sub?: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    image?: string;
    locale?: string;
    providerAccountId?: string;
    email?: string;
    email_verified?: boolean;
    id_token?: string;

    accessToken?: string;
  };
  github?: string;
  instagram?: string;
}

export interface User {
  _id?: string;
  status: "active" | "inactive" | "blocked";

  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  email: string;
  phone?: string;
  whatsappNumber?: string;
  password: string;
  userType: "student" | "instructor" | "collaborator" | "admin" | "super-admin";
  provider: "credentials" | "google" | "linkedin";

  address?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };

  accounts: SocialProfiles;

  dob?: Date;

  permissions: string[];

  refreshTokens: {
    token: string;
    deviceInfo?: {
      userAgent?: string;
      ipAddress?: string;
      deviceType?: string;
    };
    createdAt: Date;
    lastUsed: Date;
    isActive: boolean;
  }[];

  createdAt?: Date;
  updatedAt?: Date;
}
