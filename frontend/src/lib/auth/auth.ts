import NextAuth, { AuthOptions, DefaultSession, DefaultUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import CredentialsProvider from "next-auth/providers/credentials";
import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";

// Extend the built-in session and user types
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      username?: string;
      isFirstTime?: boolean;
      role?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    username?: string;
    isFirstTime?: boolean;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string;
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

          const loginData = {
            email: credentials.email,
            password: credentials.password,
          };

          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`,
            loginData,
            { withCredentials: true }
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
            isFirstTime: isFirstTime,
            role: user.role || user.userType || "student",
          };
        } catch (error) {
          if (error instanceof AxiosError) {
            const errorMessage = error.response?.data?.error?.message || 
                               error.response?.data?.message || 
                               "Login failed";
            toast.error(errorMessage);
            throw new Error(errorMessage);
          }
          toast.error("Login failed");
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
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/oauth-signin`,
            oauthData,
            { withCredentials: true }
          );
          const result = response.data;

          if (response.status === 200 || response.status === 201) {
            if (result.data && result.data.user && result.data.user._id) {
              user.id = result.data.user._id;
              user.username = result.data.user.username;
              user.role = result.data.user.role || result.data.user.userType || "student";
              
              // Check if this is a new user (first time login)
              if (result.message === "User registered successfully") {
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
        const message = error?.response?.data?.error?.message || 
                       error?.response?.data?.message || 
                       error?.message;
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
    async jwt({ token, user }) {
      // Initial sign in - store user data in token
      if (user) {
        token.username = user.username;
        token.isFirstTime = user.isFirstTime;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Pass user data from token to session
      if (token && session.user) {
        session.user.id = token.sub || "";
        session.user.username = token.username as string;
        (session.user as any).isFirstTime = token.isFirstTime;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXT_PUBLIC_AUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(
  authOptions as AuthOptions
);