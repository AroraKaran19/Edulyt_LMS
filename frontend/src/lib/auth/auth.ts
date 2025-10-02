import NextAuth, { AuthOptions, DefaultSession, DefaultUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import CredentialsProvider from "next-auth/providers/credentials";
import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";

// Enrollment types
interface Enrollment {
  _id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  status: "active" | "completed" | "dropped" | "paused";
  progress: {
    overallCompletion: number;
    modules: Array<{
      moduleId: string;
      completion: number;
      lessons: Array<{
        lessonId: string;
        completed: boolean;
        completedAt?: string;
        score?: number;
        timeSpent?: number;
        lastAccessedAt?: string;
      }>;
      startedAt?: string;
      completedAt?: string;
    }>;
    lastContentAccessed?: {
      moduleId: string;
      lessonId: string;
      contentId: string;
      contentType: "video" | "quiz" | "document";
      lastPosition?: number;
      timestamp: string;
    };
  };
  lastUpdated: string;
  enrollmentSource?: "direct" | "gift" | "promotion";
  giftFrom?: string;
  promotionCode?: string;
  completedAt?: string;
  certificateIssued?: boolean;
  certificateIssuedAt?: string;
  totalTimeSpent?: number;
  lastActivityAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Extend the built-in session and user types
declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string;
    user: {
      id: string;
      username?: string;
      enrolledCourses?: Enrollment[];
      isFirstTime?: boolean;
      role?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    token?: string;
    username?: string;
    accessToken?: string;
    refreshToken?: string;
    enrolledCourses?: Enrollment[];
    isFirstTime?: boolean;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    username?: string;
    refreshToken?: string;
    enrolledCourses?: Enrollment[];
    isFirstTime?: boolean;
    role?: string;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          if (!credentials?.email || !credentials?.password) {
            toast.error("Email and password are required");
            throw new Error("Email and password are required");
          }

          // Handle registration
          const loginData = {
            email: credentials.email,
            password: credentials.password,
          };

          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`,
            loginData
          );

          if (response.status !== 200) {
            throw new Error(response.data.message || "Login failed");
          }

          const user = response.data.data.user;
          
          // Check if this is a first-time user based on profile completeness
          const isFirstTime = !user.firstName || !user.lastName;
          
          return {  
            id: user._id,
            email: user.email,
            name: user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user.email,
            username: user.username,
            refreshToken: response.data.data.refreshToken,
            accessToken: response.data.data.accessToken,
            enrolledCourses: user.enrolledCourses,
            isFirstTime: isFirstTime,
            role: user.role || user.userType || "student",
          };
        } catch (error) {
          if (error instanceof AxiosError) {
            throw new Error(error.response?.data?.error?.message || "Login failed");
          }
          throw new Error("Login failed");
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!,
    }),
    LinkedInProvider({
      clientId: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_SECRET!,
      authorization: {
        params: { scope: "r_liteprofile r_emailaddress" },
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
    signOut: "/",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Only handle OAuth providers (Google, LinkedIn)
        if (
          account?.provider === "google" ||
          account?.provider === "linkedin"
        ) {
          const oauthData = {
            email: user.email,
            fullName: user.name,
            provider: account.provider,
            userType: "student", // Default userType for OAuth users
            ...(profile &&
              account?.provider === "google" && {
                profilePicture: user.image || (profile as any)?.picture,
              }),
          };

          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/oauth-signin`,
            oauthData
          );
          const result = response.data;
          console.log(result);

          if (response.status === 200 || response.status === 201) {
            // Check if response.data and response.data.user exist before accessing properties
            if (result.data && result.data.user && result.data.user._id) {
              user.id = result.data.user._id;
              user.accessToken = result.data.accessToken;
              user.refreshToken = result.data.refreshToken;
              user.username = result.data.user.username;
              user.enrolledCourses = result.data.user.enrolledCourses;
              user.role = result.data.user.role || result.data.user.userType || "student";
              
              // Check if this is a new user (first time login)
              if (result.message === "User created successfully") {
                user.isFirstTime = true;
              } else {
                user.isFirstTime = false;
              }
              
              return true;
            } else {
              console.error("Invalid response structure from backend:", result.data);
              return false;
            }
          } else {
            console.error("Failed to create user in backend:", result.data);
            return false;
          }
        }

        // For credentials provider, return true (already handled)
        return true;
      } catch (error: any) {
        // If backend reports the email is already used with another provider, block and redirect
        const status = error?.response?.status;
        const message = error?.response?.data?.message || error?.message;
        if (
          status === 401 &&
          typeof message === "string" &&
          message.toLowerCase().includes("different provider")
        ) {
          toast.error(message);
          return "/auth/login?error=EMAIL_IN_USE";
        }
        toast.error(message);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      try {
        // Initial sign in
        if (user && account) {
          token.accessToken = user.accessToken;
          token.username = user.username;
          token.refreshToken = user.refreshToken;
          token.enrolledCourses = user.enrolledCourses;
          token.isFirstTime = user.isFirstTime;
          token.role = user.role;
        }

        // Return previous token if the access token has not expired yet
        if (Date.now() < (token.exp as number) * 1000) {
          return token;
        }

        // Access token has expired, try to refresh it
        if (token.refreshToken) {
          try {
            const response = await axios.post(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh-token`,
              { refreshToken: token.refreshToken }
            );

            if (response.status === 200) {
              token.accessToken = response.data.accessToken;
              token.exp = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            // Clear tokens on refresh failure
            delete token.accessToken;
            delete token.refreshToken;
          }
        }

        return token;
      } catch (error) {
        console.error("JWT callback error:", error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (token && session.user) {
          session.user.id = token.sub || "";
          session.user.username = token.username as string;
          session.user.enrolledCourses = token.enrolledCourses as any[];
          session.accessToken = token.accessToken as string;
          (session.user as any).isFirstTime = token.isFirstTime;
          (session.user as any).role = token.role;
        }
        return session;
      } catch (error) {
        console.error("Session callback error:", error);
        return session;
      }
    },
  },
  secret: process.env.NEXT_PUBLIC_AUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(
  authOptions as AuthOptions
);
