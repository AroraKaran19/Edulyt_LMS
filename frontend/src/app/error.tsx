"use client";

import { useEffect } from "react";

/**
 * Route-level error boundary for the app segment. Catches render errors in
 * pages/components so a thrown error degrades to this fallback instead of a
 * blank white screen.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="max-w-md">
        <h1 className="mb-2 text-xl font-semibold text-gray-900">
          Something went wrong
        </h1>
        <p className="text-sm text-gray-500">
          We hit an unexpected error. Please try again if it keeps happening,
          sign in again.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm text-white transition hover:bg-orange-600"
        >
          Try again
        </button>
        <a
          href="/login"
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm text-gray-800 transition hover:bg-gray-50"
        >
          Go to login
        </a>
      </div>
    </div>
  );
}
