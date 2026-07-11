"use client";
import { Course } from "@/types";
import ImageComponent from "@/components/ui/ImageComponent";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import Loader from "@/components/ui/Loader";
import { Gift, Check } from "lucide-react";

/**
 * "Your Courses" checkout step. Shows the course being purchased plus every
 * sibling course (same primary category) the learner unlocks for free once the
 * CATEGORY_SIBLING_ENROLLMENT_ENABLED perk is active.
 *
 * The parent (CartForm) owns the fetch and only mounts this step when the perk
 * is on and at least one sibling exists, so `siblings` here is always non-empty
 * once `loading` is false.
 */
const CourseRow = ({
  course,
  badge,
}: {
  course: Course;
  badge: { label: string; className: string; icon: React.ReactNode };
}) => (
  <div className="w-full flex items-center gap-3 rounded-xl border border-gray-200 p-2">
    <div className="relative w-20 h-14 shrink-0">
      <ImageComponent
        src={course.thumbnail || "/CourseCardDemo.jpg"}
        alt={course.title || "Course"}
        width={120}
        height={80}
        className="w-full h-full rounded-lg object-cover"
        draggable={false}
      />
    </div>
    <p className="flex-1 min-w-0 text-sm font-semibold text-text-primary line-clamp-2">
      {course.title}
    </p>
    <span
      className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${badge.className}`}
    >
      {badge.icon}
      {badge.label}
    </span>
  </div>
);

const YourCoursesStep = ({
  course,
  siblings,
  loading,
  onContinue,
}: {
  course: Course;
  siblings: Course[];
  loading: boolean;
  onContinue: () => void;
}) => {
  return (
    <div className="w-full h-full flex flex-col gap-8">
      <div className="heading w-full flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-text-primary">Courses</h2>
        <span className="text-base text-text-primary">
          Enrolling in this course also unlocks{" "}
          <span className="font-bold text-orange-600">
            {siblings.length}{" "}
            {siblings.length === 1 ? "course" : "courses"}
          </span>{" "}
          from the same category — free.
        </span>
      </div>

      {loading ? (
        <div className="w-full flex items-center justify-center py-10">
          <Loader size="md" variant="spinner" />
        </div>
      ) : (
        <div className="w-full flex flex-col gap-4">
          <CourseRow
            course={course}
            badge={{
              label: "Included",
              className: "bg-orange-100 text-orange-700",
              icon: <Check className="w-3.5 h-3.5" />,
            }}
          />

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              You also get these free
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="w-full flex flex-col gap-3">
            {siblings.map((sibling) => (
              <CourseRow
                key={sibling._id || sibling.slug}
                course={sibling}
                badge={{
                  label: "Free",
                  className: "bg-green-100 text-green-700",
                  icon: <Gift className="w-3.5 h-3.5" />,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <OrangeButton
        className="w-full text-base font-bold py-3 px-6 font-plus-jakarta"
        glow
        onClick={onContinue}
      >
        Continue
      </OrangeButton>
    </div>
  );
};

export default YourCoursesStep;
