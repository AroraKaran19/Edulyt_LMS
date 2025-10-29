import { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import apiClient from "./apiConfig";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    signOut: "/",
    newUser: "/dashboard",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }
          const response = await apiClient.post("/auth/login", {
            email: credentials.email,
            password: credentials.password,
          });

          // Return both user data and access token
          return {
            ...response.data?.data?.user,
            accessToken: response.data?.data?.accessToken,
          };
        } catch (error: any) {
          // Log the error for debugging
          console.error(
            "Auth error:",
            error?.response?.data?.error?.message || error.message
          );

          // Return null to indicate authentication failure
          // NextAuth will handle this and return an error in the signIn result
          return null;
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
        params: {
          scope: "openid profile email",
        },
      },
      token: {
        url: "https://www.linkedin.com/oauth/v2/accessToken",
      },
      userinfo: {
        url: "https://api.linkedin.com/v2/userinfo",
      },
      issuer: "https://www.linkedin.com",
      wellKnown:
        "https://www.linkedin.com/oauth/.well-known/openid-configuration",
      async profile(profile, tokens) {
        return {
          id: profile.sub, // map sub → id
          name: profile.name || `${profile.given_name} ${profile.family_name}`,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],
};
