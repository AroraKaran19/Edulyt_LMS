import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";

// Backend API base URL
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BACKEND_URL ||
  "http://localhost:5000/api";

// Custom types to match our backend user schema
interface BackendUser {
  _id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string;
  profileImage?: string;
  role: "student" | "instructor" | "admin" | "superadmin";
  isActive: boolean;
  isEmailVerified: boolean;
  providers?: {
    google?: { id: string; email: string; verified: boolean };
    github?: { id: string; username: string; email: string };
    linkedin?: { id: string; email: string };
  };
  profile?: {
    bio?: string;
    phone?: string;
    address?: any;
    socialLinks?: any;
  };
  preferences?: {
    language: string;
    timezone: string;
    emailNotifications: boolean;
    marketingEmails: boolean;
    theme: "light" | "dark" | "auto";
  };
  enrolledCourses: string[];
  completedCourses: string[];
  certificates: string[];
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  loginCount: number;
}

interface BackendAuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: BackendUser;
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
  error?: string;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      username?: string;
      image?: string;
      role: string;
      isEmailVerified: boolean;
      preferences?: BackendUser["preferences"];
      enrolledCourses: string[];
      completedCourses: string[];
      certificates: string[];
      accessToken: string;
      refreshToken: string;
      backendUser: BackendUser;
    };
    accessToken: string;
    refreshToken: string;
    error?: string;
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
    username?: string;
    role?: string;
    isEmailVerified?: boolean;
    accessToken?: string;
    refreshToken?: string;
    backendUser?: BackendUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    user?: BackendUser;
    error?: string;
  }
}

// Helper function to authenticate with backend
async function authenticateWithBackend(
  email: string,
  password: string
): Promise<BackendUser | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data: BackendAuthResponse = await response.json();

    if (data.success && data.data) {
      return data.data.user;
    }

    return null;
  } catch (error) {
    console.error("Backend authentication error:", error);
    return null;
  }
}

// Helper function for OAuth authentication with backend
async function authenticateOAuthWithBackend(
  provider: string,
  providerData: any
): Promise<{
  user: BackendUser;
  tokens: { accessToken: string; refreshToken: string };
} | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/oauth/callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider,
        providerData,
      }),
    });

    const data: BackendAuthResponse = await response.json();

    if (data.success && data.data) {
      return {
        user: data.data.user,
        tokens: {
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
        },
      };
    }

    return null;
  } catch (error) {
    console.error("Backend OAuth authentication error:", error);
    return null;
  }
}

// Helper function to refresh tokens
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken: token.refreshToken,
      }),
    });

    const data: BackendAuthResponse = await response.json();

    if (data.success && data.data) {
      return {
        ...token,
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        accessTokenExpires: Date.now() + 15 * 60 * 1000, // 15 minutes
        error: undefined,
      };
    }

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  } catch (error) {
    console.error("Token refresh error:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

// Helper function to get user session from backend
async function getUserSession(
  accessToken: string
): Promise<BackendUser | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/session`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data: BackendAuthResponse = await response.json();

    if (data.success && data.data) {
      return data.data.user;
    }

    return null;
  } catch (error) {
    console.error("Get user session error:", error);
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Credentials provider for email/password authentication
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const user = await authenticateWithBackend(
          credentials.email,
          credentials.password
        );

        if (user) {
          return {
            id: user._id,
            email: user.email,
            name: user.name,
            image: user.profileImage || user.avatar,
            username: user.username,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            backendUser: user,
          };
        }

        return null;
      },
    }),

    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),

    // GitHub OAuth Provider
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    }),

    // LinkedIn OAuth Provider
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID as string,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
      issuer: "https://www.linkedin.com",
      jwks_endpoint: "https://www.linkedin.com/oauth/openid/jwks",
      profile(profile: any) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],

  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/dashboard", // Redirect new users to dashboard
  },

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Handle OAuth sign-in
        if (account?.provider !== "credentials" && account?.provider) {
          const providerData = {
            id: account.providerAccountId,
            email: user.email,
            name: user.name,
            username: (profile as any)?.login || (profile as any)?.username, // GitHub username
            picture: user.image,
          };

          const result = await authenticateOAuthWithBackend(
            account.provider,
            providerData
          );

          if (result) {
            user.backendUser = result.user;
            user.accessToken = result.tokens.accessToken;
            user.refreshToken = result.tokens.refreshToken;
            user.role = result.user.role;
            user.isEmailVerified = result.user.isEmailVerified;
            return true;
          }

          return false;
        }

        // Credentials sign-in is handled in the authorize callback
        return true;
      } catch (error) {
        console.error("Sign-in error:", error);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      // Initial sign-in
      if (account && user) {
        const backendUser = user.backendUser;

        if (backendUser) {
          return {
            accessToken: user.accessToken,
            refreshToken: user.refreshToken,
            accessTokenExpires: Date.now() + 15 * 60 * 1000, // 15 minutes
            user: backendUser,
          };
        }
      }

      // Return previous token if the access token has not expired yet
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Access token has expired, try to update it
      if (token.refreshToken) {
        return refreshAccessToken(token);
      }

      return token;
    },

    async session({ session, token }) {
      if (token.error) {
        session.error = token.error;
        return session;
      }

      if (token.user && token.accessToken && token.refreshToken) {
        // Get fresh user data from backend
        const freshUser = await getUserSession(token.accessToken as string);
        const user = freshUser || token.user;

        session.user = {
          id: user._id,
          email: user.email,
          name: user.name,
          username: user.username,
          image: user.profileImage || user.avatar,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          preferences: user.preferences,
          enrolledCourses: user.enrolledCourses || [],
          completedCourses: user.completedCourses || [],
          certificates: user.certificates || [],
          accessToken: token.accessToken as string,
          refreshToken: token.refreshToken as string,
          backendUser: user,
        };

        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
      }

      return session;
    },
  },

  events: {
    async signOut({ token }) {
      // Logout from backend
      if (token.accessToken && token.refreshToken) {
        try {
          await fetch(`${BACKEND_URL}/auth/logout`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              refreshToken: token.refreshToken,
            }),
          });
        } catch (error) {
          console.error("Backend logout error:", error);
        }
      }
    },
  },

  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET as string,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
