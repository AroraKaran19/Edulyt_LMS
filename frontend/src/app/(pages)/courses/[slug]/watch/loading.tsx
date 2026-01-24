import CoursePageSkeleton from "@/components/ui/course/CoursePageSkeleton";

const Loading = () => {
  return (
    <div className="min-h-[calc(100vh-100px)] w-full">
      <CoursePageSkeleton />
    </div>
  );
};

export default Loading;
