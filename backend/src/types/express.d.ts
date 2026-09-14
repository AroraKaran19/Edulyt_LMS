import { User } from "./user";
import type { Brand } from "../constants/brands";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      /** Refresh-token family (session id) carried in the current access token. */
      currentFamily?: string;
      /** Which platform this request came from. Set by `resolveBrand`. */
      brand?: Brand;
      /**
       * Set by `requireScholarshipSession` on public campaign routes. Distinct
       * from `user`: that flow has no account, only a verified email.
       */
      enquirySession?: {
        id: string;
        email: string;
        phoneVerified: boolean;
      };
      /** Email and phone proved by `requireVerifiedLeadContact`. */
      verifiedContact?: {
        email: string;
        phone: string;
        userId?: string;
      };
      scholarshipSession?: {
        id: string;
        testId: string;
        email: string;
        phoneVerified: boolean;
        /** The proved number; empty until `phoneVerified` is true. */
        phone: string;
      };
    }
  }
}
