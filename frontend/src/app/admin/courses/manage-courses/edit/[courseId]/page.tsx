"use client";
import Container from "@/app/admin/components/ui/Container";
import FlexBox from "@/components/ui/FlexBox";
import { BookOpenIcon } from "lucide-react";
import React from "react";
import { 
  EditScreen1 as Screen1,
  EditScreen2 as Screen2,
  EditScreen3 as Screen3,
  EditScreen4 as Screen4,
  EditScreen5 as Screen5,
  EditScreen6 as Screen6,
  EditScreen7 as Screen7,
  EditScreen8 as Screen8
} from "./components/EditScreens";
import { EditScreenProvider, useEditScreen } from "./contexts/EditScreenContext";
import { EditCourseReducerProvider, useEditCourseContext } from "./contexts/EditCourseReducerProvider";

interface EditCourseContentProps {
  courseId: string;
}

const EditCourseContent = ({ courseId }: EditCourseContentProps) => {
  const { activeScreen } = useEditScreen();
  const { isLoading, loadError } = useEditCourseContext();

  if (isLoading) {
    return (
      <FlexBox className="w-full h-full flex-col gap-8 px-8 relative">
        <Container
          title="Loading Course..."
          icon={BookOpenIcon}
          className="rounded-t-none flex-shrink-0"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading course data...</p>
          </div>
        </div>
      </FlexBox>
    );
  }

  if (loadError) {
    return (
      <FlexBox className="w-full h-full flex-col gap-8 px-8 relative">
        <Container
          title="Error Loading Course"
          icon={BookOpenIcon}
          className="rounded-t-none flex-shrink-0"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Failed to Load Course
            </h2>
            <p className="text-gray-600 mb-8">
              {loadError}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </FlexBox>
    );
  }

  return (
    <FlexBox className="w-full h-full flex-col gap-8 px-8 relative">
      <Container
        title="Edit Course"
        icon={BookOpenIcon}
        className="rounded-t-none flex-shrink-0"
      />
      <FlexBox className="w-full flex-1 min-h-0 flex-col">
        {activeScreen === "screen1" && <Screen1 />}
        {activeScreen === "screen2" && <Screen2 />}
        {activeScreen === "screen3" && <Screen3 />}
        {activeScreen === "screen4" && <Screen4 />}
        {activeScreen === "screen5" && <Screen5 />}
        {activeScreen === "screen6" && <Screen6 />}
        {activeScreen === "screen7" && <Screen7 />}
        {activeScreen === "screen8" && <Screen8 courseId={courseId} />}
      </FlexBox>
    </FlexBox>
  );
};

interface EditCoursePageProps {
  params: Promise<{
    courseId: string;
  }>;
}

const EditCoursePage = ({ params }: EditCoursePageProps) => {
  const { courseId } = React.use(params);
  
  return (
    <EditCourseReducerProvider courseId={courseId}>
      <EditScreenProvider courseId={courseId}>
        <EditCourseContent courseId={courseId} />
      </EditScreenProvider>
    </EditCourseReducerProvider>
  );
};

export default EditCoursePage;
