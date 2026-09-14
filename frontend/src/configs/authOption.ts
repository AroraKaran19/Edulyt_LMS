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
        /** Partner page sends `"partner"` to route to `/auth/partner/login`; otherwise `/auth/login`. */
        portal: { label: "Portal", type: "text" },
      },
      authorize: async (credentials, req) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        try {
          const portal =
            typeof credentials.portal === "string"
              ? credentials.portal.trim()
              : "";
          const path =
            portal === "partner" ? "/auth/partner/login" : "/auth/login";
          // This call is made server-side, so the backend would otherwise see
          // *this server* as the client ("axios", "::1"). Forward the real
          // browser user-agent / IP from the incoming request so the account's
          // Active Sessions list shows the actual device.
          const headerValue = (v?: string | string[]) =>
            Array.isArray(v) ? v[0] : v;
          const browserUserAgent = headerValue(req?.headers?.["user-agent"]);
          const forwardedFor = headerValue(
            req?.headers?.["x-forwarded-for"] ?? req?.headers?.["x-real-ip"]
          );
          const response = await apiClient.post(
            path,
            {
              email: credentials.email,
              password: credentials.password,
            },
            {
              headers: {
                ...(browserUserAgent
                  ? { "x-client-user-agent": browserUserAgent }
                  : {}),
                ...(forwardedFor ? { "x-forwarded-for": forwardedFor } : {}),
              },
            }
          );
          return {
            ...response.data?.data?.user,
            accessToken: response.data?.data?.accessToken,
            refreshToken: response.data?.data?.refreshToken,
          };
        } catch (error: unknown) {
          const message =
            (error as any)?.response?.data?.error?.message ||
            (error as Error)?.message ||
            "Login failed";
          // Throw so NextAuth forwards the message as result.error on the client
          throw new Error(message);
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    LinkedInProvider({
      clientId: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
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
      async profile(profile) {
        return {
          id: profile.sub,
          name: profile.name || `${profile.given_name} ${profile.family_name}`,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],
};
