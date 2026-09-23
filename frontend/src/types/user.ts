import { Affiliate, Course, Review, PaymentOrder, Enrollment } from ".";
import type { Brand } from "@/constants/brands";

export type SuccessPointEarnSource =
  | "purchased"
  | "coupon_paid_over_half_effective";

export type SuccessPointTransaction =
  | {
      id: string;
      date: Date;
      type: "earned";
      points: number;
      courseId: string;
      enrollmentId?: string;
      earnSource: SuccessPointEarnSource;
    }
  | {
      id: string;
      date: Date;
      type: "transferred_in";
      points: number;
      fromUserId: string;
      fromUserDisplayName?: string;
      peerTransactionId?: string;
    }
  | {
      id: string;
      date: Date;
      type: "transferred_out";
      points: number;
      toUserId: string;
      toUserDisplayName?: string;
      peerTransactionId?: string;
    };

export interface Collaborator extends User {
  totalReferrals: number;
  totalEarnings: number;
}

/**
 * Partner user (college-side partner portal). Has only base-user identity
 * + a `partnerCollege` ObjectId pointing to an existing PartnerCollege
 * record. Auto-deactivated when the linked PartnerCollege is deleted.
 * `address`, `whatsappNumber`, and `dob` are intentionally unused.
 */
export interface Partner extends User {
  partnerCollege: string;
}

export interface Instructor extends User {
  slug?: string;
  industry?: string;
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
  /** Canonical link to a College document (preferred). Falls back to
   *  `collegeName` snapshot for legacy rows or deleted colleges. */
  college?: string;
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
  /** Free-text LinkedIn profile URL the learner sets in profile settings. */
  linkedinUrl?: string;

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

  successPoints: number;
  successPointsHistory: SuccessPointTransaction[];
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
  /** Platforms this person has joined. Absent on accounts that predate the split. */
  brands?: Brand[];

  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  email: string;
  phone?: string;
  /** Set when `phone` was proven by an MSG91 OTP. Written only by /me/phone/verify. */
  phoneVerifiedAt?: string;
  whatsappNumber?: string;
  password: string;
  userType:
    | "student"
    | "instructor"
    | "collaborator"
    | "partner"
    | "marketer"
    | "sales"
    | "admin"
    | "super-admin";
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

  /**
   * Set for a campus ambassador whose link is live. Sent in the auth payload so
   * the dashboard can show their tab without an extra request.
   */
  crmAmbassadorKind?: "marketing" | "social-media";

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
