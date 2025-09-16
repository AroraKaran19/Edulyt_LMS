import { CourseReducerProvider } from "../../reducers/course/providers/CourseReducerProvider";
import { ScreenProvider } from "./contexts/ScreenContext";
import { StepwiseProvider } from "./contexts/StepwiseContext";

export default function CreateCourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CourseReducerProvider>
      <StepwiseProvider>
        <ScreenProvider>
          {children}
        </ScreenProvider>
      </StepwiseProvider>
    </CourseReducerProvider>
  );
}
