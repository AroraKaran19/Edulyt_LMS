import { getSession } from "next-auth/react";
import type { Session } from "next-auth";

/** NextAuth may not expose the new session to `getSession()` for a few ms right after `signIn`. */
export async function awaitClientSessionAfterSignIn(
  maxAttempts = 6,
  delayMs = 100
): Promise<Session | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const session = await getSession();
    if (session?.user) return session;
    if (i < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return null;
}
