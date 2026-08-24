import apiClient from "@/configs/apiConfig";
import { authOptions } from "@/configs/authOption";
import { ACCOUNT_DISABLED_MESSAGE } from "@/constants/authMessages";
import { User } from "@/types";
import NextAuth from "next-auth";

// Access token lifetime — must match the backend's ACCESS_TOKEN_TTL.
const ACCESS_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Exchanges the opaque refresh token for a fresh access token + rotated refresh
 * token. On failure, flags the token so the session callback can surface the
 * error and the client can sign out cleanly (instead of white-screening).
 */
async function refreshAccessToken(token: any) {
  try {
    const response = await apiClient.post("/auth/refresh-token", {
      refreshToken: token.refreshToken,
    });

    const refreshedTokens = response.data.data;

    return {
      ...token,
      /*
       * Refresh re-reads the user, so a field that changed since sign-in (being
       * made a campus ambassador, say) reaches the session without a re-login.
       * Spread before the token fields below so it can never overwrite them.
       */
      ...(refreshedTokens.user ?? {}),
      accessToken: refreshedTokens.accessToken,
      // Rotation: store the new refresh token; fall back to the old one if the
      // backend didn't rotate for some reason.
      refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
      accessTokenExpires: Date.now() + ACCESS_TOKEN_TTL_MS,
      error: undefined,
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
              const { user: userData, accessToken, refreshToken } =
                response.data.data;
              return {
                ...token,
                ...userData,
                accessToken,
                refreshToken,
                accessTokenExpires: Date.now() + ACCESS_TOKEN_TTL_MS,
              };
            }
          } catch (error: any) {
            const message =
              error?.response?.data?.error?.message ||
              error?.message ||
              "OAuth sign-in failed";
            console.error("OAuth signin error:", message);
            if (message === ACCOUNT_DISABLED_MESSAGE) {
              throw new Error(ACCOUNT_DISABLED_MESSAGE);
            }
            throw new Error(message);
          }
        }

        // Handle credentials sign in
        if (account.provider === "credentials" && (user as any).accessToken) {
          return {
            ...token,
            ...user,
            accessToken: (user as any).accessToken,
            refreshToken: (user as any).refreshToken,
            accessTokenExpires: Date.now() + ACCESS_TOKEN_TTL_MS,
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
      // Never return null here — that corrupts the client session and renders a
      // blank page.
      const { refreshToken: _refreshToken, ...safeToken } = token as Record<
        string,
        unknown
      >;

      session.user = safeToken as unknown as Partial<User>;
      session.accessToken = token.accessToken as string;
      session.error = token.error as string | undefined;
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
  events: {
    async signOut({ token }) {
      const refreshToken = (token as { refreshToken?: string })?.refreshToken;
      if (!refreshToken) return;
      try {
        await apiClient.post("/auth/logout", { refreshToken });
      } catch (error) {
        console.error("Failed to revoke refresh token on logout:", error);
      }
    },
  },
});

export { handler as GET, handler as POST };
