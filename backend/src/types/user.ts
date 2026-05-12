import { Affiliate, Course, Review, PaymentOrder, Enrollment } from ".";

export type SuccessPointEarnSource =
  | "purchased"
  | "coupon_paid_over_half_effective";

export type SuccessPointCourseSnapshot = {
  title: string;
  slug?: string;
};

export type SuccessPointTransaction =
  | {
      transactionId: string;
      earnedAt: Date;
      type: "earned";
      points: number;
      courseId: string;
      enrollmentId?: string;
      earnSource: SuccessPointEarnSource;
      /** Snapshot saved at award time so the entry remains readable if the course is deleted. */
      courseSnapshot?: SuccessPointCourseSnapshot;
    }
  | {
      transactionId: string;
      earnedAt: Date;
      type: "transferred_in";
      points: number;
      fromUserId: string;
      fromUserDisplayName?: string;
      peerTransactionId?: string;
    }
  | {
      transactionId: string;
      earnedAt: Date;
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
 * + a `partnerCollege` ObjectId reference to an existing PartnerCollege
 * document. Doesn't carry `address`, `whatsappNumber`, or `dob` — those
 * base fields are left unset for partners. When the linked PartnerCollege
 * is deleted, the partner is auto-deactivated (status → "inactive") by
 * the cascade in partnerCollege.services.ts.
 */
export interface Partner extends User {
  partnerCollege: string;
}

export interface Instructor extends User {
  slug?: string;
  industry?: string;
  /** Public URLs of company / workplace images (e.g. logos) */
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
  reviews: Review["_id"][];
  ownedCourses: Course["_id"][];
}

export interface Student extends User {
  enrollments: Enrollment["_id"][];

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

  accounts: SocialProfiles;

  // Joining info
  joinSource?: "direct" | "affiliate" | "promotion";
  affiliation?: {
    isAffiliate: boolean; // if user has been referred by an affiliate
    affiliate: Affiliate;
  };

  // Orders
  orders: PaymentOrder["_id"][];

  // Pending payments
  pendingPayments: PaymentOrder["_id"][];

  successPoints?: number;
  successPointsHistory?: SuccessPointTransaction[];
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
  userType:
    | "student"
    | "instructor"
    | "collaborator"
    | "partner"
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
