import NextAuth, { AuthOptions, DefaultSession, DefaultUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import CredentialsProvider from "next-auth/providers/credentials";
import axios, { AxiosError } from "axios";

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

          console.error(response.data.error);

          if (response.status !== 200) {
            throw new Error(response.data.message || "Login failed");
          }

          return {
            id: response.data.user._id,
            email: response.data.user.email,
            name: response.data.user.fullName || response.data.user.email,
            username: response.data.user.username,
            refreshToken: response.data.refreshToken,
            accessToken: response.data.accessToken,
          };
        } catch (error) {
          if (error instanceof AxiosError) {
            console.error(error.response?.data?.message);
            throw new Error(error.response?.data?.message || "Login failed");
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
            role: "user", // Default role for OAuth users
            ...(profile &&
              account?.provider === "google" && {
                profilePicture: user.image || (profile as any)?.picture,
              }),
          };

          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/oauth-signin`,
            oauthData
          );

          if (response.status === 200 || response.status === 201) {
            user.id = response.data.user._id;
            user.accessToken = response.data.accessToken;
            user.refreshToken = response.data.refreshToken;
            user.username = response.data.user.username;
            return true;
          } else {
            console.error("Failed to create user in backend:", response.data);
            return false;
          }
        }

        // For credentials provider, return true (already handled)
        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
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
