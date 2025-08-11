"use client";

import React from "react";
import { Button } from "@/components/ui/buttons/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-red-500 text-xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Something went wrong!
        </h2>
        <p className="text-gray-600 mb-4">
          {error.message || "Failed to load course data"}
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            onClick={reset}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Try again
          </Button>
          <Button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
