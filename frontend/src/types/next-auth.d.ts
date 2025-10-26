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
    accessTokenExpires?: number;
    error?: string;
  }
}
