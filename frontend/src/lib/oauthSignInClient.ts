import { signIn } from "next-auth/react";
import type { User } from "@/types/user";
import { awaitClientSessionAfterSignIn } from "@/lib/awaitClientSession";
import {
  buildOAuthHandoffPath,
  getPostLoginRedirectPath,
} from "@/lib/postLoginRedirect";

type OAuthSignInResult =
  | { kind: "redirect_to_provider"; url: string }
  | /** NextAuth v4: OAuth + redirect:false still sets `window.location` to the idp inside `signIn` and the promise often resolves to `undefined` (no toast / no error) */
  { kind: "oauth_redirecting" }
  | { kind: "success"; dest: string }
  | { kind: "error"; message: string };

/**
 * OAuth must use a same-origin `callbackUrl` (see buildOAuthHandoffPath) so that after
 * the provider, NextAuth sends the user to /auth-redirect and role-based routing runs.
 *
 * Note: for OAuth, NextAuth 4 with `redirect: false` still navigates to the idp
 * internally; callers must treat `result === undefined` as "navigating", not an error.
 */
export async function signInWithOAuthProvider(
  provider: string,
  /** e.g. ?callbackUrl= from the login/register page (optional deep link) */
  postAuthOriginalCallback: string | undefined
): Promise<OAuthSignInResult> {
  const result = await signIn(provider, {
    callbackUrl: buildOAuthHandoffPath(postAuthOriginalCallback),
    redirect: false,
  });

  if (result == null) {
    return { kind: "oauth_redirecting" };
  }

  if (result.error) {
    return { kind: "error", message: String(result.error) };
  }

  if (result.url) {
    return { kind: "redirect_to_provider", url: result.url };
  }

  if (result.ok) {
    const session = await awaitClientSessionAfterSignIn();
    if (session?.user) {
      return {
        kind: "success",
        dest: getPostLoginRedirectPath(
          session.user as User,
          postAuthOriginalCallback
        ),
      };
    }
    return { kind: "success", dest: "/dashboard" };
  }

  return { kind: "error", message: "Sign in failed" };
}
