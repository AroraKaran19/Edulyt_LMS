import React from "react";
import { Button } from "@/components/ui/buttons/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-gray-500 text-6xl mb-4">📚</div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Course Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          The course you're looking for doesn't exist or has been removed.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/admin/courses/manage-courses">
            <Button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
              View All Courses
            </Button>
          </Link>
          <Link href="/admin/courses/manage-courses/create">
            <Button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
              Create New Course
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
