"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useEnrollment from "@/hooks/useEnrollment";
import { Course } from "@/types";
import { Lock, AlertCircle, Loader2 } from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { Button } from "@/components/ui/buttons/button";
import { toast } from "react-toastify";
import { createContext, useContext } from "react";
import { PartialAccessControl } from "@/types/enrollment";
import { getCategoryNames } from "@/lib/courseFormUtils";

interface EnrollmentGuardProps {
  course: Course;
  children: React.ReactNode;
}

export interface EnrollmentContextValue {
  enrollment: any;
  accessControl: PartialAccessControl | null | undefined;
}

const EnrollmentContext = createContext<EnrollmentContextValue | null>(null);

export const useEnrollmentContext = () => {
  const context = useContext(EnrollmentContext);
  return context;
};

const EnrollmentGuard = ({ course, children }: EnrollmentGuardProps) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { checkEnrollment, createEnrollment, isLoading } = useEnrollment();

  const [enrollmentStatus, setEnrollmentStatus] = useState<{
    isEnrolled: boolean;
    enrollment?: any;
    status?: string;
    canAccess: boolean;
    accessControl?: PartialAccessControl | null;
  } | null>(null);
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(true);

  // Check enrollment status
  useEffect(() => {
    const checkUserEnrollment = async () => {
      if (status === "loading") return;

      if (status === "unauthenticated") {
        setIsCheckingEnrollment(false);
        return;
      }

      if (!course._id) {
        setIsCheckingEnrollment(false);
        return;
      }

      try {
        const result = await checkEnrollment({ courseId: course._id });
        if (result) {
          setEnrollmentStatus(result);
        }
      } catch (error) {
        console.error("Failed to check enrollment:", error);
      } finally {
        setIsCheckingEnrollment(false);
      }
    };

    checkUserEnrollment();
  }, [session, status, course._id, checkEnrollment]);

  // Loading state
  if (status === "loading" || isCheckingEnrollment) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="size-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Checking enrollment status...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (status === "unauthenticated") {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Lock className="size-16 text-orange-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to access this course content.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => router.push("/auth/login")}
            >
              Sign In
            </Button>
            <OrangeButton onClick={() => router.push("/auth/register")}>
              Sign Up
            </OrangeButton>
          </div>
        </div>
      </div>
    );
  }

  // Not enrolled
  if (!enrollmentStatus?.isEnrolled || !enrollmentStatus?.canAccess) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto p-8">
          <Lock className="size-16 text-orange-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Course Access Required
          </h2>
          <p className="text-gray-600 mb-6">
            You need to enroll in this course to access the content.
          </p>

          {/* Course Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">{course.title}</h3>
            <p
              className="text-sm text-gray-600 mb-2"
              dangerouslySetInnerHTML={{
                __html: course.description.substring(0, 150),
              }}
            />
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{course.duration || "Self-paced"}</span>
              <span>
                {getCategoryNames(course.category).join(", ") || "General"}
              </span>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => router.push(`/courses/${course.slug}`)}
            >
              View Course Details
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Paused enrollment
  if (enrollmentStatus.status === "paused") {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertCircle className="size-16 text-yellow-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Enrollment Paused
          </h2>
          <p className="text-gray-600 mb-6">
            Your enrollment in this course has been paused. Contact support to
            resume access.
          </p>
          <Button variant="outline" onClick={() => router.push("/support")}>
            Contact Support
          </Button>
        </div>
      </div>
    );
  }

  // Dropped enrollment
  if (enrollmentStatus.status === "dropped") {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertCircle className="size-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Enrollment Cancelled
          </h2>
          <p className="text-gray-600 mb-6">
            Your enrollment in this course has been cancelled. You can re-enroll
            if needed.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => router.push(`/courses/${course.slug}`)}
            >
              View Course Details
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // User has access - render the course content with enrollment context
  return (
    <EnrollmentContext.Provider
      value={{
        enrollment: enrollmentStatus?.enrollment,
        accessControl: enrollmentStatus?.accessControl || null,
      }}
    >
      {children}
    </EnrollmentContext.Provider>
  );
};

export default EnrollmentGuard;
