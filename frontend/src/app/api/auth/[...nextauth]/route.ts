import apiClient from "@/configs/apiConfig";
import { authOptions } from "@/configs/authOption";
import { User } from "@/types";
import NextAuth from "next-auth";

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token: any) {
  try {
    const response = await apiClient.post(
      "/auth/refresh-token",
      {
        accessToken: token.accessToken,
      },
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
        },
      }
    );

    const refreshedTokens = response.data.data;

    return {
      ...token,
      accessToken: refreshedTokens.accessToken,
      accessTokenExpires: Date.now() + 60 * 60 * 1000, // 1 hour from now
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

const handler = NextAuth({
  ...authOptions,
  callbacks: {
    async jwt({ token, user, account, profile, trigger, session }) {
      // Handle session update
      if (trigger === "update" && session) {
        // Update the token with new session data
        return { ...token, ...session };
      }

      // Initial sign in
      if (user && account) {
        // Handle OAuth sign in
        if (account.provider === "google" || account.provider === "linkedin") {
          try {
            const response = await apiClient.post("/auth/oauth-signin", {
              email: user.email,
              fullName: user.name,
              provider: account.provider,
              providerDetails: {
                ...user,
                ...account,
                ...profile,
              },
            });

            if (response.status === 200) {
              const { user: userData, accessToken } = response.data.data;
              return {
                ...token,
                ...userData,
                accessToken,
                accessTokenExpires: Date.now() + 60 * 60 * 1000, // 1 hour from now
              };
            }
          } catch (error) {
            console.error("OAuth signin error:", error);
          }
        }

        // Handle credentials sign in
        if (account.provider === "credentials" && (user as any).accessToken) {
          return {
            ...token,
            ...user,
            accessToken: (user as any).accessToken,
            accessTokenExpires: Date.now() + 60 * 60 * 1000, // 1 hour from now
          };
        }
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to refresh it
      const refreshedToken = await refreshAccessToken(token);

      // If refresh failed, return token with error
      if (refreshedToken.error) {
        console.error(
          "Token refresh failed, user will need to re-authenticate"
        );
        return {
          ...token,
          error: "RefreshAccessTokenError",
        };
      }

      return refreshedToken;
    },
    async session({ session, token }) {
      // If token refresh failed, return null session to force re-authentication
      if (token.error === "RefreshAccessTokenError") {
        return null as any;
      }

      session.user = token as unknown as Partial<User>;
      session.accessToken = token.accessToken as string;
      session.error = token.error as string;
      return session;
    },
    async signIn({ account }) {
      if (account?.provider === "google" || account?.provider === "linkedin") {
        return true;
      }
      if (account?.provider === "credentials") {
        return true; // Allow credentials login
      }
      throw new Error(
        "Only Google, LinkedIn OAuth and credentials are supported"
      );
    },
  },
});

export { handler as GET, handler as POST };
