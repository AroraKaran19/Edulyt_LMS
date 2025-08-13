import NextAuth, { AuthOptions, DefaultSession, DefaultUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import CredentialsProvider from "next-auth/providers/credentials";

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
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    username?: string;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        action: { label: "Action", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        confirmPassword: { label: "Confirm Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const { action } = credentials;

          if (action === "register") {
            // Handle registration
            const registerData = {
              email: credentials.email,
              password: credentials.password,
            };

            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/register`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(registerData),
              }
            );

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || "Registration failed");
            }

            return {
              id: data.user._id,
              email: data.user.email,
              name: data.user.fullName,
              username: data.user.username,
              token: data.token,
            };
          } else {
            // Handle login
            const loginData = {
              email: credentials.email,
              password: credentials.password,
            };

            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(loginData),
              }
            );

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || "Login failed");
            }

            return {
              id: data.user._id,
              email: data.user.email,
              name: data.user.fullName,
              username: data.user.username,
              token: data.token,
            };
          }
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: {
        params: { scope: "r_liteprofile r_emailaddress" },
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.token;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub || "";
        session.user.username = token.username;
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(
  authOptions as AuthOptions
);
