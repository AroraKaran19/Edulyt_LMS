"use client";
import { useEffect, useState, useRef, useCallback, useMemo, createContext, useContext } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useEnrollment from "@/hooks/useEnrollment";
import { Course } from "@/types";
import { Lock, AlertCircle, Loader2 } from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { Button } from "@/components/ui/buttons/button";
import { PartialAccessControl } from "@/types/enrollment";
import { getCategoryNames } from "@/lib/courseFormUtils";

interface EnrollmentGuardProps {
  course: Course;
  children: React.ReactNode;
}

export interface EnrollmentContextValue {
  enrollment: any;
  accessControl: PartialAccessControl | null | undefined;
  refreshEnrollment?: () => Promise<void>;
}

const EnrollmentContext = createContext<EnrollmentContextValue | null>(null);

export const useEnrollmentContext = () => {
  const context = useContext(EnrollmentContext);
  return context;
};

const EnrollmentGuard = ({ course, children }: EnrollmentGuardProps) => {
  const { status } = useSession();
  const router = useRouter();
  const { checkEnrollment } = useEnrollment();

  const [enrollmentStatus, setEnrollmentStatus] = useState<{
    isEnrolled: boolean;
    enrollment?: any;
    status?: string;
    canAccess: boolean;
    accessControl?: PartialAccessControl | null;
  } | null>(null);
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(true);

  // Track previous values to prevent unnecessary re-runs
  const prevStatusRef = useRef<string | null>(null);
  const prevCourseIdRef = useRef<string | undefined>(undefined);
  const isInitialMountRef = useRef(true);
  const isCheckingRef = useRef(false);
  
  // Store checkEnrollment in ref to prevent dependency issues
  const checkEnrollmentRef = useRef(checkEnrollment);
  useEffect(() => {
    checkEnrollmentRef.current = checkEnrollment;
  }, [checkEnrollment]);

  // Function to check enrollment status - memoized
  const checkUserEnrollment = useCallback(async () => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      setIsCheckingEnrollment(false);
      isCheckingRef.current = false;
      return;
    }

    if (!course._id) {
      setIsCheckingEnrollment(false);
      isCheckingRef.current = false;
      return;
    }

    // Prevent duplicate concurrent calls
    if (isCheckingRef.current) {
      return;
    }

    try {
      isCheckingRef.current = true;
      setIsCheckingEnrollment(true);
      const result = await checkEnrollmentRef.current({ courseId: course._id });
      if (result) {
        setEnrollmentStatus(result);
      }
    } catch (error) {
      console.error("Failed to check enrollment:", error);
    } finally {
      setIsCheckingEnrollment(false);
      isCheckingRef.current = false;
    }
  }, [status, course._id]);

  // Check enrollment status only when status or courseId actually changes
  useEffect(() => {
    const statusChanged = prevStatusRef.current !== status;
    const courseIdChanged = prevCourseIdRef.current !== course._id;
    const isInitialMount = isInitialMountRef.current;
    
    // Always check on initial mount if authenticated
    if (isInitialMount && status === "authenticated") {
      isInitialMountRef.current = false;
      prevStatusRef.current = status;
      prevCourseIdRef.current = course._id;
      checkUserEnrollment();
      return;
    }
    
    // Check if status changed to authenticated, or courseId changed while authenticated
    if ((statusChanged && status === "authenticated") || 
        (courseIdChanged && status === "authenticated")) {
      prevStatusRef.current = status;
      prevCourseIdRef.current = course._id;
      checkUserEnrollment();
    } else if (statusChanged) {
      prevStatusRef.current = status;
      if (status === "unauthenticated") {
        setIsCheckingEnrollment(false);
        isCheckingRef.current = false;
      }
    }
    
    // Update courseId ref even if we don't check enrollment
    if (courseIdChanged) {
      prevCourseIdRef.current = course._id;
    }
  }, [status, course._id, checkUserEnrollment]);

  // Memoize context value to prevent unnecessary re-renders
  // MUST be called before any conditional returns to follow Rules of Hooks
  const contextValue = useMemo(
    () => ({
      enrollment: enrollmentStatus?.enrollment,
      accessControl: enrollmentStatus?.accessControl || null,
      refreshEnrollment: checkUserEnrollment,
    }),
    [
      enrollmentStatus?.enrollment,
      enrollmentStatus?.accessControl,
      checkUserEnrollment,
    ]
  );

  if (status === "loading" || (isCheckingEnrollment && !enrollmentStatus)) {
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
  if (["dropped", "revoked"].includes(enrollmentStatus.status ?? "")) {
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
    <EnrollmentContext.Provider value={contextValue}>
      {children}
    </EnrollmentContext.Provider>
  );
};

export default EnrollmentGuard;
