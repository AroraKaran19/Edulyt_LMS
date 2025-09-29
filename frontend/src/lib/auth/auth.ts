import NextAuth, { AuthOptions, DefaultSession, DefaultUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import CredentialsProvider from "next-auth/providers/credentials";
import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";

// Extend the built-in session and user types
declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string;
    user: {
      id: string;
      username?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    token?: string;
    username?: string;
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    username?: string;
    refreshToken?: string;
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

          return {  
            id: response.data.data.user._id,
            email: response.data.data.user.email,
            name: response.data.data.user.firstName && response.data.data.user.lastName 
              ? `${response.data.data.user.firstName} ${response.data.data.user.lastName}` 
              : response.data.data.user.email,
            username: response.data.data.user.username,
            refreshToken: response.data.data.refreshToken,
            accessToken: response.data.data.accessToken,
          };
        } catch (error) {
          if (error instanceof AxiosError) {
            console.log(error.response?.data);
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
          console.log(user);
          console.log(profile);
          console.log(account);
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

          if (response.status === 200 || response.status === 201) {
            // Check if response.data and response.data.user exist before accessing properties
            if (result.data && result.data.user && result.data.user._id) {
              user.id = result.data.user._id;
              user.accessToken = result.data.accessToken;
              user.refreshToken = result.data.refreshToken;
              user.username = result.data.user.username;
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
          session.accessToken = token.accessToken as string;
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
