import NextAuth from "next-auth";
import { User } from "./user";

declare module "next-auth" {
  interface Session {
    user: Partial<User>;
    accessToken?: string;
    error?: string;
  }

  interface JWT {
    user: Partial<User>;
    accessToken?: string;
    // Opaque refresh token — kept in the encrypted JWT, never sent to the client.
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
  }
}
